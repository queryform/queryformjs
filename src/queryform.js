class Queryform {

  constructor(websiteId = null, apiRoute = 'https://queryform.co/api/website/') {
    this.websiteId = websiteId;
    this.domainUTMs = [];
    this.apiRoute = apiRoute;
    this.debug = false;
    this.local = false;
    this.cacheUntil = null;
  }

  /**
   * Fetch domain parameters from the API
   * @returns {Promise<void>}
   */

  async fetchDomainParams() {
    this.logMessage('Fetching parameters from queryform api.');
    try {
      const response = await fetch(`${this.apiRoute}${this.websiteId}`);
      if (response.ok) {
        const resp = await response.json();
        this.domainUTMs = resp.parameters;
        // get cache until from X-Queryform-Cache-Until header
        const cacheUntil = response.headers.get('X-Queryform-Cache-Until');
        // get current queryform data
        const queryformData = this.getSavedQueryformData();
        const values = queryformData.values || {};
        this.saveQueryformData(resp.parameters, values, cacheUntil);

      } else {
        console.warn('Failed to fetch domain parameters:', response.statusText);
      }
    } catch (err) {
      console.warn('Error fetching domain parameters:', err);
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

  async init(config = { debug: false, local: false }, utms = []) {

    this.debug = config.debug;
    this.local = config.local;

    if (this.local){
      this.fetchLocalParams(utms)
    }else{
      const cacheUntil = this.getCacheUntil();
      // Convert cacheUntil to America/New_York timezone
      const cacheUntilInNY = new Date(cacheUntil);
      // Get the current time in America/New_York timezone
      const currentDateTimeInNY = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
      // Compare the two dates
      if (cacheUntil && cacheUntilInNY > currentDateTimeInNY) {
        this.logMessage(`Cache is still valid until ${cacheUntil}`);
      } else {
        await this.fetchDomainParams();
      }
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

  fetchLocalParams(utms) {
    // validate the format of the utms array
    if (!Array.isArray(utms)) {
      console.warn('Invalid utms array:', utms);
      return;
    }
    // validate the format of the utms array sub-items
    if (utms.some(({ param, class_name }) => !param || !class_name)) {
      console.warn('Invalid utms array sub-items:', utms);
      return;
    }
    // store the utms array
    const queryformData = this.getSavedQueryformData();
    const values = queryformData.values || {};
    this.saveQueryformData(utms, values, null);
  }

  /**
   * Configure the Queryform
   * @returns {void}
   * @private
   */

  configureQueryform() {
    // Check if domainUTMs is empty
    const queryParams = this.parseURLParams();

    this.storeParams(queryParams);

    const queryformData = this.getSavedQueryformData();
    const domainUTMs = queryformData.params;
    const storedParams = queryformData.values;

    if (storedParams && Object.keys(storedParams).length > 0) {
      this.logMessage('Populating form inputs.');
      this.populateFormInputs(storedParams, domainUTMs);
    }
  }

  /**
   * Log initialization message
   * @returns {void}
   * @private
   */

  logMessage(msg) {
    if(!this.debug) return;
    console.log(
      `%c Queryform` + `%c ${msg}`,
      'background: #222; color: #2563eb; padding: 10px;',
      'background: #222; color: #777; font-size:8px; padding: 12px 10px;'
    );
  }

  /**
   * Check if localStorage is available
   * @returns {boolean}
   * @private
   */

  isLocalStorageAvailable() {
    return typeof Storage !== 'undefined';
  }

  /**
   * Parse URL parameters
   * @returns {Object}
   * @private
   */

  parseURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams) return;
    const utms = {};
    const queryformData = this.getSavedQueryformData();
    queryformData.params.forEach(({ param }) => {
      if (urlParams.has(param)) {
        utms[param] = urlParams.get(param);
        this.logMessage(`Valid URL parameter found [${param}].`);
      }
    });
    return Object.keys(utms).length > 0 ? utms : null;
  }

  /**
   * Store URL parameters in localStorage
   * @param {Object} queryParams - URL parameters
   * @returns {Object}
   * @private
   */

  storeParams(queryParams) {
    if (!this.isLocalStorageAvailable() || !queryParams) return;
    const queryformData = this.getSavedQueryformData();
    queryformData.params.forEach(({ param, class_name }) => {
      if (queryParams[param]) {
        queryformData.values[param] = {
          class_name,
          value: queryParams[param],
        };
      }
    });
    this.saveQueryformData(queryformData.params, queryformData.values, queryformData.cacheUntil);
  }

  /**
   * Get stored parameters from localStorage
   * @returns {Object}
   */

  getStoredParamValues() {
    if (this.isLocalStorageAvailable()) {
      const queryformData = this.getSavedQueryformData();
      return queryformData.values;
    }
    return {};
  }

  /**
   * Get stored parameters from localStorage
   * @returns {Object}
  */

  getStoredParams() {
    if (this.isLocalStorageAvailable()) {
      const queryformData = this.getSavedQueryformData();
      return queryformData.params;
    }
    return {};
  }

  /**
   * Get last fetched time
   * @returns {string}
   * @private
   */

  getCacheUntil() {
    const queryformData = this.getSavedQueryformData();
    return queryformData.cacheUntil;
  }

  /**
   * Get stored parameters from localStorage
   * @returns {Object}
  */

  getSavedQueryformData() {
    if (this.isLocalStorageAvailable()) {
      return JSON.parse(localStorage.getItem('queryform')) || {};
    }
    return {};
  }

  saveQueryformData(params, values, cacheUntil) {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem('queryform', JSON.stringify({
        params,
        values,
        cacheUntil,
      }));
      return this.getSavedQueryformData();
    }
  }

  /**
   * Populate form inputs with stored parameters
   * @param {Object} storedParams - Stored parameters
   * @param {Array} domainUTMs - Domain parameters
   * @returns {void}
   * @private
   */

  populateFormInputs(storedParams, domainUTMs) {
    const inputSelectors = Object.values(storedParams).map(
      ({ class_name }) => `.${class_name}`
    );
    const inputs = document.querySelectorAll(inputSelectors.join(','));

    inputs.forEach((inputElement) => {
      const input = inputElement.tagName.toLowerCase() === 'input' ? inputElement : inputElement.querySelector('input');
      if (!input) return;

      const inputClass = inputElement.className.split(' ').find(
        className => inputSelectors.includes(`.${className}`)
      );

      if (inputClass) {
        const matchingUTM = domainUTMs.find(({ class_name }) => class_name === inputClass);
        if (matchingUTM) {
          input.value = storedParams[matchingUTM.param]?.value || '';
        }
      }
    });
  }

}

export default Queryform;
