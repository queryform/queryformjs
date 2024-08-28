var h = (a) => {
  throw TypeError(a);
};
var P = (a, t, e) => t.has(a) || h("Cannot " + e);
var m = (a, t, e) => t.has(a) ? h("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(a) : t.set(a, e);
var r = (a, t, e) => (P(a, t, "access private method"), e);
var s, p, g, y, c, b, S, w;
class T {
  constructor(t, e = "https://queryform.test/api/website/") {
    m(this, s);
    this.websiteId = t, this.domainUTMs = [], this.apiRoute = e;
  }
  /**
   * Initialize the Queryform
   * @param {Object} config - Configuration object
   * @param {boolean} config.debug - Enable debug mode
   * @returns {void}
   * @example
   * Retrieve domain parameters from Queryform API
   * const queryform = new Queryform('xxxx-xxxx-xxxx-xxxx');
   * queryform.init({ debug: true });
   */
  init(t = { debug: !1 }) {
    r(this, s, p).call(this).then(() => r(this, s, g).call(this)).finally(() => {
      t.debug && r(this, s, y).call(this);
    });
  }
  /**
   * Get stored parameters from localStorage
   * @returns {Object}
   */
  getStoredParams() {
    return r(this, s, c).call(this) ? JSON.parse(localStorage.getItem("queryform_data")) || {} : {};
  }
}
s = new WeakSet(), p = async function() {
  try {
    const t = await fetch(`${this.apiRoute}${this.websiteId}`);
    t.ok ? this.domainUTMs = await t.json() : console.warn("Failed to fetch domain parameters:", t.statusText);
  } catch (t) {
    console.warn("Error fetching domain parameters:", t);
  }
}, g = async function() {
  const t = r(this, s, b).call(this);
  r(this, s, S).call(this, t);
  const e = this.getStoredParams();
  Object.keys(e).length > 0 && r(this, s, w).call(this, e, this.domainUTMs);
}, /**
 * Log initialization message
 * @returns {void}
 * @private
 */
y = function() {
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
  const t = new URLSearchParams(window.location.search), e = {};
  return this.domainUTMs.forEach(({ param: o }) => {
    t.has(o) && (e[o] = t.get(o));
  }), Object.keys(e).length > 0 ? e : null;
}, /**
 * Store URL parameters in localStorage
 * @param {Object} queryParams - URL parameters
 * @returns {Object}
 * @private
 */
S = function(t) {
  if (!r(this, s, c).call(this) || !t) return;
  const e = this.getStoredParams() || {};
  return this.domainUTMs.forEach(({ param: o, class_name: u }) => {
    t[o] && (e[o] = {
      class_name: u,
      value: t[o]
    });
  }), localStorage.setItem("queryform_data", JSON.stringify(e)), e;
}, /**
 * Populate form inputs with stored parameters
 * @param {Object} storedParams - Stored parameters
 * @param {Array} domainUTMs - Domain parameters
 * @returns {void}
 * @private
 */
w = function(t, e) {
  const o = Object.values(t).map(
    ({ class_name: i }) => `.${i}`
  );
  document.querySelectorAll(o.join(",")).forEach((i) => {
    var d;
    const l = i.tagName.toLowerCase() === "input" ? i : i.querySelector("input");
    if (!l) return;
    const f = i.className.split(" ").find(
      (n) => o.includes(`.${n}`)
    );
    if (f) {
      const n = e.find(({ class_name: x }) => x === f);
      n && (l.value = ((d = t[n.param]) == null ? void 0 : d.value) || "");
    }
  });
};
export {
  T as default
};
//# sourceMappingURL=queryform.js.map
