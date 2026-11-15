import { equivV as $$bc$equiv } from 'beagle/core.js';

const PREF_ENABLED = "gjoa.darkmode.enabled";

const PREF_MODE = "gjoa.darkmode.mode";

const PREF_CONTENT_OVERRIDE = "layout.css.prefers-color-scheme.content-override";

const PREF_INVERT = "gjoa.darkmode.invert.enabled";

const PREF_FORCE_NATIVE = "gjoa.darkmode.user.force-native";

const PREF_FORCE_INVERT = "gjoa.darkmode.user.force-invert";

const PREF_SITE_OFF = "gjoa.darkmode.user.off";

const PREF_DEFAULT_INVERT = "gjoa.darkmode.hybrid.default-invert";

const PREF_NORMALIZE = "gjoa.darkmode.normalize.enabled";

const PREF_RFP_OVERRIDES = "privacy.resistFingerprinting.overrides";

const RFP_COLORSCHEME_EXEMPT = "+AllTargets,-CSSPrefersColorScheme";

const state = {unsub: null};

function set_content_override_bang(v) {
  return (() => { try {
    return Services.prefs.setIntPref(PREF_CONTENT_OVERRIDE, v);
  } catch (__e____scope__15__4__2__1__0) {
    return null;
  } })();
}

function set_invert_bang(on) {
  return (() => { try {
    return Services.prefs.setBoolPref(PREF_INVERT, on);
  } catch (__e____scope__16__4__2__1__0) {
    return null;
  } })();
}

function set_default_invert_bang(on) {
  return (() => { try {
    return Services.prefs.setBoolPref(PREF_DEFAULT_INVERT, on);
  } catch (__e____scope__17__4__2__1__0) {
    return null;
  } })();
}

function set_rfp_colorscheme_exempt_bang(on) {
  const cur = (() => { try {
    return Services.prefs.getStringPref(PREF_RFP_OVERRIDES, "");
  } catch (__e____scope__18__4__1__2__2__1__0) {
    return (() => { try {
    return Services.prefs.getCharPref(PREF_RFP_OVERRIDES, "");
  } catch (__e2____scope__18__4__1__2__2__2__2__1__0) {
    return "";
  } })();
  } })();
  if (on) {
    if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(cur, "")) || ($$bc$equiv(cur, RFP_COLORSCHEME_EXEMPT))))) {
      return (() => { try {
    return Services.prefs.setStringPref(PREF_RFP_OVERRIDES, RFP_COLORSCHEME_EXEMPT);
  } catch (__e____scope__18__4__2__2__2__2__1__0) {
    return null;
  } })();
    }
  } else {
    if (($$bc$equiv(cur, RFP_COLORSCHEME_EXEMPT))) {
      return (() => { try {
    return Services.prefs.setStringPref(PREF_RFP_OVERRIDES, "");
  } catch (__e____scope__18__4__2__3__2__2__1__0) {
    return null;
  } })();
    }
  }
}

function set_chrome_scheme_bang(dark) {
  const root = document.documentElement;
  if (dark) {
    (root.style.colorScheme = "dark");
    return root.setAttribute("gjoa-darkmode", "true");
  } else {
    root.style.removeProperty("color-scheme");
    return root.removeAttribute("gjoa-darkmode");
  }
}

function enabled_p() {
  return (() => { try {
    return Services.prefs.getBoolPref(PREF_ENABLED, true);
  } catch (__e____scope__20__4__2__1__0) {
    return true;
  } })();
}

function mode_() {
  return (() => { try {
    return Services.prefs.getStringPref(PREF_MODE, "dark");
  } catch (__e____scope__21__4__2__1__0) {
    return (() => { try {
    return Services.prefs.getCharPref(PREF_MODE, "dark");
  } catch (__e2____scope__21__4__2__2__2__1__0) {
    return "dark";
  } })();
  } })();
}

