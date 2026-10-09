//#region src/queryform.js
var e = (e, t) => Object.prototype.hasOwnProperty.call(e, t), t = (e) => Array.isArray(e) && e.every((e) => e && typeof e.param == "string" && e.param.length > 0 && typeof e.class_name == "string" && e.class_name.length > 0 && !/\s/.test(e.class_name)), n = (e) => Object.fromEntries(Object.entries(e || {}).filter(([, e]) => e && typeof e.value == "string" && typeof e.class_name == "string").map(([e, t]) => [e, {
	class_name: t.class_name,
	value: t.value
}])), r = class {
	constructor(e = null, t = "https://queryform.co/api/website/") {
		this.websiteId = e, this.apiRoute = t, this.domainUTMs = [], this.debug = !1, this.local = !1, this.cacheUntil = null, this.storageKey = "queryform", this.values = {}, this.snapshot = {}, this.storageFailed = !1, this.pending = null, this.ready = !1, this.options = {};
	}
	async init(e = {}, t = []) {
		if (typeof window > "u" || typeof document > "u") return;
		if (this.pending) return this.pending;
		this.options = e || {}, this.debug = !!this.options.debug, this.local = !!this.options.local;
		let n = this.options.scopedStorage ? `queryform_data:${this.websiteId || "local"}` : "queryform";
		n !== this.storageKey && (this.storageKey = n, this.snapshot = {}, this.storageFailed = !1), this.ready = !1, this.pending = this.initialize(t);
		try {
			await this.pending;
		} finally {
			this.pending = null;
		}
	}
	async initialize(e) {
		try {
			if (this.local) {
				if (!t(e)) throw Error("Expected { param, class_name } mappings.");
				this.fetchLocalParams(e);
			} else {
				let e = this.getSavedQueryformData(), n = Date.parse(e.cacheUntil);
				(!t(e.params) || !(n > Date.now())) && await this.fetchDomainParams();
			}
			if (!t(this.getSavedQueryformData().params)) return;
			this.configureQueryform(), document.readyState === "loading" && (await new Promise((e) => document.addEventListener("DOMContentLoaded", e, { once: !0 })), this.configureQueryform()), this.ready = !0;
		} catch (e) {
			this.logMessage(e);
		}
	}
	async fetchDomainParams() {
		let e;
		try {
			if (!this.websiteId) throw Error("A website ID is required.");
			let n = typeof AbortController > "u" ? null : new AbortController();
			n && (e = setTimeout(() => n.abort(), 1e4));
			let r = await fetch(`${this.apiRoute}${encodeURIComponent(this.websiteId)}`, {
				...n ? { signal: n.signal } : {},
				headers: { Accept: "application/json" }
			});
			if (!r.ok) throw Error(`Configuration request failed (${r.status}).`);
			let i = await r.json(), a = Array.isArray(i) ? i : i?.parameters;
			if (!t(a)) throw Error("Invalid configuration response.");
			this.saveQueryformData(a, this.getStoredParamValues() || {}, r.headers?.get("X-Queryform-Cache-Until") || null);
		} catch (e) {
			this.logMessage(e);
		} finally {
			clearTimeout(e);
		}
	}
	fetchLocalParams(e) {
		t(e) ? this.saveQueryformData(e, this.getStoredParamValues() || {}, null) : this.logMessage("Invalid local mappings.");
	}
	getSavedQueryformData() {
		if (!this.storageFailed) try {
			let e = window.localStorage.getItem(this.storageKey);
			if (e !== null) {
				let r = JSON.parse(e);
				r && t(r.params) && (this.snapshot = {
					params: r.params.map((e) => ({ ...e })),
					values: n(r.values),
					cacheUntil: typeof r.cacheUntil == "string" ? r.cacheUntil : null
				});
			} else this.snapshot = {};
		} catch {}
		return this.snapshot;
	}
	getStoredParams() {
		return this.getSavedQueryformData().params;
	}
	getStoredParamValues() {
		return this.getSavedQueryformData().values;
	}
	getCacheUntil() {
		return this.getSavedQueryformData().cacheUntil;
	}
	saveQueryformData(e, r, i) {
		if (!t(e)) return this.getSavedQueryformData();
		this.domainUTMs = e.map((e) => ({ ...e })), this.values = n(r), this.cacheUntil = typeof i == "string" ? i : null, this.snapshot = {
			params: this.domainUTMs,
			values: this.values,
			cacheUntil: this.cacheUntil
		};
		try {
			window.localStorage.setItem(this.storageKey, JSON.stringify(this.snapshot));
		} catch {
			this.storageFailed = !0;
		}
		return this.snapshot;
	}
	isLocalStorageAvailable() {
		try {
			return typeof window < "u" && !!window.localStorage;
		} catch {
			return !1;
		}
	}
	logMessage(e) {
		this.debug && console.info("QueryForm:", e);
	}
	parseURLParams() {
		if (typeof window > "u") return null;
		let e = new URLSearchParams(window.location.search), t = Object.fromEntries((this.getStoredParams() || []).filter(({ param: t }) => e.has(t)).map(({ param: t }) => [t, e.get(t)]));
		return Object.keys(t).length ? t : null;
	}
	storeParams(t) {
		if (!t) return;
		let r = this.getSavedQueryformData(), i = n(r.values);
		for (let { param: n, class_name: a } of r.params || []) e(t, n) && typeof t[n] == "string" && (t[n] || this.options.clearEmptyValues) && Object.defineProperty(i, n, {
			value: {
				class_name: a,
				value: t[n]
			},
			enumerable: !0,
			configurable: !0,
			writable: !0
		});
		this.saveQueryformData(r.params || [], i, r.cacheUntil);
	}
	configureQueryform() {
		this.storeParams(this.parseURLParams());
		let e = this.getSavedQueryformData();
		this.domainUTMs = e.params || [], this.values = e.values || {}, this.populateFormInputs(this.values, this.domainUTMs);
	}
	populateFormInputs(n, r) {
		if (typeof document > "u" || !t(r)) return;
		let i = /* @__PURE__ */ new Set();
		for (let { param: t, class_name: a } of r) {
			if (!n || !e(n, t) || typeof n[t]?.value != "string") continue;
			let r = /* @__PURE__ */ new Set();
			for (let e of Array.from(document.getElementsByClassName(a))) if (this.options.expandedFields) {
				if (e.matches("input, textarea, select")) r.add(e);
				else for (let t of e.querySelectorAll("input, textarea, select")) r.add(t);
			} else {
				if (i.has(e) || Array.from(e.classList).find((e) => Object.values(n).some((t) => t.class_name === e)) !== a) continue;
				i.add(e);
				let t = e.tagName.toLowerCase() === "input" ? e : e.querySelector("input");
				t && r.add(t);
			}
			for (let e of r) {
				if (e.matches("input[type=\"file\"]") || this.options.expandedFields && e.matches("input[type=\"password\"], input[type=\"checkbox\"], input[type=\"radio\"], input[type=\"submit\"], input[type=\"button\"], input[type=\"reset\"]")) continue;
				let r = n[t].value;
				if (e.value !== r && (e.value = r, this.options.emitEvents)) {
					let t = e.ownerDocument.defaultView.Event;
					e.dispatchEvent(new t("input", { bubbles: !0 })), e.dispatchEvent(new t("change", { bubbles: !0 }));
				}
			}
		}
	}
	refresh() {
		typeof window < "u" && this.configureQueryform();
	}
	capture() {
		this.storeParams(this.parseURLParams());
	}
	populate() {
		this.populateFormInputs(this.getStoredParamValues(), this.getStoredParams() || []);
	}
	clear() {
		this.values = {}, this.snapshot = {
			params: this.domainUTMs,
			values: {},
			cacheUntil: this.cacheUntil
		};
		try {
			window.localStorage.setItem(this.storageKey, JSON.stringify(this.snapshot));
		} catch {
			this.storageFailed = !0;
		}
	}
};
//#endregion
export { r as default };

//# sourceMappingURL=queryform.es.js.map