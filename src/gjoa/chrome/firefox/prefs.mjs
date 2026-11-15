
import { truthy } from "../lib/value.mjs";
export function get_bool(name, default_value) {
  return (() => { try {
    return Services.prefs.getBoolPref(name, ((_logical) => (_logical !== false && _logical != null ? _logical : false))(default_value));
  } catch (__e____scope__3__1__4__2__1__0) {
    return ((_logical) => (_logical !== false && _logical != null ? _logical : false))(default_value);
  } })();
}

export function set_bool(name, value) {
  return (() => { try {
    return Services.prefs.setBoolPref(name, value);
  } catch (__e____scope__4__1__4__2__1__0) {
    return null;
  } })();
}

export function get_int(name, default_value) {
  return (() => { try {
    return Services.prefs.getIntPref(name, ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(default_value));
  } catch (__e____scope__5__1__4__2__1__0) {
    return ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(default_value);
  } })();
}

export function set_int(name, value) {
  return (() => { try {
    return Services.prefs.setIntPref(name, value);
  } catch (__e____scope__6__1__4__2__1__0) {
    return null;
  } })();
}

export function get_string(name, default_value) {
  return (() => { try {
    return Services.prefs.getStringPref(name, ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(default_value));
  } catch (__e____scope__7__1__4__2__1__0) {
    return (() => { try {
    return Services.prefs.getCharPref(name, ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(default_value));
  } catch (__e2____scope__7__1__4__2__2__2__1__0) {
    return ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(default_value);
  } })();
  } })();
}

export function set_string(name, value) {
  return (() => { try {
    return Services.prefs.setStringPref(name, value);
  } catch (__e____scope__8__1__4__2__1__0) {
    return null;
  } })();
}

export function ensure_vertical_tabs_default() {
  const prefs = Services.prefs;
  return (() => { try {
    if ((!truthy(prefs.prefHasUserValue("sidebar.verticalTabs")))) {
    return prefs.setBoolPref("sidebar.verticalTabs", true);
  }
  } catch (__e) {
    return null;
  } })();
}

export function apply_menubar_default(doc) {
  return (() => { try {
    const mb = doc.getElementById("toolbar-menubar");
  if (truthy(mb)) {
    return mb.setAttribute("autohide", "false");
  }
  } catch (__e) {
    return null;
  } })();
}

export function observe(name, handler) {
  const observer = {observe: (__subject, __topic, data) => (() => { try {
    return handler(data);
  } catch (__e) {
    return console.error(("".concat("gjoa prefs observer ", name, ":")), __e);
  } })()};
  (() => { try {
    return Services.prefs.addObserver(name, observer);
  } catch (__e) {
    return null;
  } })();
  return () => (() => { try {
    return Services.prefs.removeObserver(name, observer);
  } catch (__e) {
    return null;
  } })();
}
