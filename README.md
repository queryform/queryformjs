# QueryForm JS

Capture campaign parameters from a landing-page URL, remember them across pages, and include them in a form submission. QueryForm JS has no runtime dependencies and supports plain HTML and JavaScript applications.

Use local configuration without an account or API. Use a QueryForm website ID when you want to manage mappings through the hosted dashboard.

## Install

```sh
npm install @queryform/queryformjs
```

The repository prepares version **0.2.0**. GitHub updates do not publish a new npm version; check the registry version before relying on the new API. To use this checkout directly, run `npm ci && npm run build` and serve the generated files from `dist/`.

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
const ready = await qf.init({ local: true }, [
  { param: 'utm_source', class_name: 'qf_utm_source' }
]);
```

CommonJS uses `const QueryForm = require('@queryform/queryformjs')`. TypeScript declarations are included. Browser scripts expose the case-sensitive global `QueryForm`.

## Managed configuration

```js
const qf = new QueryForm('your-public-website-id');
const ready = await qf.init({ debug: true });
```

For self-hosting, pass the API prefix as the second constructor argument:

```js
const qf = new QueryForm('website-id', 'https://your-service.example/api/website/');
await qf.init();
```

The API must return `{ "parameters": [{ "param": "utm_source", "class_name": "qf_utm_source" }] }`; an array response is also accepted. The hosted API checks the registered hostname and subscription. The website ID is public, not a credential. Network failures return `false`; `debug: true` logs diagnostic information.

## Public API

| Method | Behavior |
| --- | --- |
| `init(options?, mappings?)` | Resolves to `true` on success or `false` on failure. Options are `local` and `debug`, both false by default. Concurrent calls on one instance share its first initialization. |
| `refresh()` | Captures the current URL and populates available form controls. Call after SPA navigation or inserting a form asynchronously. |
| `getStoredParams()` | Returns configured `{ param, class_name }` mappings, retaining the 0.1.x getter shape. |
| `getStoredParamValues()` | Returns captured values keyed by parameter name, each with `class_name` and `value`. |
| `getSavedQueryformData()` | Compatibility snapshot containing `params`, `values`, and `cacheUntil: null`. |
| `getCacheUntil()` | Returns `null`; version 0.2 no longer caches remote configuration in the browser. |
| `clear()` | Clears this instance's attribution from memory and its storage key. Existing field values are not erased. |

Imports are safe during server-side rendering; initialize on the client. In Vue, use `onMounted`; in React, initialize after the form mounts. For dynamically rendered forms, call `refresh()` once the controls exist. QueryForm emits bubbling `input` and `change` events only when a value changes; controlled framework inputs may require your application's state integration.

## Storage and field behavior

- Only configured query parameters are retained. The first value wins if a URL repeats a parameter. A present empty value clears prior attribution for that parameter.
- Values are stored under `queryform_data:<websiteId>`, or `queryform_data:local` in local mode without an ID. Pass a distinct ID with local mode to isolate multiple configurations on one origin.
- Persistence has no automatic expiration. Denied storage, quota errors, and corrupted JSON fall back to memory for the current instance.
- A configured class may be on an input, textarea, select, or wrapper. All supported controls inside a wrapper receive the value. Password, file, checkbox, radio, and button inputs are excluded.
- Class names are treated literally. Configuration must provide a nonempty parameter name and a single nonempty class token.
- Initialization waits for DOM readiness. There is no automatic DOM observer, polling, or SPA router hook.
- Initialize only after consent when required by your application. On withdrawal, call `clear()` and stop invoking capture methods. `refresh()` will capture the current URL again.

## Migrating from 0.1.x

Version 0.2 changes storage and initialization behavior. Review these changes before deploying:

1. Shared `queryform` and `queryform_data` storage is not imported. Scoped storage prevents one website's configuration from affecting another, but starts a new attribution history. Old keys remain until your application explicitly removes them.
2. Remote configuration is fetched on each sequential `init()` call. Previous browser caching mixed configurations and depended on ambiguous timezone strings. This can increase API request counts; prefer `refresh()` for SPA navigation after initial configuration.
3. `init()` now resolves to a boolean. Invalid mappings and failed requests return `false`; diagnostics are enabled with `debug: true`.
4. `getStoredParams()` still returns mappings and `getStoredParamValues()` still returns captured values. Cache getters return `null`. Internal 0.1.x helpers are no longer supported public entry points.
5. Empty URL values replace old values. Field updates now notify listeners, and wrappers populate every supported descendant.
6. The package entry point supports CommonJS via `.cjs` while retaining `dist/queryform.umd.js` for browser scripts and `dist/queryform.es.js` for existing ESM imports.

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

The package manifest declares ISC. This update preserves that declaration and corrects the old README's conflicting MIT claim. A full license file and confirmed copyright attribution still need to be supplied by the project owner before a package release.
