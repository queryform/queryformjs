class Queryform {

  constructor(websiteId = null, apiRoute = 'https://queryform.co/api/website/') {
    this.websiteId = websiteId;
    this.domainUTMs = [];
    this.apiRoute = apiRoute;
  }

  /**
   * Fetch domain parameters from the API
   * @returns {Promise<void>}
   */

  async #fetchDomainParams() {
    try {
      const response = await fetch(`${this.apiRoute}${this.websiteId}`);
      if (response.ok) {
        this.domainUTMs = await response.json();
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
    if(config.debug) this.#logInitialization();
    config.local ? await this.#fetchLocalParams(utms) : await this.#fetchDomainParams();
    await this.#configureQueryform();
  }

  /**
   * Fetch local domain parameters
   * @param {Array} utms - Local domain parameters
   * @returns {void}
   * @private
   */

  async #fetchLocalParams(utms) {
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
    this.domainUTMs = utms;
  }

  /**
   * Configure the Queryform
   * @returns {void}
   * @private
   */

  #configureQueryform() {
    // Check if domainUTMs is empty
    const queryParams = this.#parseURLParams();
    // Store the query params
    this.#storeParams(queryParams);
    // Get the stored params
    const storedParams = this.getStoredParams();
    // Populate the form inputs
    if (Object.keys(storedParams).length > 0) {
      this.#populateFormInputs(storedParams, this.domainUTMs);
    }
  }

  /**
   * Log initialization message
   * @returns {void}
   * @private
   */

  #logInitialization() {
    // Branded console log message
    console.log(
      `%c Queryform` + `%c v1.0` + `%c Data synced.`,
      'background: #222; color: #2563eb; padding: 10px;',
      'background: #222; color: #fff; font-size:8px; padding: 12px 10px;',
      'background: #222; color: #777; font-size:8px; padding: 12px 10px;'
    );
  }

  /**
   * Check if localStorage is available
   * @returns {boolean}
   * @private
   */

  #isLocalStorageAvailable() {
    return typeof Storage !== 'undefined';
  }

  /**
   * Parse URL parameters
   * @returns {Object}
   * @private
   */

  #parseURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const utms = {};
    this.domainUTMs.forEach(({ param }) => {
      if (urlParams.has(param)) {
        utms[param] = urlParams.get(param);
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

  #storeParams(queryParams) {
    if (!this.#isLocalStorageAvailable() || !queryParams) return;
    const storedParams = this.getStoredParams() || {};
    this.domainUTMs.forEach(({ param, class_name }) => {
      if (queryParams[param]) {
        storedParams[param] = {
          class_name,
          value: queryParams[param],
        };
      }
    });
    localStorage.setItem('queryform_data', JSON.stringify(storedParams));
    return storedParams;
  }

  /**
   * Get stored parameters from localStorage
   * @returns {Object}
   */

  getStoredParams() {
    if (this.#isLocalStorageAvailable()) {
      return JSON.parse(localStorage.getItem('queryform_data')) || {};
    }
    return {};
  }

  /**
   * Populate form inputs with stored parameters
   * @param {Object} storedParams - Stored parameters
   * @param {Array} domainUTMs - Domain parameters
   * @returns {void}
   * @private
   */

  #populateFormInputs(storedParams, domainUTMs) {
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
