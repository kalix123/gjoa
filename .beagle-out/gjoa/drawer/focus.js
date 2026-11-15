import { create_logger_bang } from '../tabs/log.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const RESCUE_PREF = "gjoa.urlbar.focusRescues";

const GUARD_WINDOW_MS = 5000;

const INTENT_TTL_MS = 1200;

const MAX_RESCUES = 3;

export function urlbar_input() {
  return ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const some_thread____2 = document.getElementById("urlbar"); return ((some_thread____2 == null) ? null : some_thread____2.querySelector(".urlbar-input")); })()))((() => { const some_thread____0 = window; if ((some_thread____0 == null)) {
  return null;
} else {
  const some_thread____1 = some_thread____0.gURLBar;
  return ((some_thread____1 == null) ? null : some_thread____1.inputField);
} })());
}

export function urlbar_focused_p() {
  const u = document.getElementById("urlbar");
  const a = document.activeElement;
  return ((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ((a === u) || u.contains(a)) : _logical))(a) : _logical))(u));
}

export function with_urlbar_focus_bang(f) {
  const held = urlbar_focused_p();
  const input = (((_truthy) => _truthy !== false && _truthy != null)(held) ? urlbar_input() : null);
  const start = (((_truthy) => _truthy !== false && _truthy != null)(input) ? input.selectionStart : 0);
  const end = (((_truthy) => _truthy !== false && _truthy != null)(input) ? input.selectionEnd : 0);
  const dir = (((_truthy) => _truthy !== false && _truthy != null)(input) ? ((_logical) => (_logical !== false && _logical != null ? _logical : "none"))(input.selectionDirection) : "none");
  f();
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(urlbar_focused_p())) : _logical))(held))) {
    return (() => { try {
    (() => { const some_thread____3 = window; if ((some_thread____3 == null)) {
  return null;
} else {
  const some_thread____4 = some_thread____3.gURLBar;
  return ((some_thread____4 == null) ? null : some_thread____4.focus());
} })();
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? input.setSelectionRange : _logical))(input))) {
    return input.setSelectionRange(start, end, dir);
  }
  } catch (__e) {
    return null;
  } })();
  }
}

export function make_focus_guard_bang() {
  const log = create_logger_bang("urlbar/focus-guard");
  const st = {until: (Date.now() + GUARD_WINDOW_MS), intent: 0, kind: "", rescues: 0, watching: false};
  const fwd = {check: null};
  const armed_p = () => (Date.now() < st.until);
  const watch_bang = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(st.watching))) {
  (st.watching = true);
  return window.requestAnimationFrame(() => fwd.check());
} };
  const rescue_bang = () => { const rescues = st.rescues;
(st.rescues = (rescues + 1));
const prior = (() => { try {
    return Services.prefs.getIntPref(RESCUE_PREF, 0);
  } catch (__e____scope__10__1__4__1__17__4__1__2__2__1__0) {
    return 0;
  } })();
(() => { try {
    return Services.prefs.setIntPref(RESCUE_PREF, (prior + 1));
  } catch (__e____scope__10__1__4__1__17__4__2__2__1__0) {
    return null;
  } })();
log("rescue", {kind: st.kind, n: st.rescues});
return (() => { try {
    (() => { const some_thread____5 = window; if ((some_thread____5 == null)) {
  return null;
} else {
  const some_thread____6 = some_thread____5.gURLBar;
  return ((some_thread____6 == null) ? null : some_thread____6.focus());
} })();
  if (($$bc$equiv(st.kind, "key"))) {
    return (() => { const some_thread____7 = window; if ((some_thread____7 == null)) {
  return null;
} else {
  const some_thread____8 = some_thread____7.gURLBar;
  return ((some_thread____8 == null) ? null : some_thread____8.select());
} })();
  }
  } catch (__e) {
    return null;
  } })(); };
  const content_owns_p = () => { const a = document.activeElement;
return ((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(a.localName, "browser")) && ($$bc$equiv(st.kind, "hold"))) : _logical))(a)); };
  const check = () => { (st.watching = false);
if (((_truthy) => _truthy !== false && _truthy != null)(((st.intent > 0) && armed_p()))) {
  return ((((_truthy) => _truthy !== false && _truthy != null)(urlbar_focused_p())) ? (() => { const intent = st.intent; if (((Date.now() - intent) < INTENT_TTL_MS)) {
  return watch_bang();
} })() : (((_truthy) => _truthy !== false && _truthy != null)(content_owns_p())) ? (st.intent = 0) : (() => { rescue_bang();
return ((st.rescues >= MAX_RESCUES) ? (st.intent = 0) : watch_bang()); })());
} };
  const note_bang = (kind) => { if (((_truthy) => _truthy !== false && _truthy != null)(armed_p())) {
  (st.intent = Date.now());
  (st.kind = kind);
  return watch_bang();
} };
  const clear_bang = () => (st.intent = 0);
  const aimed_at_urlbar_p = (e) => { const u = document.getElementById("urlbar");
const path = (((_truthy) => _truthy !== false && _truthy != null)(e.composedPath) ? e.composedPath() : null);
const t = e.target;
return ((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? ((u === t) || u.contains(t)) : _logical))(t)))(((_logical) => (_logical !== false && _logical != null ? path.includes(u) : _logical))(path)) : _logical))(u)); };
  const on_mousedown = (e) => (((_truthy) => _truthy !== false && _truthy != null)(aimed_at_urlbar_p(e)) ? note_bang("click") : clear_bang());
  const on_keydown = (e) => { const accel = ((_logical) => (_logical !== false && _logical != null ? _logical : e.metaKey))(e.ctrlKey);
return ((((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(e.shiftKey)) && ((!((_truthy) => _truthy !== false && _truthy != null)(e.altKey)) && (($$bc$equiv(e.key, "l")) || ($$bc$equiv(e.key, "L"))))) : _logical))(accel))) ? note_bang("key") : (($$bc$equiv(e.key, "Escape"))) ? clear_bang() : null); };
  const on_activate = (__e) => note_bang("key");
  (fwd.check = check);
  document.addEventListener("mousedown", on_mousedown, true);
  document.addEventListener("keydown", on_keydown, true);
  document.addEventListener("gjoa-urlbar-activate", on_activate);
  if (((_truthy) => _truthy !== false && _truthy != null)(urlbar_focused_p())) {
    note_bang("hold");
  }
  return {rescues: () => st.rescues, release: clear_bang, rearm: () => { (st.until = (Date.now() + GUARD_WINDOW_MS));
(st.rescues = 0);
(st.intent = 0);
if (((_truthy) => _truthy !== false && _truthy != null)(urlbar_focused_p())) {
  return note_bang("hold");
} }, destroy: () => { (st.until = 0);
(st.intent = 0);
document.removeEventListener("mousedown", on_mousedown, true);
document.removeEventListener("keydown", on_keydown, true);
return document.removeEventListener("gjoa-urlbar-activate", on_activate); }};
}
