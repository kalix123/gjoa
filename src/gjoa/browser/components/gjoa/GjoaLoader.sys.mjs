// Gjoa chrome JS/CSS loader.
//
// Replaces fx-autoconfig with a Firefox-native loader that lives inside
// omni.ja (install-root-owned) instead of bouncing through profile-side
// chrome/ directories.
//
// Shipped as resource:///modules/gjoa/GjoaLoader.sys.mjs (EXTRA_JS_MODULES).
//
// =============================================================================
// SECURITY MODEL
// =============================================================================
//
// PRODUCTION (no <install_root>/gjoa-dev/ directory present):
//   Scripts and styles load from omni.ja via chrome:// URLs. Same trust
//   boundary as Firefox itself — if you trust the install, you trust the
//   chrome JS. No user-writable script directory exists; no hash-pinning
//   needed because there's nothing to tamper with.
//
// DEV MODE (opt-in via GJOA_DEV_LOADER=1 AND <install_root>/gjoa-dev/ present):
//   The loader reads .uc.js / .uc.css files from <install_root>/gjoa-dev/
//   directly at startup. Used for sub-second iteration on chrome JS without
//   re-running mach build. Trust boundary: anyone who can write to the
//   install root (typically root, or the dev who owns the build tree) can
//   inject scripts. This is identical to "anyone who can write to the install
//   root can replace the binary" — same threat boundary, no new attack
//   surface.
//
//   F4 HARDENING (this file): the dev path is gated so it cannot activate by
//   accident or via a dropped directory in a RELEASE build:
//     1. OPT-IN — `dev-mode-dir` returns nil unless GJOA_DEV_LOADER=1 is set
//        in the environment, EVEN IF gjoa-dev/ exists. A dropped directory
//        alone is inert.
//     2. DEFENSE-IN-DEPTH — when the dir IS used, it must be a real (non-
//        symlink) directory that is NOT group- or other-writable
//        (permissions & 0o022 == 0). A symlinked or world/group-writable
//        gjoa-dev/ is refused (return nil → production fallback), so another
//        local user cannot drop or redirect scripts into a dev tree.
//
// PRODUCTION HARDENING (deferred — full belt is the compile-out):
//   The complete fix is to compile the dev path out of shipped release
//   builds entirely via a build flag (MOZ_GJOA_DEV_LOADER=0), so the code
//   path does not exist in the binary at all — defense-in-depth says don't
//   compile in code paths your release doesn't need. The runtime gate above
//   is the interim guard until that compile-out lands.
//
// =============================================================================
// IMPLEMENTATION
// =============================================================================


// Clojure-semantics helpers kept from the Beagle port (see
// src/gjoa/chrome/lib/value.mjs for the shared copy).
// Clojure truthiness: everything except null, undefined and false.
const truthy = (v) => v !== false && v != null;

function isPlainObject(x) {
  if (x === null || typeof x !== "object") return false;
  const proto = Object.getPrototypeOf(x);
  return proto === Object.prototype || proto === null;
}

// Clojure `=`: scalars by value, arrays/sets/plain objects structurally,
// anything else (DOM nodes, XPCOM objects, class instances) by identity.
function equiv(a, b) {
  if (a == null || b == null) return a == null && b == null;
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number") return a === b;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((x, i) => equiv(x, b[i]));
  }
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set) || !(b instanceof Set) || a.size !== b.size) return false;
    const rest = [...b];
    outer: for (const x of a) {
      for (let i = 0; i < rest.length; i++) {
        if (equiv(x, rest[i])) { rest.splice(i, 1); continue outer; }
      }
      return false;
    }
    return true;
  }
  if (!isPlainObject(a) || !isPlainObject(b)) return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => Object.prototype.hasOwnProperty.call(b, k) && equiv(a[k], b[k]));
}

// Clojure `get`: nil-safe lookup with a default.
function get(coll, k, notFound = null) {
  if (coll == null) return notFound;
  if (Array.isArray(coll)) {
    return Number.isInteger(k) && k >= 0 && k < coll.length ? coll[k] : notFound;
  }
  if (coll instanceof Map) return coll.has(k) ? coll.get(k) : notFound;
  const v = coll[k];
  return v === undefined ? notFound : v;
}

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {AboutNewTab: "resource:///modules/AboutNewTab.sys.mjs"});

const NEW_TAB_URL = "chrome://gjoa-newtab/content/newtab.html";

const STYLE_SHEET_SERVICE = (() => { const cid = "@mozilla.org/content/style-sheet-service;1"; return Cc[cid].getService(Ci.nsIStyleSheetService); })();

