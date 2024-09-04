var h = (o) => {
  throw TypeError(o);
};
var U = (o, t, a) => t.has(o) || h("Cannot " + a);
var m = (o, t, a) => t.has(o) ? h("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(o) : t.set(o, a);
var r = (o, t, a) => (U(o, t, "access private method"), a);
var e, p, g, y, w, c, b, S, x;
class I {
  constructor(t = null, a = "https://queryform.co/api/website/") {
    m(this, e);
    this.websiteId = t, this.domainUTMs = [], this.apiRoute = a;
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
  async init(t = { debug: !1, local: !1 }, a = []) {
    t.debug && r(this, e, w).call(this), t.local ? await r(this, e, g).call(this, a) : await r(this, e, p).call(this), await r(this, e, y).call(this);
  }
  /**
   * Get stored parameters from localStorage
   * @returns {Object}
   */
  getStoredParams() {
    return r(this, e, c).call(this) ? JSON.parse(localStorage.getItem("queryform_data")) || {} : {};
  }
}
e = new WeakSet(), p = async function() {
  try {
    const t = await fetch(`${this.apiRoute}${this.websiteId}`);
    t.ok ? this.domainUTMs = await t.json() : console.warn("Failed to fetch domain parameters:", t.statusText);
  } catch (t) {
    console.warn("Error fetching domain parameters:", t);
  }
}, g = async function(t) {
  if (!Array.isArray(t)) {
    console.warn("Invalid utms array:", t);
    return;
  }
  if (t.some(({ param: a, class_name: s }) => !a || !s)) {
    console.warn("Invalid utms array sub-items:", t);
    return;
  }
  this.domainUTMs = t;
}, /**
 * Configure the Queryform
 * @returns {void}
 * @private
 */
y = function() {
  const t = r(this, e, b).call(this);
  r(this, e, S).call(this, t);
  const a = this.getStoredParams();
  Object.keys(a).length > 0 && r(this, e, x).call(this, a, this.domainUTMs);
}, /**
 * Log initialization message
 * @returns {void}
 * @private
 */
w = function() {
  console.log(
    "%c Queryform%c v1.0%c Data synced.",
    "background: #222; color: #2563eb; padding: 10px;",
    "background: #222; color: #fff; font-size:8px; padding: 12px 10px;",
    "background: #222; color: #777; font-size:8px; padding: 12px 10px;"
  );
}, /**
 * Check if localStorage is available
 * @returns {boolean}
 * @private
 */
c = function() {
  return typeof Storage < "u";
}, /**
 * Parse URL parameters
 * @returns {Object}
 * @private
 */
b = function() {
  const t = new URLSearchParams(window.location.search), a = {};
  return this.domainUTMs.forEach(({ param: s }) => {
    t.has(s) && (a[s] = t.get(s));
  }), Object.keys(a).length > 0 ? a : null;
}, /**
 * Store URL parameters in localStorage
 * @param {Object} queryParams - URL parameters
 * @returns {Object}
 * @private
 */
S = function(t) {
  if (!r(this, e, c).call(this) || !t) return;
  const a = this.getStoredParams() || {};
  return this.domainUTMs.forEach(({ param: s, class_name: l }) => {
    t[s] && (a[s] = {
      class_name: l,
      value: t[s]
    });
  }), localStorage.setItem("queryform_data", JSON.stringify(a)), a;
}, /**
 * Populate form inputs with stored parameters
 * @param {Object} storedParams - Stored parameters
 * @param {Array} domainUTMs - Domain parameters
 * @returns {void}
 * @private
 */
x = function(t, a) {
  const s = Object.values(t).map(
    ({ class_name: i }) => `.${i}`
  );
  document.querySelectorAll(s.join(",")).forEach((i) => {
    var f;
    const u = i.tagName.toLowerCase() === "input" ? i : i.querySelector("input");
    if (!u) return;
    const d = i.className.split(" ").find(
      (n) => s.includes(`.${n}`)
    );
    if (d) {
      const n = a.find(({ class_name: P }) => P === d);
      n && (u.value = ((f = t[n.param]) == null ? void 0 : f.value) || "");
    }
  });
};
export {
  I as default
};
//# sourceMappingURL=queryform.es.js.map
