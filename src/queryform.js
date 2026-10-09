const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const validMappings = mappings => Array.isArray(mappings) && mappings.every(item =>
  item && typeof item.param === 'string' && item.param.length > 0 &&
  typeof item.class_name === 'string' && item.class_name.length > 0 && !/\s/.test(item.class_name));
const cleanValues = values => Object.fromEntries(Object.entries(values || {}).filter(([, item]) =>
  item && typeof item.value === 'string' && typeof item.class_name === 'string'
).map(([key, item]) => [key, { class_name: item.class_name, value: item.value }]));

/** Capture attribution with the 0.1.x API and storage contract. */
export default class QueryForm {
  constructor(websiteId = null, apiRoute = 'https://queryform.co/api/website/') {
    this.websiteId = websiteId;
    this.apiRoute = apiRoute;
    this.domainUTMs = [];
    this.debug = false;
    this.local = false;
    this.cacheUntil = null;
    this.storageKey = 'queryform';
    this.values = {};
    this.snapshot = {};
    this.storageFailed = false;
    this.pending = null;
    this.ready = false;
    this.options = {};
  }

  /** Retains Promise<void>; inspect ready after awaiting to check success. */
  async init(config = {}, parameters = []) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (this.pending) return this.pending;
    this.options = config || {};
    this.debug = !!this.options.debug;
    this.local = !!this.options.local;
    const storageKey = this.options.scopedStorage ? `queryform_data:${this.websiteId || 'local'}` : 'queryform';
    if (storageKey !== this.storageKey) {
      this.storageKey = storageKey;
      this.snapshot = {};
      this.storageFailed = false;
    }
    this.ready = false;
    this.pending = this.initialize(parameters);
    try { await this.pending; } finally { this.pending = null; }
  }

  async initialize(parameters) {
    try {
      if (this.local) {
        if (!validMappings(parameters)) throw new Error('Expected { param, class_name } mappings.');
        this.fetchLocalParams(parameters);
      } else {
        const saved = this.getSavedQueryformData();
        const expires = Date.parse(saved.cacheUntil);
        if (!validMappings(saved.params) || !(expires > Date.now())) await this.fetchDomainParams();
      }
      if (!validMappings(this.getSavedQueryformData().params)) return;
      this.configureQueryform();
      // Preserve synchronous local-mode population, then catch forms parsed later.
      if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
        this.configureQueryform();
      }
      this.ready = true;
    } catch (error) { this.logMessage(error); }
  }

  async fetchDomainParams() {
    let timer;
    try {
      if (!this.websiteId) throw new Error('A website ID is required.');
      const controller = typeof AbortController === 'undefined' ? null : new AbortController();
      if (controller) timer = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${this.apiRoute}${encodeURIComponent(this.websiteId)}`, {
        ...(controller ? { signal: controller.signal } : {}), headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Configuration request failed (${response.status}).`);
      const body = await response.json();
      const mappings = Array.isArray(body) ? body : body?.parameters;
      if (!validMappings(mappings)) throw new Error('Invalid configuration response.');
      this.saveQueryformData(mappings, this.getStoredParamValues() || {}, response.headers?.get('X-Queryform-Cache-Until') || null);
    } catch (error) {
      // 0.1.x continued using saved mappings on network failure.
      this.logMessage(error);
    } finally { clearTimeout(timer); }
  }

  fetchLocalParams(parameters) {
    if (!validMappings(parameters)) { this.logMessage('Invalid local mappings.'); return; }
    this.saveQueryformData(parameters, this.getStoredParamValues() || {}, null);
  }

  getSavedQueryformData() {
    if (!this.storageFailed) {
      try {
        const raw = window.localStorage.getItem(this.storageKey);
        if (raw !== null) {
          const data = JSON.parse(raw);
          if (data && validMappings(data.params)) {
            this.snapshot = { params: data.params.map(item => ({ ...item })), values: cleanValues(data.values), cacheUntil: typeof data.cacheUntil === 'string' ? data.cacheUntil : null };
          }
        } else this.snapshot = {};
      } catch { /* Retain last valid in-memory snapshot. */ }
    }
    return this.snapshot;
  }

  getStoredParams() { return this.getSavedQueryformData().params; }
  getStoredParamValues() { return this.getSavedQueryformData().values; }
  getCacheUntil() { return this.getSavedQueryformData().cacheUntil; }

  saveQueryformData(params, values, cacheUntil) {
    if (!validMappings(params)) return this.getSavedQueryformData();
    this.domainUTMs = params.map(item => ({ ...item }));
    this.values = cleanValues(values);
    this.cacheUntil = typeof cacheUntil === 'string' ? cacheUntil : null;
    this.snapshot = { params: this.domainUTMs, values: this.values, cacheUntil: this.cacheUntil };
    try { window.localStorage.setItem(this.storageKey, JSON.stringify(this.snapshot)); }
    catch { this.storageFailed = true; }
    return this.snapshot;
  }

  isLocalStorageAvailable() {
    try { return typeof window !== 'undefined' && !!window.localStorage; } catch { return false; }
  }

  logMessage(message) { if (this.debug) console.info('QueryForm:', message); }

  parseURLParams() {
    if (typeof window === 'undefined') return null;
    const query = new URLSearchParams(window.location.search);
    const result = Object.fromEntries((this.getStoredParams() || []).filter(({ param }) => query.has(param)).map(({ param }) => [param, query.get(param)]));
    return Object.keys(result).length ? result : null;
  }

  storeParams(queryParams) {
    if (!queryParams) return;
    const saved = this.getSavedQueryformData();
    const values = cleanValues(saved.values);
    for (const { param, class_name } of saved.params || []) {
      if (owns(queryParams, param) && typeof queryParams[param] === 'string' && (queryParams[param] || this.options.clearEmptyValues)) {
        Object.defineProperty(values, param, { value: { class_name, value: queryParams[param] }, enumerable: true, configurable: true, writable: true });
      }
    }
    this.saveQueryformData(saved.params || [], values, saved.cacheUntil);
  }

  configureQueryform() {
    this.storeParams(this.parseURLParams());
    const saved = this.getSavedQueryformData();
    this.domainUTMs = saved.params || [];
    this.values = saved.values || {};
    this.populateFormInputs(this.values, this.domainUTMs);
  }

  populateFormInputs(storedParams, domainUTMs) {
    if (typeof document === 'undefined' || !validMappings(domainUTMs)) return;
    const handled = new Set();
    for (const { param, class_name } of domainUTMs) {
      if (!storedParams || !owns(storedParams, param) || typeof storedParams[param]?.value !== 'string') continue;
      const targets = new Set();
      for (const element of Array.from(document.getElementsByClassName(class_name))) {
        if (this.options.expandedFields) {
          if (element.matches('input, textarea, select')) targets.add(element);
          else for (const input of element.querySelectorAll('input, textarea, select')) targets.add(input);
        } else {
          if (handled.has(element)) continue;
          const firstClass = Array.from(element.classList).find(name => Object.values(storedParams).some(item => item.class_name === name));
          if (firstClass !== class_name) continue;
          handled.add(element);
          const input = element.tagName.toLowerCase() === 'input' ? element : element.querySelector('input');
          if (input) targets.add(input);
        }
      }
      for (const input of targets) {
        // Browsers prohibit assigning nonempty file paths.
        if (input.matches('input[type="file"]')) continue;
        if (this.options.expandedFields && input.matches('input[type="password"], input[type="checkbox"], input[type="radio"], input[type="submit"], input[type="button"], input[type="reset"]')) continue;
        const value = storedParams[param].value;
        if (input.value === value) continue;
        input.value = value;
        if (this.options.emitEvents) {
          const EventClass = input.ownerDocument.defaultView.Event;
          input.dispatchEvent(new EventClass('input', { bubbles: true }));
          input.dispatchEvent(new EventClass('change', { bubbles: true }));
        }
      }
    }
  }

  refresh() { if (typeof window !== 'undefined') this.configureQueryform(); }
  capture() { this.storeParams(this.parseURLParams()); }
  populate() { this.populateFormInputs(this.getStoredParamValues(), this.getStoredParams() || []); }

  clear() {
    this.values = {};
    this.snapshot = { params: this.domainUTMs, values: {}, cacheUntil: this.cacheUntil };
    try { window.localStorage.setItem(this.storageKey, JSON.stringify(this.snapshot)); }
    catch { this.storageFailed = true; }
  }
}