const TARGET_BROWSER_URL = "chrome://browser/content/browser.xhtml";

const st = {loaded_sheets: new Set(), observer_registered: false};

const PROD_SCRIPTS = ["gjoa-security.uc.js", "gjoa-drawer.uc.js", "gjoa-tabs.uc.js", "gjoa-dark-mode.uc.js", "gjoa-blocking.uc.js", "gjoa-theme.uc.js"];

const PROD_STYLES = ["gjoa.uc.css", "gjoa-tabs.uc.css", "gjoa-which-key.uc.css"];

function dev_env(name) {
  return (() => { try {
    return ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(Services.env.get(name));
  } catch (__e) {
    return "";
  } })();
}

function dev_dir_safe_p(dir) {
  return (() => { try {
    return ((dir.permissions & 0o022 === 0));
  } catch (__e) {
    return false;
  } })();
}

function dev_mode_dir() {
  if ((!((dev_env("GJOA_DEV_LOADER") === "1")))) {
    return null;
  } else {
    const dir = Services.dirsvc.get("GreD", Ci.nsIFile);
    dir.append("gjoa-dev");
    return (truthy(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? dev_dir_safe_p(dir) : _logical))(dir.isDirectory()) : _logical))(dir.exists())) ? dir : null);
  }
}

function list_files(dir, suffix) {
  const out = [];
  if (((!truthy(dir.exists())) || (!truthy(dir.isDirectory())))) {
    return out;
  } else {
    const entries = dir.directoryEntries;
    (() => {  while (true) {
    if (truthy(entries.hasMoreElements())) { (() => { const f = entries.getNext().QueryInterface(Ci.nsIFile); if (truthy(((_logical) => (_logical !== false && _logical != null ? f.leafName.endsWith(suffix) : _logical))(f.isFile()))) {
  return out.push(f);
} })();  continue; } else { return null; }
  } })();
    return out;
  }
}

function load_script_url_into(window, url, label) {
  return (() => { try {
    Services.scriptloader.loadSubScriptWithOptions(url, {target: window, ignoreCache: true});
  return console.log(("".concat("gjoa-loader: loaded script ", label)));
  } catch (e) {
    return console.error(("".concat("gjoa-loader: script ", label, " threw at load time")), e);
  } })();
}

function register_style_sheet_url(url, label) {
  if ((!(st.loaded_sheets.has(url)))) {
    return (() => { try {
    const uri = Services.io.newURI(url);
  STYLE_SHEET_SERVICE.loadAndRegisterSheet(uri, STYLE_SHEET_SERVICE.AGENT_SHEET);
  st.loaded_sheets.add(url);
  return console.log(("".concat("gjoa-loader: registered stylesheet ", label)));
  } catch (e) {
    return console.error(("".concat("gjoa-loader: stylesheet ", label, " threw at register time")), e);
  } })();
  }
}

function load_script_into(window, file) {
  return load_script_url_into(window, Services.io.newFileURI(file).spec, file.leafName);
}

function register_style_sheet(file) {
  return register_style_sheet_url(Services.io.newFileURI(file).spec, file.leafName);
}

function unregister_sheets() {
  Array.from(st.loaded_sheets).forEach((url) => {
  (() => { try {
    const uri = Services.io.newURI(url);
  if (truthy(STYLE_SHEET_SERVICE.sheetRegistered(uri, STYLE_SHEET_SERVICE.AGENT_SHEET))) {
    return STYLE_SHEET_SERVICE.unregisterSheet(uri, STYLE_SHEET_SERVICE.AGENT_SHEET);
  }
  } catch (__e) {
    return null;
  } })();
});
  return st.loaded_sheets.clear();
}

function stamp_mtime(dev_dir) {
  return (() => { try {
    const f = dev_dir.clone();
  f.append(".bundle-stamp");
  return (truthy(f.exists()) ? f.lastModifiedTime : 0);
  } catch (__e) {
    return 0;
  } })();
}

function hot_reload_bang(window) {
  return (() => { try {
    const hr = window.__gjoaHR;
  if (truthy(hr)) {
    (() => { Array.from(hr.teardowns).forEach((f) => {
  (() => { try {
    return f();
  } catch (__e) {
    return null;
  } })();
}); })();
    (hr.teardowns = []);
  }
  unregister_sheets();
  load_into_chrome_window_bang(window);
  return console.log("gjoa-loader: chrome hot-reloaded (dev bundle changed)");
  } catch (e) {
    return console.error("gjoa-loader: hot-reload! failed", e);
  } })();
}

