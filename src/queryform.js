/** Persist configured URL parameters and populate matching form controls. */
export default class QueryForm {
  constructor(websiteId = null, apiRoute = 'https://queryform.co/api/website/') {
    this.websiteId = websiteId;
    this.apiRoute = apiRoute;
    this.domainUTMs = [];
    this.storageKey = `queryform_data:${websiteId || 'local'}`;
    this.values = {};
    this.storageFailed = false;
    this.pending = null;
  }

  /** Returns false on configuration/network failure; safe to import during SSR. */
  async init(config = {}, parameters = []) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    if (this.pending) return this.pending;
    this.pending = this.initialize(config, parameters);
    try {
      return await this.pending;
    } finally {
      this.pending = null;
    }
  }

  async initialize(config, parameters) {
    try {
      let data = parameters;
      if (!config.local) {
        if (!this.websiteId) throw new Error('A website ID is required for remote configuration.');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
          const response = await fetch(`${this.apiRoute}${encodeURIComponent(this.websiteId)}`, {
            signal: controller.signal,
            credentials: 'omit',
            headers: { Accept: 'application/json' },
          });
          if (!response.ok) throw new Error(`Configuration request failed (${response.status}).`);
          const body = await response.json();
          data = Array.isArray(body) ? body : body?.parameters;
        } finally {
          clearTimeout(timeout);
        }
      }
      if (!Array.isArray(data) || data.some(item =>
        !item || typeof item.param !== 'string' || !item.param ||
        typeof item.class_name !== 'string' || !item.class_name || /\s/.test(item.class_name)
      )) throw new Error('Expected an array of { param, class_name } mappings.');

      this.domainUTMs = data;
      this.values = this.getStoredParamValues();
      this.capture();
      if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
      }
      this.populate();
      if (config.debug) console.info('QueryForm: parameters synced.');
      return true;
    } catch (error) {
      this.domainUTMs = [];
      if (config.debug) console.warn('QueryForm:', error);
      return false;
    }
  }

  getStoredParamValues() {
    let stored = this.values;
    try {
      const raw = this.storageFailed ? null : window.localStorage.getItem(this.storageKey);
      if (raw !== null) stored = JSON.parse(raw);
    } catch {
      // Storage may be blocked, full, or contain malformed JSON. Keep in-memory values.
    }
    return Object.fromEntries(this.domainUTMs.flatMap(({ param, class_name }) => {
      const entry = stored && Object.hasOwn(stored, param) ? stored[param] : null;
      return entry && typeof entry.value === 'string' ? [[param, { class_name, value: entry.value }]] : [];
    }));
  }

  /** Configured mappings; retained for compatibility with the 0.1.x package. */
  getStoredParams() {
    return this.domainUTMs.map(mapping => ({ ...mapping }));
  }

  getSavedQueryformData() {
    return { params: this.getStoredParams(), values: this.getStoredParamValues(), cacheUntil: null };
  }

  getCacheUntil() {
    return null;
  }

  capture() {
    const query = new URLSearchParams(window.location.search);
    for (const { param, class_name } of this.domainUTMs) {
      if (query.has(param)) {
        // defineProperty also handles query parameters named "__proto__" safely.
        Object.defineProperty(this.values, param, {
          value: { class_name, value: query.get(param) }, enumerable: true, configurable: true, writable: true,
        });
      }
    }
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.values));
    } catch {
      this.storageFailed = true;
      // URL values still populate this page when persistence is unavailable.
    }
  }

  /** Call after an SPA navigation or after inserting a form asynchronously. */
  refresh() {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    this.values = this.getStoredParamValues();
    this.capture();
    this.populate();
  }

  populate() {
    for (const { param, class_name } of this.domainUTMs) {
      if (!Object.hasOwn(this.values, param)) continue;
      // Class lookup treats punctuation literally and avoids selector injection.
      const targets = new Set();
      for (const element of Array.from(document.getElementsByClassName(class_name))) {
        if (element.matches('input, textarea, select')) targets.add(element);
        else for (const input of element.querySelectorAll('input, textarea, select')) targets.add(input);
      }
      for (const input of targets) {
        if (input.matches('input[type="file"], input[type="password"], input[type="checkbox"], input[type="radio"], input[type="submit"], input[type="button"], input[type="reset"]')) continue;
        const value = this.values[param].value;
        if (input.value === value) continue;
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  /** Clear this instance's attribution data, e.g. when consent is withdrawn. */
  clear() {
    this.values = {};
    this.storageFailed = true;
    try { window.localStorage.removeItem(this.storageKey); } catch { /* Storage unavailable. */ }
  }
}
