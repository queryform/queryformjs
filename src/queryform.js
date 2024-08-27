class QueryForm {

  constructor(websiteId, apiRoute = 'https://queryform.test/api/website/') {
    this.websiteId = websiteId;
    this.domainUTMs = [];
    this.apiRoute = apiRoute;
  }

  async #getDomainParamsFromQueryform() {
      try {
        const response = await fetch(this.apiRoute + this.websiteId);
        if (response.ok) {
          this.domainUTMs = await response.json();
        }
      } catch (err) {
        console.warn('Something went wrong.', err);
      }
  }

  init(config = { debug: false }) {

    this.#getDomainParamsFromQueryform().then(() => {
      this.#configureQueryform();
    });

    if(config.debug){
      console.log(`%c Queryform` + `%c v1.0` + `%c Data synced.`, 'background: #222; color: #2563eb; padding: 10px 10px 10px 10px;', 'background: #222; color: #fff; font-size:8px; padding: 12px 10px 11px 0;', 'background: #222; color: #777; font-size:8px; padding: 12px 10px 11px 0');
    }

  }

  #configureQueryform() {
      const queryStrings = this.#parseURLParams();
      this.#saveParams(queryStrings);
      const utms = this.getStoredParams();
      // Check if the domain has any utm parameters stored in local storage
      if(Object.keys(utms).length !== 0){
          this.#populateFormInputs(utms, this.domainUTMs);
      }
    }

  #isLocalStorageAvailable() {
    return typeof(Storage) !== 'undefined';
  }

  #parseURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const utms = {};
    const arr = Object.values(this.domainUTMs);

    arr.forEach((domainUTM) => {
      if (urlParams.has(domainUTM.param)) {
        utms[domainUTM.param] = urlParams.get(domainUTM.param);
      }
    });

    return Object.keys(utms).length !== 0 ? utms : false;
  }

  #saveParams(queryStrings) {
    if (this.#isLocalStorageAvailable()) {
      let utms = this.getStoredParams();
      if (queryStrings) {
        if (!utms) {
          utms = {};
        }

        this.domainUTMs.forEach((domainUTM) => {
          if (queryStrings[domainUTM.param]) {
            utms[domainUTM.param] = {
              class_name: domainUTM.class_name,
              value: queryStrings[domainUTM.param]
            };
          }
        });

        localStorage.setItem('queryform_data', JSON.stringify(utms));
      }
    }
  }

  getStoredParams() {
      if (!this.#isLocalStorageAvailable()) return {};
      const storedParams = localStorage.getItem('queryform_data');
      return storedParams ? JSON.parse(storedParams) : {};
  }

  #populateFormInputs(utms, domainUTMs) {

    let formInputClasses = [];
    let arrDomainUTMs = Object.values(domainUTMs);

    Object.keys(utms).forEach(function(key, index) {
      formInputClasses.push('.' + utms[key].class_name);
    });

    const formInputs = document.querySelectorAll(formInputClasses);

    formInputs.forEach((inputElement) => {
      const input = inputElement.tagName.toLowerCase() === 'input' ? inputElement : inputElement.querySelector('input');
      if (!input) return;

      const classNames = inputElement.className.split(' ');

      classNames.forEach((className) => {
        if (formInputClasses.includes('.' + className)) {
          arrDomainUTMs.forEach((domainUTM) => {
            if (className === domainUTM.class_name) {
              input.value = utms[domainUTM.param].value;
            }
          });
        }
      });
    });

  }

}

export default QueryForm;

// Optionally, add it to the window object
// window.QueryForm = QueryForm;
