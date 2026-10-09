import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import QueryForm from '../src/queryform.js';

const mapping = [{ param: 'utm_source', class_name: 'qf_utm_source' }];
const originalFetch = globalThis.fetch;
const originalEvent = globalThis.Event;
let dom;
function page(html = '<input name="utm_source" class="qf_utm_source">', search = '?utm_source=hello') {
  dom = new JSDOM(html, { url: `https://example.test/${search}` });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Event = dom.window.Event;
  return document.querySelector('input');
}
afterEach(() => {
  dom?.window.close();
  delete globalThis.window;
  delete globalThis.document;
  globalThis.fetch = originalFetch;
  globalThis.Event = originalEvent;
});

test('remote API envelope populates a real submitted field and emits events', async () => {
  const input = page('<form><input name="utm_source" class="qf_utm_source"></form>');
  let events = [];
  input.addEventListener('input', () => events.push('input'));
  input.addEventListener('change', () => events.push('change'));
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ parameters: mapping }) });
  assert.equal(await new QueryForm('site').init({ emitEvents: true }), undefined);
  assert.equal(new window.FormData(document.querySelector('form')).get('utm_source'), 'hello');
  assert.deepEqual(events, ['input', 'change']);
});

test('legacy array response and local mode both work', async () => {
  const input = page();
  globalThis.fetch = async () => ({ ok: true, json: async () => mapping });
  assert.equal(await new QueryForm('site').init(), undefined);
  assert.equal(input.value, 'hello');
  globalThis.fetch = () => { throw new Error('local mode must not fetch'); };
  assert.equal(await new QueryForm().init({ local: true }, mapping), undefined);
});

test('corrupt or inaccessible storage never prevents URL population', async () => {
  const input = page();
  window.localStorage.setItem('queryform', '{broken');
  assert.equal(await new QueryForm().init({ local: true }, mapping), undefined);
  Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } });
  input.value = '';
  const qf = new QueryForm();
  assert.equal(await qf.init({ local: true }, mapping), undefined);
  assert.equal(input.value, 'hello');
  window.history.replaceState({}, '', '/');
  input.value = '';
  qf.refresh();
  assert.equal(input.value, 'hello');
});

test('storage quota failure keeps new URL attribution in memory', async () => {
  const input = page();
  const qf = new QueryForm();
  window.localStorage.setItem(qf.storageKey, JSON.stringify({ params: mapping, values: { utm_source: { class_name: 'qf_utm_source', value: 'old' } }, cacheUntil: null }));
  window.Storage.prototype.setItem = () => { throw new Error('quota'); };
  await qf.init({ local: true }, mapping);
  assert.equal(input.value, 'hello');
  window.history.replaceState({}, '', '/');
  input.value = '';
  qf.refresh();
  assert.equal(input.value, 'hello');
});

test('opt-in empty clearing and zero URL values replace previous attribution', async () => {
  const input = page();
  const qf = new QueryForm();
  await qf.init({ local: true, clearEmptyValues: true }, mapping);
  window.history.replaceState({}, '', '/?utm_source=');
  qf.refresh();
  assert.equal(input.value, '');
  window.history.replaceState({}, '', '/?utm_source=0');
  qf.refresh();
  assert.equal(input.value, '0');
});

test('opt-in website storage is isolated', async () => {
  const input = page();
  const first = new QueryForm('first');
  await first.init({ local: true, scopedStorage: true }, mapping);
  window.history.replaceState({}, '', '/');
  input.value = '';
  await new QueryForm('second').init({ local: true, scopedStorage: true }, mapping);
  assert.equal(input.value, '');

});

test('punctuation in class names is literal; wrappers fill every supported child', async () => {
  page('<div class="qf:a.b"><input><textarea></textarea><select><option value="hello">Hello</option></select><input type="password"><input type="file"></div>');
  await new QueryForm().init({ local: true, expandedFields: true }, [{ param: 'utm_source', class_name: 'qf:a.b' }]);
  for (const element of document.querySelectorAll('input:not([type]), textarea, select')) assert.equal(element.value, 'hello');
  assert.equal(document.querySelector('[type=password]').value, '');
  assert.equal(document.querySelector('[type=file]').value, '');
});

