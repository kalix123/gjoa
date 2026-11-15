import { equivV as $$bc$equiv } from 'beagle/core.js';

const PREF_ENABLED = "gjoa.contentblock.enabled";

const PREF_ALLOW_HOSTS = "gjoa.contentblock.user.allow-hosts";

const PREF_PROTECTION = "privacy.trackingprotection.content.protection.enabled";

const state = {unsub: null};

function enabled_p() {
  return (() => { try {
    return Services.prefs.getBoolPref(PREF_ENABLED, true);
  } catch (__e____scope__7__4__2__1__0) {
    return true;
  } })();
}

function parse_hosts(csv) {
  const t = csv.trim();
  return (($$bc$equiv(t.length, 0)) ? [] : t.split(",").map((_pct1) => _pct1.trim()).filter((_pct1) => (_pct1.length > 0)));
}

function allow_hosts() {
  return parse_hosts((() => { try {
    return Services.prefs.getStringPref(PREF_ALLOW_HOSTS, "");
  } catch (__e____scope__9__4__1__2__1__0) {
    return (() => { try {
    return Services.prefs.getCharPref(PREF_ALLOW_HOSTS, "");
  } catch (__e2____scope__9__4__1__2__2__2__1__0) {
    return "";
  } })();
  } })());
}

function current_host() {
  return (() => { try {
    const b = gBrowser.selectedBrowser;
  const u = (((_truthy) => _truthy !== false && _truthy != null)(b) ? (() => { return b.currentURI; })() : null);
  return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? u.host : _logical))(u)) ? u.host : "");
  } catch (__e) {
    return "";
  } })();
}

function host_allowed_p(h) {
  return ((h.length > 0) && (allow_hosts().indexOf(h) > -1));
}

function toggle_host(h) {
  if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(h.length, 0)) || (h.indexOf(",") > -1)))) {
    return false;
  } else {
    const hosts = allow_hosts();
    const idx = hosts.indexOf(h);
    const was_allowed = (idx > -1);
    if (was_allowed) {
      hosts.splice(idx, 1);
    } else {
      hosts.push(h);
    }
    (() => { try {
    return Services.prefs.setStringPref(PREF_ALLOW_HOSTS, hosts.join(","));
  } catch (__e____scope__12__4__3__3__2__1__0) {
    return null;
  } })();
    Services.prefs.savePrefFile(null);
    return (!was_allowed);
  }
}

function apply_bang() {
  return (() => { try {
    return Services.prefs.setBoolPref(PREF_PROTECTION, enabled_p());
  } catch (__e____scope__13__4__2__1__0) {
    return null;
  } })();
}

function toggle() {
  const n = (!enabled_p());
  (() => { try {
    return Services.prefs.setBoolPref(PREF_ENABLED, n);
  } catch (__e____scope__14__4__2__2__1__0) {
    return null;
  } })();
  return n;
}

function destroy_bang() {
  const u = state.unsub;
  if (((_truthy) => _truthy !== false && _truthy != null)(u)) {
    u();
  }
  return (state.unsub = null);
}

function init__bang() {
  apply_bang();
  const obs = {observe: (__s, __t, __d) => apply_bang()};
  Services.prefs.addObserver(PREF_ENABLED, obs);
  (state.unsub = () => Services.prefs.removeObserver(PREF_ENABLED, obs));
  (window.gjoaBlocking = {enabled: enabled_p, toggle: toggle, currentHost: current_host, hostAllowed: host_allowed_p, toggleHost: toggle_host});
  const __el____scope__16__7__1__0 = window;
  const __ev____scope__16__7__1__3 = "unload";
  const __h____scope__16__7__1__6 = destroy_bang;
  __el____scope__16__7__1__0.addEventListener(__ev____scope__16__7__1__3, __h____scope__16__7__1__6, {once: true});
  if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(__ev____scope__16__7__1__3, "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__16__7__1__0.__gjoaHR.teardowns : _logical))(__el____scope__16__7__1__0.__gjoaHR)))) {
    __el____scope__16__7__1__0.__gjoaHR.teardowns.push(__h____scope__16__7__1__6);
  }
  __h____scope__16__7__1__6;
  return console.log(("".concat("gjoa-blocking: initialized (enabled=", enabled_p(), ")")));
}

init__bang();
