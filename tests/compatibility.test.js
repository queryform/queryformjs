import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import LegacyQueryForm from './fixtures/queryform-0.1.4.js';
import QueryForm from '../src/queryform.js';

// Fixture is the ESM distribution from npm @queryform/queryformjs@0.1.4 (ISC).
const mappings = [{ param: 'utm_source', class_name: 'qf_source' }];
const seed = { params: mappings, values: { utm_source: { class_name: 'qf_source', value: 'newsletter' } }, cacheUntil: null };
async function scenario(Client, { search = '', cached = false, offline = false, local = true } = {}) {
  const dom = new JSDOM('<form><div class="qf_source"><input name="first"><input name="second"></div></form>', { url: `https://example.test/${search}` });
  const previous = Object.fromEntries(['window', 'document', 'localStorage', 'Storage', 'fetch'].map(key => [key, globalThis[key]]));
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, Storage: dom.window.Storage });
  const data = structuredClone(seed);
  if (cached) data.cacheUntil = '2099-01-01T00:00:00Z';
  localStorage.setItem('queryform', JSON.stringify(data));
  let requests = 0, events = 0;
  document.addEventListener('input', () => events++);
  globalThis.fetch = async () => {
    requests++;
    if (offline) throw new Error('offline');
    return { ok: true, json: async () => ({ parameters: mappings }), headers: { get: () => '2099-01-01T00:00:00Z' } };
  };
  try {
    const qf = new Client('site');
    const result = await qf.init({ local }, mappings);
    return { result, requests, events, fields: [...document.querySelectorAll('input')].map(input => input.value), params: qf.getStoredParams(), values: qf.getStoredParamValues(), cache: qf.getCacheUntil(), saved: JSON.parse(localStorage.getItem('queryform')) };
  } finally {
    dom.window.close();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
  }
}
for (const [name, options] of Object.entries({
  'returning visitor retains attribution': {},
  'new campaign replaces attribution': { search: '?utm_source=paid' },
  'empty campaign preserves attribution': { search: '?utm_source=' },
  'zero string is captured': { search: '?utm_source=0' },
  'cached remote configuration avoids fetching': { local: false, cached: true },
  'remote response keeps cache header': { local: false },
  'offline initialization uses stored configuration': { local: false, offline: true },
})) test(`0.1.4 parity: ${name}`, async () => {
  assert.deepEqual(await scenario(QueryForm, options), await scenario(LegacyQueryForm, options));
});

test('all legacy prototype entry points remain available', () => {
  for (const name of Object.getOwnPropertyNames(LegacyQueryForm.prototype)) assert.equal(typeof QueryForm.prototype[name], 'function', name);
});

test('legacy helpers work before init and across instances; local init populates synchronously', async () => {
  const dom = new JSDOM('<input class="qf_source">', { url: 'https://example.test/?utm_source=now' });
  globalThis.window = dom.window; globalThis.document = dom.window.document;
  try {
    const qf = new QueryForm();
    assert.equal(qf.getStoredParams(), undefined);
    qf.saveQueryformData(mappings, seed.values, null);
    assert.deepEqual(new QueryForm().getStoredParamValues(), seed.values);
    assert.deepEqual(qf.parseURLParams(), { utm_source: 'now' });
    const completion = qf.init({ local: true }, mappings);
    assert.equal(document.querySelector('input').value, 'now');
    assert.equal(await completion, undefined);
    assert.equal(qf.ready, true);
    qf.clear();
    assert.deepEqual(new QueryForm().getStoredParamValues(), {});
  } finally { dom.window.close(); delete globalThis.window; delete globalThis.document; }
});