test('refresh populates dynamically inserted fields without redundant events', async () => {
  const input = page();
  const qf = new QueryForm();
  await qf.init({ local: true }, mapping);
  let events = 0;
  input.addEventListener('input', () => events++);
  const later = document.createElement('input');
  later.className = 'qf_utm_source';
  document.body.append(later);
  window.history.replaceState({}, '', '/');
  qf.refresh();
  assert.equal(later.value, 'hello');
  assert.equal(events, 0);
});

test('failed requests and invalid payloads fail gracefully', async () => {
  const input = page();
  for (const response of [
    { ok: false, status: 403 },
    { ok: true, json: async () => ({ parameters: null }) },
    { ok: true, json: async () => [null] },
  ]) {
    globalThis.fetch = async () => response;
    assert.equal(await new QueryForm('site').init(), undefined);
    assert.equal(input.value, '');
  }
  globalThis.fetch = async () => { throw new Error('offline'); };
  assert.equal(await new QueryForm('site').init(), undefined);
});

test('concurrent init calls share one request', async () => {
  page();
  let calls = 0;
  globalThis.fetch = async () => { calls++; return { ok: true, json: async () => ({ parameters: mapping }) }; };
  const qf = new QueryForm('site');
  assert.deepEqual(await Promise.all([qf.init(), qf.init()]), [undefined, undefined]);
  assert.equal(calls, 1);
});

test('prototype-like parameter names are stored as data', async () => {
  const input = page(undefined, '?__proto__=safe');
  const qf = new QueryForm();
  await qf.init({ local: true }, [{ param: '__proto__', class_name: 'qf_utm_source' }]);
  assert.equal(input.value, 'safe');
  assert.equal(Object.getPrototypeOf(qf.values), Object.prototype);
  assert.equal(qf.getStoredParamValues().__proto__.value, 'safe');
});

test('clear removes attribution and retains unrelated storage', async () => {
  page();
  const qf = new QueryForm('site');
  await qf.init({ local: true }, mapping);
  window.localStorage.setItem('unrelated', 'keep');
  qf.clear();
  assert.deepEqual(qf.getStoredParamValues(), {});
  assert.equal(window.localStorage.getItem('unrelated'), 'keep');
});

test('module is safe to import and initialize without a browser', async () => {
  assert.equal(await new QueryForm().init(), undefined);
});

test('cached mappings are reused across instances and invalid expiry refetches', async () => {
  const input = page();
  let calls = 0;
  globalThis.fetch = async () => { calls++; return { ok: true, json: async () => ({ parameters: mapping }), headers: { get: () => '2099-01-01T00:00:00Z' } }; };
  await new QueryForm('site').init();
  input.value = '';
  const qf = new QueryForm('site');
  await qf.init();
  assert.equal(calls, 1);
  assert.equal(input.value, 'hello');
  assert.equal(qf.ready, true);
  qf.saveQueryformData(mapping, qf.getStoredParamValues(), 'not a date');
  await qf.init();
  assert.equal(calls, 2);
});

test('opt-in form events fire once per change; default wrappers only fill first input', async () => {
  page('<div class="qf_utm_source"><input><input></div>');
  let events = 0;
  document.addEventListener('input', () => events++);
  const qf = new QueryForm();
  await qf.init({ local: true }, mapping);
  assert.deepEqual([...document.querySelectorAll('input')].map(input => input.value), ['hello', '']);
  assert.equal(events, 0);
  await qf.init({ local: true, expandedFields: true, emitEvents: true }, mapping);
  assert.equal(events, 1);
  qf.refresh();
  assert.equal(events, 1);
});

test('malformed stored records and failed configuration leave ready false without throwing', async () => {
  page();
  window.localStorage.setItem('queryform', JSON.stringify({ params: [null], values: null }));
  globalThis.fetch = async () => { throw new Error('offline'); };
  const qf = new QueryForm('site');
  assert.equal(await qf.init(), undefined);
  assert.equal(qf.ready, false);
  await qf.init({ local: true }, mapping);
  assert.equal(qf.ready, true);
});
