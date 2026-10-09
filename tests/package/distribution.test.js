import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import QueryForm from '@queryform/queryformjs';
const require = createRequire(import.meta.url);

test('ESM and CommonJS package exports initialize without a browser', async () => {
  assert.equal(await new QueryForm().init(), undefined);
  const CommonQueryForm = require('@queryform/queryformjs');
  assert.equal(await new CommonQueryForm().init(), undefined);
});

test('browser distribution fills submitted fields and preserves public getters', async () => {
  const dom = new JSDOM('<form><input name="utm_source" class="qf_utm_source"></form>', {
    url: 'https://example.test/?utm_source=newsletter', runScripts: 'outside-only',
  });
  try {
    dom.window.eval(readFileSync(new URL('../../dist/queryform.umd.js', import.meta.url), 'utf8'));
    const qf = new dom.window.QueryForm();
    await qf.init({ local: true }, [{ param: 'utm_source', class_name: 'qf_utm_source' }]);
    assert.equal(new dom.window.FormData(dom.window.document.querySelector('form')).get('utm_source'), 'newsletter');
    assert.equal(qf.getStoredParams()[0].param, 'utm_source');
    assert.equal(qf.getStoredParamValues().utm_source.value, 'newsletter');
    assert.equal(qf.getSavedQueryformData().params.length, 1);
    assert.equal(qf.getCacheUntil(), null);
  } finally { dom.window.close(); }
});