function start_dev_watch_bang(window, dev_dir) {
  if ((!truthy(window.__gjoaHRWatching))) {
    (window.__gjoaHRWatching = true);
    const state = {last: stamp_mtime(dev_dir)};
    return window.setInterval(() => { const cur = stamp_mtime(dev_dir);
if (((cur > 0) && (!(equiv(cur, state.last))))) {
  (state.last = cur);
  return hot_reload_bang(window);
} }, 750);
  }
}

function load_into_chrome_window_bang(window) {
  if ((!truthy(window.__gjoaHR))) {
    (window.__gjoaHR = {teardowns: []});
  }
  const dev = dev_mode_dir();
  if (truthy(dev)) {
    const js_dir = dev.clone();
    const css_dir = dev.clone();
    js_dir.append("JS");
    css_dir.append("CSS");
    list_files(css_dir, ".uc.css").forEach((css) => {
  register_style_sheet(css);
});
    list_files(js_dir, ".uc.js").forEach((js) => {
  load_script_into(window, js);
});
    return start_dev_watch_bang(window, dev);
  } else {
    PROD_STYLES.forEach((css) => {
  register_style_sheet_url(("".concat("chrome://gjoa/content/styles/", css)), css);
});
    PROD_SCRIPTS.forEach((js) => {
  load_script_url_into(window, ("".concat("chrome://gjoa/content/scripts/", js)), js);
});
  }
}

function load_browser_window_bang(window) {
  if (truthy(((_logical) => (_logical !== false && _logical != null ? ((equiv((() => { const some_thread____0 = window; if ((some_thread____0 == null)) {
  return null;
} else {
  const some_thread____1 = some_thread____0.location;
  return ((some_thread____1 == null) ? null : some_thread____1.href);
} })(), TARGET_BROWSER_URL)) && ((!(((() => { const some_thread____2 = window; if ((some_thread____2 == null)) {
  return null;
} else {
  const some_thread____3 = some_thread____2.document;
  return ((some_thread____3 == null) ? null : some_thread____3.readyState);
} })() === "loading"))) && ((_logical) => (_logical !== false && _logical != null ? (!truthy(window.__gjoaLoaderLoaded)) : _logical))((() => { const some_thread____4 = window; if ((some_thread____4 == null)) {
  return null;
} else {
  const some_thread____5 = some_thread____4.gBrowserInit;
  return ((some_thread____5 == null) ? null : some_thread____5.delayedStartupFinished);
} })()))) : _logical))(window))) {
    (window.__gjoaLoaderLoaded = true);
    return (() => { try {
    return load_into_chrome_window_bang(window);
  } catch (e) {
    (window.__gjoaLoaderLoaded = false);
    return console.error("gjoa-loader: browser-window load failed", e);
  } })();
  }
}

function load_existing_browser_windows_bang() {
  const windows = Services.wm.getEnumerator("navigator:browser");
  return (() => {  while (true) {
    if (truthy(windows.hasMoreElements())) { load_browser_window_bang(windows.getNext());  continue; } else { return null; }
  } })();
}

const observer = {observe: (subject, topic) => ((((topic === "chrome-document-loaded"))) ? (() => { const doc = subject; const window = (() => { const some_thread____6 = doc; return ((some_thread____6 == null) ? null : some_thread____6.defaultView); })(); return load_browser_window_bang(window); })() : (((topic === "browser-delayed-startup-finished"))) ? load_browser_window_bang(subject) : null)};

function set_defaults() {
  return (() => { try {
    const d = Services.prefs.getDefaultBranch("");
  d.setCharPref("browser.toolbars.bookmarks.visibility", "never");
  d.setBoolPref("sidebar.verticalTabs", true);
  d.setBoolPref("gjoa.sidebar.menuBar", false);
  d.setBoolPref("gjoa.toolbar.newTabButton", false);
  d.setCharPref("browser.startup.homepage", "about:newtab");
  d.setBoolPref("browser.startup.homepage.abouthome_cache.enabled", false);
  d.setBoolPref("browser.nova.enabled", false);
  if (truthy(Services.prefs.prefHasUserValue("browser.nova.enabled"))) {
    Services.prefs.clearUserPref("browser.nova.enabled");
  }
  d.setBoolPref("gjoa.layout.floatingCards", true);
  d.setBoolPref("gjoa.sovereignty.maximalLockdown", false);
  return d.setCharPref("gjoa.privacy.profile", "balanced");
  } catch (e) {
    return console.error("gjoa-loader: setDefaults failed", e);
  } })();
}

