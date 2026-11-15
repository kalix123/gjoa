import { equivV as $$bc$equiv } from 'beagle/core.js';

const PREF_VARIANT = "gjoa.theme.variant";

const PREF_USE_SYSTEM = "gjoa.theme.useSystem";

const DEFAULT_VARIANT = "polar-night";

const state = {unsub: null};

function variant_() {
  return (() => { try {
    return Services.prefs.getStringPref(PREF_VARIANT, DEFAULT_VARIANT);
  } catch (__e____scope__7__4__2__1__0) {
    return (() => { try {
    return Services.prefs.getCharPref(PREF_VARIANT, DEFAULT_VARIANT);
  } catch (__e2____scope__7__4__2__2__2__1__0) {
    return DEFAULT_VARIANT;
  } })();
  } })();
}

function set_theme_attr_bang(variant) {
  const root = document.documentElement;
  return (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(variant, "polar-night")) || ($$bc$equiv(variant, "system")))) ? root.removeAttribute("gjoa-theme") : root.setAttribute("gjoa-theme", variant));
}

function set_use_system_bang(variant) {
  return (() => { try {
    return Services.prefs.setBoolPref(PREF_USE_SYSTEM, ($$bc$equiv(variant, "system")));
  } catch (__e____scope__9__4__2__1__0) {
    return null;
  } })();
}

function apply_bang() {
  const v = variant_();
  set_theme_attr_bang(v);
  return set_use_system_bang(v);
}

function set_variant(v) {
  (() => { try {
    return Services.prefs.setStringPref(PREF_VARIANT, v);
  } catch (__e____scope__11__4__2__1__0) {
    return null;
  } })();
  return v;
}

function get_variant() {
  return variant_();
}

function set_theme_defaults_bang() {
  return (() => { try {
    const d = Services.prefs.getDefaultBranch("");
  return d.setCharPref(PREF_VARIANT, DEFAULT_VARIANT);
  } catch (e) {
    return console.error("gjoa-theme: set-theme-defaults! failed", e);
  } })();
}

function destroy_bang() {
  const u = state.unsub;
  if (((_truthy) => _truthy !== false && _truthy != null)(u)) {
    u();
  }
  (state.unsub = null);
  return document.documentElement.removeAttribute("gjoa-theme");
}

function init__bang() {
  set_theme_defaults_bang();
  apply_bang();
  const observer = {observe: (__s, __t, __d) => apply_bang()};
  Services.prefs.addObserver(PREF_VARIANT, observer);
  (state.unsub = () => Services.prefs.removeObserver(PREF_VARIANT, observer));
  (window.gjoaTheme = {setVariant: set_variant, getVariant: get_variant});
  const __el____scope__15__8__1__0 = window;
  const __ev____scope__15__8__1__3 = "unload";
  const __h____scope__15__8__1__6 = destroy_bang;
  __el____scope__15__8__1__0.addEventListener(__ev____scope__15__8__1__3, __h____scope__15__8__1__6, {once: true});
  if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(__ev____scope__15__8__1__3, "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__15__8__1__0.__gjoaHR.teardowns : _logical))(__el____scope__15__8__1__0.__gjoaHR)))) {
    __el____scope__15__8__1__0.__gjoaHR.teardowns.push(__h____scope__15__8__1__6);
  }
  __h____scope__15__8__1__6;
  return console.log(("".concat("gjoa-theme: initialized (variant=", variant_(), ")")));
}

init__bang();
