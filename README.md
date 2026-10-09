# QueryForm JS

Capture campaign parameters from a landing-page URL, remember them across pages, and include them in a form submission. QueryForm JS has no runtime dependencies and supports plain HTML and JavaScript applications.

Use local configuration without an account or API. Use a QueryForm website ID when you want to manage mappings through the hosted dashboard.

## Install

```sh
npm install @queryform/queryformjs
```

The repository prepares version **0.1.5**. GitHub updates do not publish a new npm version; check the registry version before relying on the new API. To use this checkout directly, run `npm ci && npm run build` and serve the generated files from `dist/`.

## Local configuration

```html
<form action="/contact" method="post">
  <input type="hidden" name="utm_source" class="qf_utm_source">
  <input type="hidden" name="utm_campaign" class="qf_utm_campaign">
  <button type="submit">Send</button>
</form>
<script src="/queryform.umd.js"></script>
<script>
  const qf = new QueryForm();
  qf.init({ local: true }, [
    { param: 'utm_source', class_name: 'qf_utm_source' },
    { param: 'utm_campaign', class_name: 'qf_utm_campaign' }
  ]);
</script>
```

Serve `dist/queryform.umd.js` at the URL used above. Visit the page with `?utm_source=newsletter&utm_campaign=launch`, then navigate to another page on the same origin using the same configuration. Fields retain the captured values. Their `name` attributes are essential for normal form submissions.

For a bundler or an ES module:

```js
import QueryForm from '@queryform/queryformjs';

const qf = new QueryForm();
await qf.init({ local: true }, [
  { param: 'utm_source', class_name: 'qf_utm_source' }
]);
```

CommonJS uses `const QueryForm = require('@queryform/queryformjs')`. TypeScript declarations are included. Browser scripts expose the case-sensitive global `QueryForm`.

## Managed configuration

```js
const qf = new QueryForm('your-public-website-id');
await qf.init({ debug: true });
```

For self-hosting, pass the API prefix as the second constructor argument:

```js
const qf = new QueryForm('website-id', 'https://your-service.example/api/website/');
await qf.init();
```

The API must return `{ "parameters": [{ "param": "utm_source", "class_name": "qf_utm_source" }] }`; an array response is also accepted. The hosted API checks the registered hostname and subscription. The website ID is public, not a credential. Network failures retain saved configuration when available. `init()` still resolves without a return value; inspect `qf.ready` after awaiting initialization. `debug: true` logs diagnostic information.

## Public API

| Method | Behavior |
| --- | --- |
| `init(options?, mappings?)` | Preserves `Promise<void>`. `local` and `debug` default to false. Concurrent calls share the first initialization. `ready` indicates usable configuration after completion. |
| `refresh()` | Captures the URL and populates fields after SPA navigation or form insertion. |
| `getStoredParams()` | Reads stored mappings, including before initialization. Undefined when none exist. |
| `getStoredParamValues()` | Reads captured `{ class_name, value }` records. Undefined when none exist. |
| `getSavedQueryformData()` | Reads the legacy `{ params, values, cacheUntil }` snapshot. |
| `getCacheUntil()` | Reads the original API cache header; undefined before configuration. |
| `clear()` | Clears attribution while retaining configuration; existing field values are not erased. |

All 0.1.4 prototype methods remain available, including `fetchDomainParams`, `fetchLocalParams`, `configureQueryform`, `parseURLParams`, `storeParams`, `saveQueryformData`, `populateFormInputs`, `isLocalStorageAvailable`, and `logMessage`. Prefer `init` and `refresh` for new integrations.

## Compatible defaults and optional enhancements

Version 0.1.5 retains the published 0.1.4 defaults:

- The existing `queryform` localStorage snapshot is read and written directly. Returning visitors keep attribution, and older scripts on another page can still read new captures. No migration is required.
- Remote configuration respects `X-Queryform-Cache-Until` and falls back to saved mappings after a failed fetch. Servers should supply an ISO 8601 timestamp with timezone. An absent or invalid expiry causes a new fetch.
- Empty URL values leave existing attribution unchanged; `0` remains a valid string value.
- Field assignment is silent and wrapper classes target the first descendant input. Existing inputs are populated synchronously in local mode. Initialization also catches forms parsed later at DOM readiness.
- Browser global `QueryForm`, ESM default imports, and existing distribution paths remain available. CommonJS now has a proper `.cjs` entry point.

New behavior is opt-in:

```js
await qf.init({
  local: true,
  emitEvents: true,       // bubbling input/change events when values change
  clearEmptyValues: true,
  expandedFields: true, // inputs, textareas and selects; all wrapper descendants
  scopedStorage: true   // separate history under queryform_data:<websiteId or local>
}, mappings);
```

Shared storage is retained for compatibility, so multiple configurations on the same origin still share attribution and configuration. Use `scopedStorage` consistently across pages for new isolated integrations, with a distinct website ID for each configuration. It intentionally does not guess ownership or import the shared legacy history. The earlier unreleased 0.2.0 draft is superseded by this compatible release.

## Robustness and boundaries

Storage denial, quota errors, and malformed data fall back to memory. API payloads are validated, array responses are accepted, prototype-like parameter names are handled safely, and class names are treated literally. Mappings require string parameter names and single class tokens. File inputs are skipped because browsers prohibit assigning file paths. These fixes intentionally do not preserve crashes or unsafe malformed-input behavior.

Imports are safe during server-side rendering; initialize on the client. There is no automatic DOM observer or router hook; call `refresh()` after dynamic forms mount. Optional events may still require application-specific integration with controlled framework inputs.

Attribution has no automatic expiry. Initialize only after consent when required. On withdrawal, call `clear()` and stop capture calls; `refresh()` captures again. Shared legacy caching is not an authorization boundary, and stale configuration can remain usable offline, as in 0.1.4.

## Upgrade verification

Tests compare the actual published 0.1.4 distribution with the new implementation for returning visitors, campaign replacement, empty and zero values, remote caching, offline fallback, silent field updates, wrapper behavior, storage shape, getters, and initialization return values. They also verify all legacy prototype methods remain callable. This provides concrete compatibility evidence, not a guarantee for every undocumented integration.

## Development

Use Node.js 22.12+ and npm:

```sh
npm ci
npm test
npm run build
npm run test:package
npm run dev
```

The development server opens `tests/index.html`, a local-only example. The tests exercise storage failures, malformed API data, isolation, dynamic fields, events, and the actual browser/ESM/CommonJS distributions. Edit `src/queryform.js`, then rebuild the checked-in `dist/` artifacts. Commit `package-lock.json` with dependency changes.

Before publishing a package, run the checks above and `npm pack --dry-run`. The repository's CI builds and tests changes; it does not automatically publish to npm.

## Contributing and license

Open a focused issue with a reproduction and expected behavior. Include regression tests with bug fixes. Avoid posting sensitive visitor data or credentials in examples.

The package manifest declares ISC. This update preserves that declaration and corrects the old README's conflicting MIT claim. A full license file and confirmed copyright attribution remain documentation follow-ups.