function system_dark_p() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function apply_bang() {
  const en = enabled_p();
  const m = mode_();
  return ((((_truthy) => _truthy !== false && _truthy != null)(((!en) || ($$bc$equiv(m, "off"))))) ? (() => { set_chrome_scheme_bang(false);
set_content_override_bang(2);
set_invert_bang(false);
set_default_invert_bang(false);
return set_rfp_colorscheme_exempt_bang(false); })() : (($$bc$equiv(m, "system"))) ? (system_dark_p() ? (() => { set_chrome_scheme_bang(true);
set_content_override_bang(0);
set_invert_bang(false);
set_default_invert_bang(true);
return set_rfp_colorscheme_exempt_bang(true); })() : (() => { set_chrome_scheme_bang(false);
set_content_override_bang(1);
set_invert_bang(false);
set_default_invert_bang(false);
return set_rfp_colorscheme_exempt_bang(false); })()) : (($$bc$equiv(m, "uniform"))) ? (() => { set_chrome_scheme_bang(true);
set_content_override_bang(1);
set_invert_bang(true);
set_default_invert_bang(false);
return set_rfp_colorscheme_exempt_bang(false); })() : (($$bc$equiv(m, "light"))) ? (() => { set_chrome_scheme_bang(false);
set_content_override_bang(1);
set_invert_bang(false);
set_default_invert_bang(false);
return set_rfp_colorscheme_exempt_bang(false); })() : (() => { set_chrome_scheme_bang(true);
set_content_override_bang(0);
set_invert_bang(false);
set_default_invert_bang(true);
return set_rfp_colorscheme_exempt_bang(true); })());
}

function toggle() {
  const new_state = (!enabled_p());
  (() => { try {
    return Services.prefs.setBoolPref(PREF_ENABLED, new_state);
  } catch (__e____scope__24__4__2__2__1__0) {
    return null;
  } })();
  return new_state;
}

function cycle_mode() {
  const cur = mode_();
  const nxt = ((($$bc$equiv(cur, "dark"))) ? "light" : (($$bc$equiv(cur, "light"))) ? "system" : (($$bc$equiv(cur, "system"))) ? "dark" : "dark");
  (() => { try {
    return Services.prefs.setStringPref(PREF_MODE, nxt);
  } catch (__e____scope__25__4__2__2__1__0) {
    return null;
  } })();
  return nxt;
}

function set_darkmode_defaults_bang() {
  return (() => { try {
    const d = Services.prefs.getDefaultBranch("");
  d.setBoolPref(PREF_ENABLED, true);
  d.setCharPref(PREF_MODE, "dark");
  return d.setBoolPref(PREF_NORMALIZE, true);
  } catch (e) {
    return console.error("gjoa-darkmode: set-darkmode-defaults! failed", e);
  } })();
}

function destroy_bang() {
  const u = state.unsub;
  if (((_truthy) => _truthy !== false && _truthy != null)(u)) {
    u();
  }
  (state.unsub = null);
  return set_chrome_scheme_bang(false);
}

function init__bang() {
  set_darkmode_defaults_bang();
  apply_bang();
  const observer = {observe: (__s, __t, __d) => apply_bang()};
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const on_sys = (__e) => apply_bang();
  Services.prefs.addObserver(PREF_ENABLED, observer);
  Services.prefs.addObserver(PREF_MODE, observer);
  mql.addEventListener("change", on_sys);
  (state.unsub = () => { Services.prefs.removeObserver(PREF_ENABLED, observer);
Services.prefs.removeObserver(PREF_MODE, observer);
return mql.removeEventListener("change", on_sys); });
  (window.gjoaDarkMode = {toggle: toggle, cycleMode: cycle_mode, isEnabled: enabled_p, getMode: mode_});
  const __el____scope__28__8__1__0 = window;
  const __ev____scope__28__8__1__3 = "unload";
  const __h____scope__28__8__1__6 = destroy_bang;
  __el____scope__28__8__1__0.addEventListener(__ev____scope__28__8__1__3, __h____scope__28__8__1__6, {once: true});
  if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(__ev____scope__28__8__1__3, "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__28__8__1__0.__gjoaHR.teardowns : _logical))(__el____scope__28__8__1__0.__gjoaHR)))) {
    __el____scope__28__8__1__0.__gjoaHR.teardowns.push(__h____scope__28__8__1__6);
  }
  __h____scope__28__8__1__6;
  return console.log(("".concat("gjoa-darkmode: initialized (enabled=", enabled_p(), ", mode=", mode_(), ")")));
}

init__bang();