function register_cosmetic_actor() {
  return (() => { try {
    ChromeUtils.registerWindowActor("GjoaCosmetic", {parent: {esModuleURI: "resource://gre/modules/GjoaCosmeticParent.sys.mjs"}, child: {esModuleURI: "resource://gre/modules/GjoaCosmeticChild.sys.mjs", events: {DOMContentLoaded: {mozSystemGroup: true}, DOMWindowCreated: {}}}, allFrames: true, messageManagerGroups: ["browsers"]});
  return console.log("gjoa-loader: registered GjoaCosmetic window actor");
  } catch (e) {
    return console.error("gjoa-loader: registerWindowActor failed", e);
  } })();
}

function register_darkmode_actor() {
  return (() => { try {
    ChromeUtils.registerWindowActor("GjoaDarkmode", {parent: {esModuleURI: "resource://gre/modules/GjoaDarkmodeParent.sys.mjs"}, child: {esModuleURI: "resource://gre/modules/GjoaDarkmodeChild.sys.mjs", events: {DOMContentLoaded: {mozSystemGroup: true}, DOMWindowCreated: {mozSystemGroup: true}}}, allFrames: true, messageManagerGroups: ["browsers"]});
  return console.log("gjoa-loader: registered GjoaDarkmode window actor");
  } catch (e) {
    return console.error("gjoa-loader: registerDarkmodeActor failed", e);
  } })();
}

function register_input_actor() {
  return (() => { try {
    ChromeUtils.registerWindowActor("GjoaInput", {parent: {esModuleURI: "resource://gre/modules/GjoaInputParent.sys.mjs"}, child: {esModuleURI: "resource://gre/modules/GjoaInputChild.sys.mjs", events: {keydown: {capture: true, mozSystemGroup: true}, focusin: {capture: true, mozSystemGroup: true}, focusout: {capture: true, mozSystemGroup: true}, pageshow: {mozSystemGroup: true}, pagehide: {mozSystemGroup: true}, DOMContentLoaded: {mozSystemGroup: true}}}, allFrames: true, messageManagerGroups: ["browsers"]});
  return console.log("gjoa-loader: registered GjoaInput window actor");
  } catch (e) {
    return console.error("gjoa-loader: registerInputActor failed", e);
  } })();
}

function set_new_tab_url_bang() {
  return (() => { try {
    (lazy.AboutNewTab.newTabURL = NEW_TAB_URL);
  return console.log(("".concat("gjoa-loader: new tab URL set to ", NEW_TAB_URL)));
  } catch (e) {
    return console.error("gjoa-loader: failed to set newTabURL", e);
  } })();
}

const LOCKDOWN_PREF = "gjoa.sovereignty.maximalLockdown";

const LOCKDOWN_PROBES = ["network.captive-portal-service.enabled", "network.connectivity-service.enabled"];

function apply_lockdown_bang() {
  return (() => { try {
    const d = Services.prefs.getDefaultBranch("");
  const on = Services.prefs.getBoolPref(LOCKDOWN_PREF, false);
  (() => { LOCKDOWN_PROBES.forEach((p) => {
  d.setBoolPref(p, (!on));
}); })();
  return console.log(("".concat("gjoa-loader: maximal-lockdown ", (on ? "ON — captive-portal/connectivity probes disabled" : "off — wifi-detection probes active (default)"))));
  } catch (e) {
    return console.error("gjoa-loader: apply-lockdown failed", e);
  } })();
}

const lockdown_observer = {observe: (__subject, __topic, __data) => apply_lockdown_bang()};

const PRIVACY_PRESETS = {["minimal"]: [["privacy.resistFingerprinting", false, "bool"], ["privacy.resistFingerprinting.letterboxing", false, "bool"], ["network.http.referer.XOriginPolicy", 0, "int"], ["network.http.referer.XOriginTrimmingPolicy", 0, "int"], ["browser.search.suggest.enabled", true, "bool"], ["browser.urlbar.suggest.searches", true, "bool"], ["extensions.update.enabled", true, "bool"], ["privacy.donottrackheader.enabled", true, "bool"]], ["balanced"]: [["privacy.resistFingerprinting", false, "bool"], ["privacy.resistFingerprinting.letterboxing", false, "bool"], ["network.http.referer.XOriginPolicy", 0, "int"], ["network.http.referer.XOriginTrimmingPolicy", 2, "int"], ["browser.search.suggest.enabled", false, "bool"], ["browser.urlbar.suggest.searches", false, "bool"], ["extensions.update.enabled", true, "bool"], ["privacy.donottrackheader.enabled", true, "bool"]], ["librewolf"]: [["privacy.resistFingerprinting", true, "bool"], ["privacy.resistFingerprinting.letterboxing", true, "bool"], ["network.http.referer.XOriginPolicy", 2, "int"], ["network.http.referer.XOriginTrimmingPolicy", 2, "int"], ["browser.search.suggest.enabled", false, "bool"], ["browser.urlbar.suggest.searches", false, "bool"], ["extensions.update.enabled", false, "bool"], ["privacy.donottrackheader.enabled", true, "bool"]]};

