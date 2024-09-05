class f {
  constructor(a = null, e = "https://queryform.co/api/website/") {
    this.websiteId = a, this.domainUTMs = [], this.apiRoute = e, this.debug = !1, this.local = !1, this.cacheUntil = null;
  }
  /**
   * Fetch domain parameters from the API
   * @returns {Promise<void>}
   */
  async fetchDomainParams() {
    this.logMessage("Fetching parameters from queryform api.");
    try {
      const a = await fetch(`${this.apiRoute}${this.websiteId}`);
      if (a.ok) {
        const e = await a.json();
        this.domainUTMs = e.parameters;
        const t = a.headers.get("X-Queryform-Cache-Until"), s = this.getSavedQueryformData().values || {};
        this.saveQueryformData(e.parameters, s, t);
      } else
        console.warn("Failed to fetch domain parameters:", a.statusText);
    } catch (a) {
      console.warn("Error fetching domain parameters:", a);
    }
  }
  /**
   * Initialize the Queryform
   * @param {Object} config - Configuration object
   * @param {boolean} config.debug - Enable debug mode
   * @returns {void}
   * @example
   * Retrieve domain parameters from Queryform API
   * const queryform = new Queryform('xxxx-xxxx-xxxx-xxxx');
   * queryform.init();
   * @example
   * Use local domain parameters
   * const queryform = new Queryform();
   * queryform.init({ local: true }, [ { param: 'utm_source', class_name: 'qf_utm_source' } ]);
   */
  async init(a = { debug: !1, local: !1 }, e = []) {
    if (this.debug = a.debug, this.local = a.local, this.local)
      this.fetchLocalParams(e);
    else {
      const t = this.getCacheUntil(), r = new Date(t), s = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "America/New_York" }));
      t && r > s ? this.logMessage(`Cache is still valid until ${t}`) : await this.fetchDomainParams();
    }
    this.configureQueryform();
  }
  /**
   * Fetch local domain parameters
   * @param {Array} utms - Local domain parameters
   *
   *
   * @returns {void}
   * @private
   */
  fetchLocalParams(a) {
    if (!Array.isArray(a)) {
      console.warn("Invalid utms array:", a);
      return;
    }
    if (a.some(({ param: r, class_name: s }) => !r || !s)) {
      console.warn("Invalid utms array sub-items:", a);
      return;
    }
    const t = this.getSavedQueryformData().values || {};
    this.saveQueryformData(a, t, null);
  }
  /**
   * Configure the Queryform
   * @returns {void}
   * @private
   */
  configureQueryform() {
    const a = this.parseURLParams();
    this.storeParams(a);
    const e = this.getSavedQueryformData(), t = e.params, r = e.values;
    r && Object.keys(r).length > 0 && (this.logMessage("Populating form inputs."), this.populateFormInputs(r, t));
  }
  /**
   * Log initialization message
   * @returns {void}
   * @private
   */
  logMessage(a) {
    this.debug && console.log(
      `%c Queryform%c v1.0%c ${a}`,
      "background: #222; color: #2563eb; padding: 10px;",
      "background: #222; color: #fff; font-size:8px; padding: 12px 10px;",
      "background: #222; color: #777; font-size:8px; padding: 12px 10px;"
    );
  }
  /**
   * Check if localStorage is available
   * @returns {boolean}
   * @private
   */
  isLocalStorageAvailable() {
    return typeof Storage < "u";
  }
  /**
   * Parse URL parameters
   * @returns {Object}
   * @private
   */
  parseURLParams() {
    const a = new URLSearchParams(window.location.search);
    if (!a) return;
    const e = {};
    return this.getSavedQueryformData().params.forEach(({ param: r }) => {
      a.has(r) && (e[r] = a.get(r), this.logMessage(`Valid URL parameter found [${r}].`));
    }), Object.keys(e).length > 0 ? e : null;
  }
  /**
   * Store URL parameters in localStorage
   * @param {Object} queryParams - URL parameters
   * @returns {Object}
   * @private
   */
  storeParams(a) {
    if (!this.isLocalStorageAvailable() || !a) return;
    const e = this.getSavedQueryformData();
    e.params.forEach(({ param: t, class_name: r }) => {
      a[t] && (e.values[t] = {
        class_name: r,
        value: a[t]
      });
    }), this.saveQueryformData(e.params, e.values, e.cacheUntil);
  }
  /**
   * Get stored parameters from localStorage
   * @returns {Object}
   */
  getStoredParamValues() {
    return this.isLocalStorageAvailable() ? this.getSavedQueryformData().values : {};
  }
  /**
   * Get stored parameters from localStorage
   * @returns {Object}
  */
  getStoredParams() {
    return this.isLocalStorageAvailable() ? this.getSavedQueryformData().params : {};
  }
  /**
   * Get last fetched time
   * @returns {string}
   * @private
   */
  getCacheUntil() {
    return this.getSavedQueryformData().cacheUntil;
  }
  /**
   * Get stored parameters from localStorage
   * @returns {Object}
  */
  getSavedQueryformData() {
    return this.isLocalStorageAvailable() ? JSON.parse(localStorage.getItem("queryform")) || {} : {};
  }
  saveQueryformData(a, e, t) {
    if (this.isLocalStorageAvailable())
      return localStorage.setItem("queryform", JSON.stringify({
        params: a,
        values: e,
        cacheUntil: t
      })), this.getSavedQueryformData();
  }
  /**
   * Populate form inputs with stored parameters
   * @param {Object} storedParams - Stored parameters
   * @param {Array} domainUTMs - Domain parameters
   * @returns {void}
   * @private
   */
  populateFormInputs(a, e) {
    const t = Object.values(a).map(
      ({ class_name: s }) => `.${s}`
    );
    document.querySelectorAll(t.join(",")).forEach((s) => {
      var l;
      const i = s.tagName.toLowerCase() === "input" ? s : s.querySelector("input");
      if (!i) return;
      const n = s.className.split(" ").find(
        (o) => t.includes(`.${o}`)
      );
      if (n) {
        const o = e.find(({ class_name: c }) => c === n);
        o && (i.value = ((l = a[o.param]) == null ? void 0 : l.value) || "");
      }
    });
  }
}
export {
  f as default
};
//# sourceMappingURL=queryform.es.js.map
