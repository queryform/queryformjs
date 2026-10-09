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
  assert.equal(await new QueryForm('site').init(), true);
  assert.equal(new window.FormData(document.querySelector('form')).get('utm_source'), 'hello');
  assert.deepEqual(events, ['input', 'change']);
});

test('legacy array response and local mode both work', async () => {
  const input = page();
  globalThis.fetch = async () => ({ ok: true, json: async () => mapping });
  assert.equal(await new QueryForm('site').init(), true);
  assert.equal(input.value, 'hello');
  globalThis.fetch = () => { throw new Error('local mode must not fetch'); };
  assert.equal(await new QueryForm().init({ local: true }, mapping), true);
});

test('corrupt or inaccessible storage never prevents URL population', async () => {
  const input = page();
  window.localStorage.setItem('queryform_data:local', '{broken');
  assert.equal(await new QueryForm().init({ local: true }, mapping), true);
  Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } });
  input.value = '';
  const qf = new QueryForm();
  assert.equal(await qf.init({ local: true }, mapping), true);
  assert.equal(input.value, 'hello');
  window.history.replaceState({}, '', '/');
  input.value = '';
  qf.refresh();
  assert.equal(input.value, 'hello');
});

test('storage quota failure keeps new URL attribution in memory', async () => {
  const input = page();
  const qf = new QueryForm();
  window.localStorage.setItem(qf.storageKey, JSON.stringify({ utm_source: { value: 'old' } }));
  window.Storage.prototype.setItem = () => { throw new Error('quota'); };
  await qf.init({ local: true }, mapping);
  assert.equal(input.value, 'hello');
  window.history.replaceState({}, '', '/');
  input.value = '';
  qf.refresh();
  assert.equal(input.value, 'hello');
});

test('empty and zero URL values replace previous attribution', async () => {
  const input = page();
  const qf = new QueryForm();
  await qf.init({ local: true }, mapping);
  window.history.replaceState({}, '', '/?utm_source=');
  qf.refresh();
  assert.equal(input.value, '');
  window.history.replaceState({}, '', '/?utm_source=0');
  qf.refresh();
  assert.equal(input.value, '0');
});

test('website storage is isolated and disabled mappings are discarded', async () => {
  const input = page();
  const first = new QueryForm('first');
  await first.init({ local: true }, mapping);
  window.history.replaceState({}, '', '/');
  input.value = '';
  await new QueryForm('second').init({ local: true }, mapping);
  assert.equal(input.value, '');
  await first.init({ local: true }, []);
  assert.deepEqual(first.getStoredParamValues(), {});
});

test('punctuation in class names is literal; wrappers fill every supported child', async () => {
  page('<div class="qf:a.b"><input><textarea></textarea><select><option value="hello">Hello</option></select><input type="password"><input type="file"></div>');
  await new QueryForm().init({ local: true }, [{ param: 'utm_source', class_name: 'qf:a.b' }]);
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
    assert.equal(await new QueryForm('site').init(), false);
    assert.equal(input.value, '');
  }
  globalThis.fetch = async () => { throw new Error('offline'); };
  assert.equal(await new QueryForm('site').init(), false);
});

test('concurrent init calls share one request', async () => {
  page();
  let calls = 0;
  globalThis.fetch = async () => { calls++; return { ok: true, json: async () => ({ parameters: mapping }) }; };
  const qf = new QueryForm('site');
  assert.deepEqual(await Promise.all([qf.init(), qf.init()]), [true, true]);
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

test('clear removes only this website data', async () => {
  page();
  const qf = new QueryForm('site');
  await qf.init({ local: true }, mapping);
  window.localStorage.setItem('unrelated', 'keep');
  qf.clear();
  assert.deepEqual(qf.getStoredParamValues(), {});
  assert.equal(window.localStorage.getItem('unrelated'), 'keep');
});

test('module is safe to import and initialize without a browser', async () => {
  assert.equal(await new QueryForm().init(), false);
});