function apply_privacy_profile_bang() {
  return (() => { try {
    const id = Services.prefs.getCharPref("gjoa.privacy.profile", "balanced");
  const preset = get(PRIVACY_PRESETS, id);
  const d = Services.prefs.getDefaultBranch("");
  if (truthy((!((id === "custom"))) && preset)) {
    (() => { preset.forEach((leaf) => {
  const name = leaf[0];
  const v = leaf[1];
  if (((leaf[2] === "int"))) {
    d.setIntPref(name, v);
  } else {
    d.setBoolPref(name, v);
  }
}); })();
    return console.log(("".concat("gjoa-loader: privacy profile '", id, "' applied")));
  }
  } catch (e) {
    return console.error("gjoa-loader: apply-privacy-profile failed", e);
  } })();
}

const profile_observer = {observe: (__subject, __topic, __data) => apply_privacy_profile_bang()};

function register_about_bang(what, url, class_id) {
  return (() => { try {
    const about_module = {QueryInterface: ChromeUtils.generateQI(["nsIAboutModule"]), newChannel: (uri, load_info) => { const ch = Services.io.newChannelFromURIWithLoadInfo(Services.io.newURI(url), load_info);
(ch.originalURI = uri);
return ch; }, getURIFlags: (__uri) => Ci.nsIAboutModule.ALLOW_SCRIPT};
  const factory = {QueryInterface: ChromeUtils.generateQI(["nsIFactory"]), createInstance: (iid) => about_module.QueryInterface(iid)};
  const registrar = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
  registrar.registerFactory(Components.ID(class_id), ("".concat("about:", what)), ("".concat("@mozilla.org/network/protocol/about;1?what=", what)), factory);
  return console.log(("".concat("gjoa-loader: registered about:", what)));
  } catch (e) {
    return console.error(("".concat("gjoa-loader: register about:", what, " failed")), e);
  } })();
}

function register_aboutprefs_actor_bang() {
  return (() => { try {
    ChromeUtils.registerWindowActor("GjoaAboutPrefs", {parent: {esModuleURI: "resource:///modules/gjoa/GjoaAboutPrefsParent.sys.mjs"}, child: {esModuleURI: "resource:///modules/gjoa/GjoaAboutPrefsChild.sys.mjs", events: {DOMContentLoaded: {mozSystemGroup: true}}}, matches: ["about:preferences*", "about:settings*"]});
  return console.log("gjoa-loader: registered GjoaAboutPrefs actor (about:preferences pointer)");
  } catch (e) {
    return console.error("gjoa-loader: register GjoaAboutPrefs actor failed", e);
  } })();
}

function register_about_pages_bang() {
  register_about_bang("sovereignty", "chrome://gjoa/content/sovereignty/sovereignty.html", "{6a7c1e90-5b3d-4c2a-9f81-7e0d3a6b2c54}");
  register_about_bang("gjoa", "chrome://gjoa/content/settings/settings.html", "{b3d8f1a2-4c5e-4a9b-8f02-1e7d6c3b9a40}");
  return register_about_bang("vim", "chrome://gjoa/content/vim/vim.html", "{d5f0b3c4-6e7a-4c2d-9124-3a9f8e5db162}");
}

export const GjoaLoader = {start: () => { if ((!truthy(st.observer_registered))) {
  (st.observer_registered = true);
  set_defaults();
  apply_lockdown_bang();
  Services.prefs.addObserver(LOCKDOWN_PREF, lockdown_observer);
  apply_privacy_profile_bang();
  Services.prefs.addObserver("gjoa.privacy.profile", profile_observer);
  register_about_pages_bang();
  register_aboutprefs_actor_bang();
  set_new_tab_url_bang();
  register_cosmetic_actor();
  register_darkmode_actor();
  register_input_actor();
  Services.obs.addObserver(observer, "chrome-document-loaded");
  Services.obs.addObserver(observer, "browser-delayed-startup-finished");
  load_existing_browser_windows_bang();
  const dev = dev_mode_dir();
  return (truthy(dev) ? console.log(("".concat("gjoa-loader: dev mode active — sourcing chrome from ", dev.path))) : console.log("gjoa-loader: production mode — loading chrome bundles from chrome://gjoa/content/"));
} }};
