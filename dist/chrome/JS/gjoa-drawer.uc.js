// ==UserScript==
// @name           Gjoa Drawer
// @description    Manages sidebar layout, compact mode, and toolbar positioning
// @include        main
// ==/UserScript==

(function() {
"use strict";
var create_logger_bang, COLLAPSE_PROTECTION_MARGIN_MS, transition_duration_ms, collapse_protection_duration_ms, urlbar_input, urlbar_focused_p, with_urlbar_focus_bang, make_focus_guard_bang, make_banner_bang, make_compact_bang, make_drag_overlay_bang, make_layout_bang, make_sidebar_button_bang, make_omni_icon_bang, make_urlbar_bang;

{
const $$bc$equiv = $$bc.equivV;

const LOG_FILENAME = "gjoa-debug.log";

const LOG_MAX_BYTES = (5 * 1024 * 1024);

const state = {log_path: null, rotate_checked: false, flush_pending: false};

const lines = [];

function log_path_bang() {
  return ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const p = PathUtils.join(Services.dirsvc.get("ProfD", Ci.nsIFile).path, LOG_FILENAME); (state["log-path"] = p);
return p; })()))(state["log-path"]);
}

function flush_lines_bang() {
  const batch = lines.splice(0);
  if (($$bc$equiv(0, batch.length))) {
    (state["flush-pending"] = false);
    return null;
  } else {
    const blob = new TextEncoder().encode(("".concat(batch.join("\n"), "\n")));
    const path = log_path_bang();
    return IOUtils.write(path, blob, {mode: "appendOrCreate"}).then(() => ((lines.length > 0) ? flush_lines_bang() : (state["flush-pending"] = false))).catch((e) => { console.error("[GJOA:log] write failed", e);
return (state["flush-pending"] = false); });
  }
}

function maybe_rotate_bang() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(state["rotate-checked"]))) {
    (state["rotate-checked"] = true);
    return IOUtils.stat(log_path_bang()).then((info) => { if ((info.size > LOG_MAX_BYTES)) {
  return IOUtils.write(log_path_bang(), new Uint8Array(0), {mode: "overwrite"});
} }).catch(() => null);
  }
}

create_logger_bang = function(tag) {
  const prefix = ("".concat("[GJOA:", tag, "]"));
  return (event, data) => { if (((_truthy) => _truthy !== false && _truthy != null)(Services.prefs.getBoolPref("gjoa.debug", false))) {
  maybe_rotate_bang();
  console.log(prefix, event, ((_logical) => (_logical !== false && _logical != null ? _logical : {}))(data));
  lines.push(("".concat(Date.now(), " [", tag, "] ", event, " ", JSON.stringify(((_logical) => (_logical !== false && _logical != null ? _logical : {}))(data)))));
  if ((!((_truthy) => _truthy !== false && _truthy != null)(state["flush-pending"]))) {
    (state["flush-pending"] = true);
    return Promise.resolve(undefined).then(flush_lines_bang);
  }
} };
}

}

{

const FALLBACK_TRANSITION_MS = 250;

COLLAPSE_PROTECTION_MARGIN_MS = 30;

transition_duration_ms = function() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--gjoa-transition-duration").trim();
  return ((((_truthy) => _truthy !== false && _truthy != null)(raw.endsWith("ms"))) ? (() => { const v = parseFloat(raw); return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (v > 0) : _logical))(Number.isFinite(v))) ? v : FALLBACK_TRANSITION_MS); })() : (((_truthy) => _truthy !== false && _truthy != null)(raw.endsWith("s"))) ? (() => { const f = parseFloat(raw); const v = (f * 1000); return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (v > 0) : _logical))(Number.isFinite(v))) ? v : FALLBACK_TRANSITION_MS); })() : FALLBACK_TRANSITION_MS);
}

collapse_protection_duration_ms = function() {
  return (transition_duration_ms() + COLLAPSE_PROTECTION_MARGIN_MS);
}

}

{
const $$bc$equiv = $$bc.equivV;

const RESCUE_PREF = "gjoa.urlbar.focusRescues";

const GUARD_WINDOW_MS = 5000;

const INTENT_TTL_MS = 1200;

const MAX_RESCUES = 3;

urlbar_input = function() {
  return ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const some_thread____2 = document.getElementById("urlbar"); return ((some_thread____2 == null) ? null : some_thread____2.querySelector(".urlbar-input")); })()))((() => { const some_thread____0 = window; if ((some_thread____0 == null)) {
  return null;
} else {
  const some_thread____1 = some_thread____0.gURLBar;
  return ((some_thread____1 == null) ? null : some_thread____1.inputField);
} })());
}

urlbar_focused_p = function() {
  const u = document.getElementById("urlbar");
  const a = document.activeElement;
  return ((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ((a === u) || u.contains(a)) : _logical))(a) : _logical))(u));
}

with_urlbar_focus_bang = function(f) {
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

make_focus_guard_bang = function() {
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

}

{

const SHOW_DELAY_MS = 2000;

make_banner_bang = function() {
  const log = create_logger_bang("drawer/banner");
  const identity_box = document.getElementById("identity-box");
  if ((!((_truthy) => _truthy !== false && _truthy != null)(identity_box))) {
    log("init:no-identity-box");
    return {destroy: () => null};
  } else {
    const state = {timer: null, banner: null};
    const show = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(state.banner))) {
  const el = (() => { const __e____scope__4__1__4__2__3__1__5__3__2__1__2__1__0 = document.createXULElement("hbox"); (__e____scope__4__1__4__2__3__1__5__3__2__1__2__1__0.id = "gjoa-insecure-banner");
return __e____scope__4__1__4__2__3__1__5__3__2__1__2__1__0; })();
  el.setAttribute("align", "center");
  el.setAttribute("pack", "center");
  (el.textContent = "Gjoa - HTTP Alert: Not Secure");
  const browser_el = document.getElementById("browser");
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? browser_el.parentNode : _logical))(browser_el))) {
    browser_el.parentNode.insertBefore(el, browser_el);
    (state.banner = el);
    return log("show");
  } else {
    return log("show:no-browser-parent");
  }
} };
    const hide = () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.timer)) {
  clearTimeout(state.timer);
  (state.timer = null);
}
if (((_truthy) => _truthy !== false && _truthy != null)(state.banner)) {
  state.banner.remove();
  (state.banner = null);
  return log("hide");
} };
    const check_bang = () => { const browser = gBrowser.selectedBrowser;
const uri = (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? browser.currentURI.spec : _logical))(browser.currentURI) : _logical))(browser)) ? browser.currentURI.spec : "");
const is_internal = ((_logical) => (_logical !== false && _logical != null ? _logical : uri.startsWith("chrome:")))(uri.startsWith("about:"));
const is_customizing = document.documentElement.hasAttribute("customizing");
const is_insecure = ((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(is_internal)) && (!is_customizing)) : _logical))(identity_box.classList.contains("notSecure"));
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(state.timer)) && (!((_truthy) => _truthy !== false && _truthy != null)(state.banner))) : _logical))(is_insecure))) {
  return (state.timer = setTimeout(show, SHOW_DELAY_MS));
} else {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(is_insecure))) {
    return hide();
  }
} };
    const class_observer = new MutationObserver(check_bang);
    const opts = {attributes: true};
    (opts.attributeFilter = ["class"]);
    class_observer.observe(identity_box, opts);
    gBrowser.tabContainer.addEventListener("TabSelect", check_bang);
    return {destroy: () => { class_observer.disconnect();
gBrowser.tabContainer.removeEventListener("TabSelect", check_bang);
return hide(); }};
  }
}

}

{
const $$bc$equiv = $$bc.equivV;

function make_mode_ops_bang(cfg) {
  const st = cfg.st;
  const elem = cfg.elem;
  const check_el = cfg["check-el"];
  const attr = cfg.attr;
  const shared = cfg.shared;
  const dbg = cfg.dbg;
  const dbg1 = cfg.dbg1;
  const recon_counter = cfg["reconcile-counter"];
  const guarded_p = cfg["is-guarded"];
  return (() => { function set_hover(value) { dbg("setHover", {value: value});
return ((((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? shared["ignore-next-hover"] : _logical))(value))) ? elem.removeAttribute("gjoa-has-hover") : (((_truthy) => _truthy !== false && _truthy != null)(value)) ? (() => { const collapse_until = st["collapse-until"]; const cr = (collapse_until - Date.now()); if ((cr > 0)) {
  dbg("setHover:revealDropped", {collapseRemaining: cr});
  if (((_truthy) => _truthy !== false && _truthy != null)(st["retry-timer"])) {
    clearTimeout(st["retry-timer"]);
  }
  return (st["retry-timer"] = setTimeout(() => { (st["retry-timer"] = null);
if ((!((_truthy) => _truthy !== false && _truthy != null)(elem.hasAttribute("gjoa-has-hover")))) {
  const wanted = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const some_thread____0 = st; if ((some_thread____0 == null)) {
  return null;
} else {
  const some_thread____1 = some_thread____0.strip;
  return ((some_thread____1 == null) ? null : some_thread____1.matches(":hover"));
} })()))(elem.matches(":hover"))))(st["flash-timer"]);
  dbg("setHover:retry", {stillWanted: wanted});
  if (((_truthy) => _truthy !== false && _truthy != null)(wanted)) {
    return set_hover(true);
  }
} }, (cr + 16)));
} else {
  elem.setAttribute("gjoa-has-hover", "true");
  if (((_truthy) => _truthy !== false && _truthy != null)(st["retry-timer"])) {
    clearTimeout(st["retry-timer"]);
    return (st["retry-timer"] = null);
  }
} })() : (((_truthy) => _truthy !== false && _truthy != null)(elem.hasAttribute("gjoa-has-hover")) ? (() => { elem.removeAttribute("gjoa-has-hover");
return (st["collapse-until"] = (Date.now() + collapse_protection_duration_ms())); })() : null)); } function clear_flash() { if (((_truthy) => _truthy !== false && _truthy != null)(st["flash-timer"])) {
  clearTimeout(st["flash-timer"]);
}
return (st["flash-timer"] = null); } function cancel_watchdog() { if (((_truthy) => _truthy !== false && _truthy != null)(st.watchdog)) {
  clearTimeout(st.watchdog);
  return (st.watchdog = null);
} } function flash(duration) { if (((_truthy) => _truthy !== false && _truthy != null)(st["flash-timer"])) {
  clearTimeout(st["flash-timer"]);
  dbg("flash:extend", {duration: duration});
} else {
  dbg("flash:show", {duration: duration});
  requestAnimationFrame(() => set_hover(true));
}
return (st["flash-timer"] = setTimeout(() => requestAnimationFrame(() => { recon_counter();
if (((_truthy) => _truthy !== false && _truthy != null)(guarded_p())) {
  dbg1("flash:hide-blocked");
  schedule_watchdog();
} else {
  set_hover(false);
}
return (st["flash-timer"] = null); }), duration)); } function reconcile(trigger) { if (((_truthy) => _truthy !== false && _truthy != null)(check_el.hasAttribute(attr))) {
  const before = {hover: elem.hasAttribute("gjoa-has-hover"), flashPending: ((_truthy) => _truthy !== false && _truthy != null)(st["flash-timer"]), ignoreNextHover: shared["ignore-next-hover"], openPopups: shared["open-popups"]};
  (shared["ignore-next-hover"] = false);
  recon_counter();
  const cursor_over = ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const some_thread____2 = st; if ((some_thread____2 == null)) {
  return null;
} else {
  const some_thread____3 = some_thread____2.strip;
  return ((some_thread____3 == null) ? null : some_thread____3.matches(":hover"));
} })()))(elem.matches(":hover"));
  const guarded = guarded_p();
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : cursor_over))(guarded))) {
    if ((!((_truthy) => _truthy !== false && _truthy != null)(elem.hasAttribute("gjoa-has-hover")))) {
      elem.setAttribute("gjoa-has-hover", "true");
    }
    schedule_watchdog();
  } else if (((_truthy) => _truthy !== false && _truthy != null)(st["flash-timer"])) {
    dbg1("reconcile:flashPending");
  } else {
    set_hover(false);
    cancel_watchdog();
  }
  return dbg("reconcile", {trigger: trigger, before: before, cursorOver: cursor_over, guarded: guarded, after: {hover: elem.hasAttribute("gjoa-has-hover"), flashPending: ((_truthy) => _truthy !== false && _truthy != null)(st["flash-timer"]), ignoreNextHover: shared["ignore-next-hover"]}});
} } function schedule_watchdog() { if ((!((_truthy) => _truthy !== false && _truthy != null)(st.watchdog))) {
  return (st.watchdog = setTimeout(() => { (st.watchdog = null);
return reconcile("hide-watchdog-1s"); }, 1000));
} } return {set_hover: set_hover, flash: flash, reconcile: reconcile, schedule_watchdog: schedule_watchdog, clear_flash: clear_flash, cancel_watchdog: cancel_watchdog}; })();
}

make_compact_bang = function(deps) {
  const sidebar_main = deps.sidebarMain;
  const navigator_toolbox = deps.navigatorToolbox;
  const urlbar = deps.urlbar;
  const doc_el = document.documentElement;
  const COMPACT_PREF = "gjoa.sidebar.compact";
  const HORIZONTAL_COMPACT_PREF = "gjoa.toolbar.compact";
  const KEEP_HOVER_DURATION = 150;
  const OFFSCREEN_SHOW_DURATION = 1000;
  const FLASH_DURATION = 800;
  const hover_hack_delay = () => (() => { try {
    return Services.prefs.getIntPref("gjoa.compact.hoverHackDelay", 0);
  } catch (__e____scope__4__1__4__1__29__3__2__1__0) {
    return 0;
  } })();
  const log = create_logger_bang("compact");
  const vstate = {strip: null, flash_timer: null, urlbar_obs: null, collapse_until: 0, retry_timer: null, watchdog: null};
  const hstate = {strip: null, flash_timer: null, urlbar_obs: null, collapse_until: 0, retry_timer: null, watchdog: null};
  const shared = {ignore_next_hover: false, open_popups: 0, pin_release_deferred: false};
  const menu_open_p = () => ((_truthy) => _truthy !== false && _truthy != null)(document.querySelector("menupopup:is([state='open'],[state='showing'],[open]), panel[panelopen]"));
  const ensure_popover = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(urlbar.matches(":popover-open")))) {
  return urlbar.showPopover();
} };
  const dbg = (event, data) => log(event, Object.assign({compact: sidebar_main.hasAttribute("data-gjoa-compact"), compactHz: doc_el.hasAttribute("data-gjoa-compact-horizontal"), hover: sidebar_main.hasAttribute("gjoa-has-hover"), hoverHz: navigator_toolbox.hasAttribute("gjoa-has-hover"), openPopups: shared["open-popups"], flashPending: ((_truthy) => _truthy !== false && _truthy != null)(vstate["flash-timer"])}, data));
  const dbg1 = (_pct1) => dbg(_pct1, {});
  const is_ignored_popup = (e) => { const path = (() => { const some_thread____4 = e; if ((some_thread____4 == null)) {
  return null;
} else {
  const some_thread____5 = some_thread____4.composedPath;
  return ((some_thread____5 == null) ? null : some_thread____5.composedPath());
} })();
const el = (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? path[0] : _logical))(path)) ? path[0] : e.target);
return (($$bc$equiv(el.localName, "tooltip")) || ($$bc$equiv(el.id, "tab-preview-panel"))); };
  const on_popup_shown = (e) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(is_ignored_popup(e)))) {
  const open_popups = shared["open-popups"];
  (shared["open-popups"] = (open_popups + 1));
  const t = e.target;
  return dbg("popupshown", {id: t.id, tag: t.localName, _openPopups: shared["open-popups"]});
} };
  const reconcile_counter_if_stale = () => { if ((shared["open-popups"] > 0)) {
  const live = document.querySelector(("".concat("panel[panelopen='true'], panel[open='true'], ", "menupopup[state='open'], menupopup[state='showing'], ", "menupopup[open='true']")));
  if ((!((_truthy) => _truthy !== false && _truthy != null)(live))) {
    dbg("reconcileCounterIfStale:reset", {stale: shared["open-popups"]});
    return (shared["open-popups"] = 0);
  }
} };
  const is_guarded = () => ((_truthy) => _truthy !== false && _truthy != null)(((shared["open-popups"] > 0) || ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : document.querySelector("[gjoa-dragging]")))(document.querySelector(".tabbrowser-tab[multiselected]"))))(document.querySelector("toolbarbutton[open='true']"))))(((_logical) => (_logical !== false && _logical != null ? urlbar.hasAttribute("breakout-extend") : _logical))(urlbar))))(menu_open_p())))(sidebar_main.hasAttribute("gjoa-pinned"))));
  const vops = make_mode_ops_bang({st: vstate, elem: sidebar_main, check_el: sidebar_main, attr: "data-gjoa-compact", shared: shared, dbg: dbg, dbg1: dbg1, reconcile_counter: reconcile_counter_if_stale, is_guarded: is_guarded});
  const set_hover = vops["set-hover"];
  const clear_flash = vops["clear-flash"];
  const cancel_hide_watchdog = vops["cancel-watchdog"];
  const flash_sidebar = vops.flash;
  const reconcile_compact_state = vops.reconcile;
  const schedule_hide_watchdog = vops["schedule-watchdog"];
  const hops = make_mode_ops_bang({st: hstate, elem: navigator_toolbox, check_el: doc_el, attr: "data-gjoa-compact-horizontal", shared: shared, dbg: dbg, dbg1: dbg1, reconcile_counter: reconcile_counter_if_stale, is_guarded: is_guarded});
  const set_toolbox_hover = hops["set-hover"];
  const clear_flash_toolbox = hops["clear-flash"];
  const cancel_hide_watchdog_hz = hops["cancel-watchdog"];
  const flash_toolbox = hops.flash;
  const reconcile_compact_state_horizontal = hops.reconcile;
  const on_popup_hidden = (e) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(is_ignored_popup(e)))) {
  const open_popups = shared["open-popups"];
  (shared["open-popups"] = Math.max(0, (open_popups - 1)));
  const t = e.target;
  dbg("popuphidden", {id: t.id, tag: t.localName, _openPopups: shared["open-popups"]});
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(menu_open_p())) && (!((_truthy) => _truthy !== false && _truthy != null)(sidebar_main.matches(":hover")))) : _logical))(sidebar_main.hasAttribute("gjoa-pinned")) : _logical))(shared["pin-release-deferred"]))) {
    (shared["pin-release-deferred"] = false);
    sidebar_main.removeAttribute("gjoa-pinned");
    dbg1("popuphidden:pin-release");
    return reconcile_compact_state("popuphidden-pin-release");
  }
} };
  const on_sidebar_enter = (event) => { (shared["pin-release-deferred"] = false);
const target = event.target;
const target_id = ((_logical) => (_logical !== false && _logical != null ? _logical : target.localName))(target.id);
dbg("onSidebarEnter:entry", {targetId: target_id, _ignoreNextHover: shared["ignore-next-hover"], flashPending: ((_truthy) => _truthy !== false && _truthy != null)(vstate["flash-timer"])});
const collapse_until = vstate["collapse-until"];
if ((collapse_until > Date.now())) {
  dbg("onSidebarEnter:cancel-collapse-protection-sync", {remainingMs: (collapse_until - Date.now()), targetId: target_id});
  (vstate["collapse-until"] = 0);
}
return setTimeout(() => (((!((_truthy) => _truthy !== false && _truthy != null)(target.matches(":hover")))) ? (() => { dbg("onSidebarEnter:abort", {reason: "not-hovered-after-tick", targetId: target_id});
return reconcile_compact_state("sidebar-enter-not-hovered"); })() : (((_truthy) => _truthy !== false && _truthy != null)(target.closest("panel"))) ? dbg("onSidebarEnter:abort", {reason: "from-panel", targetId: target_id}) : (() => { clear_flash();
return requestAnimationFrame(() => ((((_truthy) => _truthy !== false && _truthy != null)(shared["ignore-next-hover"])) ? dbg("onSidebarEnter:abort", {reason: "ignore-next-hover-rAF", targetId: target_id}) : (((_truthy) => _truthy !== false && _truthy != null)(sidebar_main.hasAttribute("gjoa-has-hover"))) ? dbg("onSidebarEnter:abort", {reason: "already-has-hover", targetId: target_id}) : (() => { dbg("onSidebarEnter:show", {targetId: target_id});
return set_hover(true); })())); })()), hover_hack_delay()); };
  const on_sidebar_leave = (event) => { if (((_truthy) => _truthy !== false && _truthy != null)(menu_open_p())) {
  (shared["pin-release-deferred"] = true);
} else {
  sidebar_main.removeAttribute("gjoa-pinned");
}
const target = event.target;
const target_id = ((_logical) => (_logical !== false && _logical != null ? _logical : target.localName))(target.id);
const exited_window = (!((_truthy) => _truthy !== false && _truthy != null)(event.relatedTarget));
const linger_ms = (exited_window ? OFFSCREEN_SHOW_DURATION : KEEP_HOVER_DURATION);
dbg("onSidebarLeave:entry", {targetId: target_id, _ignoreNextHover: shared["ignore-next-hover"], exitedWindow: exited_window, lingerMs: linger_ms});
return setTimeout(() => ((((_truthy) => _truthy !== false && _truthy != null)(target.matches(":hover"))) ? dbg("onSidebarLeave:abort", {reason: "still-hovered-after-tick", targetId: target_id}) : (((_truthy) => _truthy !== false && _truthy != null)(shared["ignore-next-hover"])) ? dbg("onSidebarLeave:abort", {reason: "ignore-next-hover", targetId: target_id}) : (((_truthy) => _truthy !== false && _truthy != null)(is_guarded())) ? dbg("onSidebarLeave:abort", {reason: "guarded", targetId: target_id}) : (() => { dbg("onSidebarLeave:flash", {targetId: target_id, duration: linger_ms});
return flash_sidebar(linger_ms); })()), hover_hack_delay()); };
  const on_doc_mouse_leave = (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(sidebar_main.hasAttribute("gjoa-has-hover"))) && (!((_truthy) => _truthy !== false && _truthy != null)(shared["ignore-next-hover"]))) : _logical))(sidebar_main.hasAttribute("data-gjoa-compact")))) {
  const parsed_trigger = parseInt(((_logical) => (_logical !== false && _logical != null ? _logical : "8"))(getComputedStyle(doc_el).getPropertyValue("--gjoa-compact-trigger-width")), 10);
  const trigger_width = (((_truthy) => _truthy !== false && _truthy != null)(Number.isFinite(parsed_trigger)) ? parsed_trigger : 8.0);
  const inner_width = window.innerWidth;
  const on_left = (() => { try {
    return Services.prefs.getBoolPref("sidebar.position_start", true);
  } catch (__e____scope__4__1__4__2__1__8__3__2__1__11__2__1__0) {
    return true;
  } })();
  const near_edge = (on_left ? (e.clientX <= (trigger_width * 3)) : (e.clientX >= (inner_width - (trigger_width * 3))));
  if (((_truthy) => _truthy !== false && _truthy != null)(near_edge)) {
    dbg("onDocMouseLeave:show", {clientX: e.clientX, onLeft: on_left});
    return flash_sidebar(OFFSCREEN_SHOW_DURATION);
  }
} };
  const on_toolbox_enter = (event) => { const target = event.target;
if ((hstate["collapse-until"] > Date.now())) {
  (hstate["collapse-until"] = 0);
}
return setTimeout(() => (((!((_truthy) => _truthy !== false && _truthy != null)(target.matches(":hover")))) ? reconcile_compact_state_horizontal("toolbox-enter-not-hovered") : (((_truthy) => _truthy !== false && _truthy != null)(target.closest("panel"))) ? null : (() => { clear_flash_toolbox();
return requestAnimationFrame(() => { if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(shared["ignore-next-hover"])) && (!((_truthy) => _truthy !== false && _truthy != null)(navigator_toolbox.hasAttribute("gjoa-has-hover")))))) {
  return set_toolbox_hover(true);
} }); })()), hover_hack_delay()); };
  const on_toolbox_leave = (event) => { const target = event.target;
const exited_window = (!((_truthy) => _truthy !== false && _truthy != null)(event.relatedTarget));
const linger_ms = (exited_window ? OFFSCREEN_SHOW_DURATION : KEEP_HOVER_DURATION);
return setTimeout(() => { if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(target.matches(":hover"))) && ((!((_truthy) => _truthy !== false && _truthy != null)(shared["ignore-next-hover"])) && (!((_truthy) => _truthy !== false && _truthy != null)(is_guarded())))))) {
  return flash_toolbox(linger_ms);
} }, hover_hack_delay()); };
  const on_doc_mouse_leave_top = (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(navigator_toolbox.hasAttribute("gjoa-has-hover"))) && (!((_truthy) => _truthy !== false && _truthy != null)(shared["ignore-next-hover"]))) : _logical))(doc_el.hasAttribute("data-gjoa-compact-horizontal")))) {
  const trigger_height = parseInt(((_logical) => (_logical !== false && _logical != null ? _logical : "8"))(getComputedStyle(doc_el).getPropertyValue("--gjoa-compact-trigger-width")), 10);
  if ((e.clientY <= (trigger_height * 3))) {
    dbg("onDocMouseLeaveTop:show", {clientY: e.clientY});
    return flash_toolbox(OFFSCREEN_SHOW_DURATION);
  }
} };
  const compact_enable = () => { dbg1("compactEnable");
sidebar_main.setAttribute("data-gjoa-compact", "");
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(vstate["urlbar-obs"])) : _logical))(urlbar))) {
  urlbar.removeAttribute("popover");
  (vstate["urlbar-obs"] = new MutationObserver(() => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(doc_el.hasAttribute("gjoa-urlbar-floating"))) : _logical))(sidebar_main.hasAttribute("data-gjoa-compact")))) {
  if (((_truthy) => _truthy !== false && _truthy != null)(urlbar.hasAttribute("breakout-extend"))) {
    dbg1("urlbar:breakout-open");
    urlbar.setAttribute("popover", "manual");
    return ensure_popover();
  } else {
    dbg1("urlbar:breakout-close");
    urlbar.removeAttribute("popover");
    const cursor_over = ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const some_thread____6 = vstate; if ((some_thread____6 == null)) {
  return null;
} else {
  const some_thread____7 = some_thread____6.strip;
  return ((some_thread____7 == null) ? null : some_thread____7.matches(":hover"));
} })()))(sidebar_main.matches(":hover"));
    if (((_truthy) => _truthy !== false && _truthy != null)(cursor_over)) {
      return dbg1("urlbar:breakout-close:keep-open");
    } else {
      dbg1("urlbar:breakout-close:close");
      clear_flash();
      cancel_hide_watchdog();
      if (((_truthy) => _truthy !== false && _truthy != null)(sidebar_main.hasAttribute("gjoa-has-hover"))) {
        sidebar_main.removeAttribute("gjoa-has-hover");
      }
      return (vstate["collapse-until"] = (Date.now() + collapse_protection_duration_ms()));
    }
  }
} }));
  vstate["urlbar-obs"].observe(urlbar, {attributes: true, attributeFilter: ["breakout-extend"]});
}
if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(vstate.strip)) || (!((_truthy) => _truthy !== false && _truthy != null)(vstate.strip.isConnected))))) {
  (vstate.strip = document.createXULElement("box"));
  (vstate.strip.id = "gjoa-hover-strip");
  sidebar_main.parentNode.appendChild(vstate.strip);
  vstate.strip.addEventListener("mouseenter", () => { dbg("hoverStrip:mouseenter", {_ignoreNextHover: shared["ignore-next-hover"], flashPending: ((_truthy) => _truthy !== false && _truthy != null)(vstate["flash-timer"]), hasHover: sidebar_main.hasAttribute("gjoa-has-hover")});
return (((_truthy) => _truthy !== false && _truthy != null)(shared["ignore-next-hover"]) ? dbg("hoverStrip:abort", {reason: "ignore-next-hover-sync"}) : flash_sidebar(OFFSCREEN_SHOW_DURATION)); });
}
sidebar_main.addEventListener("mouseover", on_sidebar_enter);
sidebar_main.addEventListener("mouseleave", on_sidebar_leave);
return doc_el.addEventListener("mouseleave", on_doc_mouse_leave); };
  const compact_disable = () => { dbg1("compactDisable");
clear_flash();
cancel_hide_watchdog();
sidebar_main.removeAttribute("data-gjoa-compact");
sidebar_main.removeAttribute("gjoa-has-hover");
if (((_truthy) => _truthy !== false && _truthy != null)(vstate["urlbar-obs"])) {
  vstate["urlbar-obs"].disconnect();
}
(vstate["urlbar-obs"] = null);
if (((_truthy) => _truthy !== false && _truthy != null)(urlbar)) {
  urlbar.setAttribute("popover", "manual");
  ensure_popover();
}
if (((_truthy) => _truthy !== false && _truthy != null)(vstate.strip)) {
  vstate.strip.remove();
  (vstate.strip = null);
}
sidebar_main.removeEventListener("mouseover", on_sidebar_enter);
sidebar_main.removeEventListener("mouseleave", on_sidebar_leave);
return doc_el.removeEventListener("mouseleave", on_doc_mouse_leave); };
  const compact_enable_horizontal = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(doc_el.hasAttribute("data-gjoa-compact-horizontal")))) {
  dbg1("compactEnableHorizontal");
  doc_el.setAttribute("data-gjoa-compact-horizontal", "");
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(hstate["urlbar-obs"])) : _logical))(urlbar))) {
    urlbar.removeAttribute("popover");
    (hstate["urlbar-obs"] = new MutationObserver(() => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(doc_el.hasAttribute("gjoa-urlbar-floating"))) : _logical))(doc_el.hasAttribute("data-gjoa-compact-horizontal")))) {
  if (((_truthy) => _truthy !== false && _truthy != null)(urlbar.hasAttribute("breakout-extend"))) {
    urlbar.setAttribute("popover", "manual");
    return ensure_popover();
  } else {
    return urlbar.removeAttribute("popover");
  }
} }));
    hstate["urlbar-obs"].observe(urlbar, {attributes: true, attributeFilter: ["breakout-extend"]});
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(hstate.strip)) || (!((_truthy) => _truthy !== false && _truthy != null)(hstate.strip.isConnected))))) {
    (hstate.strip = document.createXULElement("box"));
    (hstate.strip.id = "gjoa-hover-strip-top");
    doc_el.appendChild(hstate.strip);
    hstate.strip.addEventListener("mouseenter", () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(shared["ignore-next-hover"]))) {
  return flash_toolbox(OFFSCREEN_SHOW_DURATION);
} });
  }
  navigator_toolbox.addEventListener("mouseover", on_toolbox_enter);
  navigator_toolbox.addEventListener("mouseleave", on_toolbox_leave);
  return doc_el.addEventListener("mouseleave", on_doc_mouse_leave_top);
} };
  const compact_disable_horizontal = () => { if (((_truthy) => _truthy !== false && _truthy != null)(doc_el.hasAttribute("data-gjoa-compact-horizontal"))) {
  dbg1("compactDisableHorizontal");
  clear_flash_toolbox();
  cancel_hide_watchdog_hz();
  doc_el.removeAttribute("data-gjoa-compact-horizontal");
  navigator_toolbox.removeAttribute("gjoa-has-hover");
  if (((_truthy) => _truthy !== false && _truthy != null)(hstate["urlbar-obs"])) {
    hstate["urlbar-obs"].disconnect();
  }
  (hstate["urlbar-obs"] = null);
  if (((_truthy) => _truthy !== false && _truthy != null)(urlbar)) {
    urlbar.setAttribute("popover", "manual");
    ensure_popover();
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(hstate.strip)) {
    hstate.strip.remove();
    (hstate.strip = null);
  }
  navigator_toolbox.removeEventListener("mouseover", on_toolbox_enter);
  navigator_toolbox.removeEventListener("mouseleave", on_toolbox_leave);
  return doc_el.removeEventListener("mouseleave", on_doc_mouse_leave_top);
} };
  const apply_compact_for_current_mode = () => { const vertical = (() => { try {
    return Services.prefs.getBoolPref("sidebar.verticalTabs", true);
  } catch (__e____scope__4__1__4__2__2__1__2__3__1__2__2__1__0) {
    return true;
  } })();
if (vertical) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(sidebar_main.hasAttribute("data-gjoa-compact"))) : _logical))((() => { try {
    return Services.prefs.getBoolPref(COMPACT_PREF, false);
  } catch (__e____scope__4__1__4__2__2__1__2__3__2__2__1__1__2__1__0) {
    return false;
  } })()))) {
    return compact_enable();
  }
} else {
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(doc_el.hasAttribute("data-gjoa-compact-horizontal"))) : _logical))((() => { try {
    return Services.prefs.getBoolPref(HORIZONTAL_COMPACT_PREF, false);
  } catch (__e____scope__4__1__4__2__2__1__2__3__2__3__1__1__2__1__0) {
    return false;
  } })()))) {
    return compact_enable_horizontal();
  }
} };
  const compact_toggle = () => { const vertical = (() => { try {
    return Services.prefs.getBoolPref("sidebar.verticalTabs", true);
  } catch (__e____scope__4__1__4__2__2__1__5__3__1__2__2__1__0) {
    return true;
  } })();
if (vertical) {
  const active = sidebar_main.hasAttribute("data-gjoa-compact");
  dbg("compactToggle:vertical", {wasActive: active});
  if (active) {
    compact_disable();
    return (() => { try {
    return Services.prefs.setBoolPref(COMPACT_PREF, false);
  } catch (__e____scope__4__1__4__2__2__1__5__3__2__2__3__2__2__2__1__0) {
    return null;
  } })();
  } else {
    (shared["ignore-next-hover"] = true);
    compact_enable();
    (() => { try {
    return Services.prefs.setBoolPref(COMPACT_PREF, true);
  } catch (__e____scope__4__1__4__2__2__1__5__3__2__2__3__3__3__2__1__0) {
    return null;
  } })();
    const safety_timer = setTimeout(() => reconcile_compact_state("safety-timer-400ms"), 400);
    const handler = (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(((e.target === sidebar_main) && ($$bc$equiv(e.propertyName, "transform"))))) {
  sidebar_main.removeEventListener("transitionend", handler);
  clearTimeout(safety_timer);
  return reconcile_compact_state("transitionend-transform");
} };
    return sidebar_main.addEventListener("transitionend", handler);
  }
} else {
  const active = doc_el.hasAttribute("data-gjoa-compact-horizontal");
  dbg("compactToggle:horizontal", {wasActive: active});
  if (active) {
    compact_disable_horizontal();
    return (() => { try {
    return Services.prefs.setBoolPref(HORIZONTAL_COMPACT_PREF, false);
  } catch (__e____scope__4__1__4__2__2__1__5__3__2__3__3__2__2__2__1__0) {
    return null;
  } })();
  } else {
    (shared["ignore-next-hover"] = true);
    compact_enable_horizontal();
    (() => { try {
    return Services.prefs.setBoolPref(HORIZONTAL_COMPACT_PREF, true);
  } catch (__e____scope__4__1__4__2__2__1__5__3__2__3__3__3__3__2__1__0) {
    return null;
  } })();
    const safety_timer = setTimeout(() => reconcile_compact_state_horizontal("safety-timer-400ms-hz"), 400);
    const handler = (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(((e.target === navigator_toolbox) && ($$bc$equiv(e.propertyName, "transform"))))) {
  navigator_toolbox.removeEventListener("transitionend", handler);
  clearTimeout(safety_timer);
  return reconcile_compact_state_horizontal("transitionend-transform-hz");
} };
    return navigator_toolbox.addEventListener("transitionend", handler);
  }
} };
  const compact_observer = {observe: () => { const vertical = (() => { try {
    return Services.prefs.getBoolPref("sidebar.verticalTabs", true);
  } catch (__e____scope__4__1__4__2__2__1__8__2__3__1__2__2__1__0) {
    return true;
  } })();
if (vertical) {
  const enabled = (() => { try {
    return Services.prefs.getBoolPref(COMPACT_PREF, false);
  } catch (__e____scope__4__1__4__2__2__1__8__2__3__2__2__1__2__2__1__0) {
    return false;
  } })();
  const active = sidebar_main.hasAttribute("data-gjoa-compact");
  if (((_truthy) => _truthy !== false && _truthy != null)((enabled && (!active)))) {
    compact_enable();
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(((!enabled) && active))) {
    return compact_disable();
  }
} }};
  const compact_observer_hz = {observe: () => { const vertical = (() => { try {
    return Services.prefs.getBoolPref("sidebar.verticalTabs", true);
  } catch (__e____scope__4__1__4__2__2__1__11__2__3__1__2__2__1__0) {
    return true;
  } })();
if ((!vertical)) {
  const enabled = (() => { try {
    return Services.prefs.getBoolPref(HORIZONTAL_COMPACT_PREF, false);
  } catch (__e____scope__4__1__4__2__2__1__11__2__3__2__2__1__2__2__1__0) {
    return false;
  } })();
  const active = doc_el.hasAttribute("data-gjoa-compact-horizontal");
  if (((_truthy) => _truthy !== false && _truthy != null)((enabled && (!active)))) {
    compact_enable_horizontal();
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(((!enabled) && active))) {
    return compact_disable_horizontal();
  }
} }};
  const vertical_tabs_observer = {observe: () => { const vertical = (() => { try {
    return Services.prefs.getBoolPref("sidebar.verticalTabs", true);
  } catch (__e____scope__4__1__4__2__2__1__14__2__3__1__2__2__1__0) {
    return true;
  } })();
dbg("verticalTabs:change", {vertical: vertical});
if (vertical) {
  compact_disable_horizontal();
} else {
  compact_disable();
}
return apply_compact_for_current_mode(); }};
  const on_pfx_dismiss = () => { (shared["ignore-next-hover"] = true);
set_hover(false);
clear_flash();
return setTimeout(() => (shared["ignore-next-hover"] = false), (KEEP_HOVER_DURATION + 100)); };
  const on_pfx_flash = () => { if (((_truthy) => _truthy !== false && _truthy != null)(sidebar_main.hasAttribute("data-gjoa-compact"))) {
  return flash_sidebar(FLASH_DURATION);
} };
  const on_sizemode_change = () => reconcile_compact_state("sizemodechange");
  const on_window_blur = (_pct1) => { if ((_pct1.target === window)) {
  return reconcile_compact_state("window-blur");
} };
  const pin_sidebar = () => { sidebar_main.setAttribute("gjoa-has-hover", "true");
return clear_flash(); };
  const pin_toolbox = () => { navigator_toolbox.setAttribute("gjoa-has-hover", "true");
return clear_flash_toolbox(); };
  const destroy = () => { document.removeEventListener("popupshown", on_popup_shown);
document.removeEventListener("popuphidden", on_popup_hidden);
sidebar_main.removeEventListener("gjoa-dismiss", on_pfx_dismiss);
sidebar_main.removeEventListener("gjoa-flash", on_pfx_flash);
window.removeEventListener("sizemodechange", on_sizemode_change);
window.removeEventListener("blur", on_window_blur);
Services.prefs.removeObserver(COMPACT_PREF, compact_observer);
Services.prefs.removeObserver(HORIZONTAL_COMPACT_PREF, compact_observer_hz);
Services.prefs.removeObserver("sidebar.verticalTabs", vertical_tabs_observer);
cancel_hide_watchdog();
cancel_hide_watchdog_hz();
clear_flash();
clear_flash_toolbox();
if (((_truthy) => _truthy !== false && _truthy != null)(vstate["retry-timer"])) {
  clearTimeout(vstate["retry-timer"]);
}
if (((_truthy) => _truthy !== false && _truthy != null)(hstate["retry-timer"])) {
  return clearTimeout(hstate["retry-timer"]);
} };
  document.addEventListener("popupshown", on_popup_shown);
  document.addEventListener("popuphidden", on_popup_hidden);
  sidebar_main.addEventListener("gjoa-dismiss", on_pfx_dismiss);
  sidebar_main.addEventListener("gjoa-flash", on_pfx_flash);
  window.addEventListener("sizemodechange", on_sizemode_change);
  window.addEventListener("blur", on_window_blur);
  Services.prefs.addObserver(COMPACT_PREF, compact_observer);
  Services.prefs.addObserver(HORIZONTAL_COMPACT_PREF, compact_observer_hz);
  Services.prefs.addObserver("sidebar.verticalTabs", vertical_tabs_observer);
  apply_compact_for_current_mode();
  return {toggle: compact_toggle, reconcile: reconcile_compact_state, reconcileHorizontal: reconcile_compact_state_horizontal, flashSidebar: flash_sidebar, flashToolbox: flash_toolbox, pinSidebar: pin_sidebar, pinToolbox: pin_toolbox, isCompactVertical: () => sidebar_main.hasAttribute("data-gjoa-compact"), isCompactHorizontal: () => doc_el.hasAttribute("data-gjoa-compact-horizontal"), destroy: destroy};
}

}

{

const PREF = "gjoa.view.draggable-sidebar";

const st = {overlay: null, resize_obs: null, mutation_obs: null, sidebar_main: null, arrowscrollbox: null, observer: null, log: null};

function update_bang() {
  const ov = st.overlay;
  const asb = st.arrowscrollbox;
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? asb : _logical))(ov))) {
    const container_rect = st["sidebar-main"].getBoundingClientRect();
    const asb_rect = asb.getBoundingClientRect();
    const tabs = asb.querySelectorAll("tab.tabbrowser-tab");
    const tab_count = tabs.length;
    const last_tab = ((tab_count > 0) ? tabs[(tab_count - 1)] : null);
    const top = (((_truthy) => _truthy !== false && _truthy != null)(last_tab) ? last_tab.getBoundingClientRect().bottom : asb_rect.top);
    const bottom = asb_rect.bottom;
    const asb_left = asb_rect.left;
    const container_left = container_rect.left;
    const container_top = container_rect.top;
    const height = Math.max(0.0, (bottom - top));
    (ov.style.left = ("".concat((asb_left - container_left), "px")));
    (ov.style.top = ("".concat((top - container_top), "px")));
    (ov.style.width = ("".concat(asb_rect.width, "px")));
    (ov.style.height = ("".concat(height, "px")));
    return (ov.style.display = ((height > 0) ? "" : "none"));
  }
}

function enable_bang() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(st.overlay))) {
    const el = document.createXULElement("box");
    const asb = st.arrowscrollbox;
    const log = st.log;
    (el.id = "gjoa-drag-overlay");
    st["sidebar-main"].appendChild(el);
    (st.overlay = el);
    if (((_truthy) => _truthy !== false && _truthy != null)(asb)) {
      const ro = new ResizeObserver(update_bang);
      ro.observe(asb);
      (st["resize-obs"] = ro);
      const mo = new MutationObserver(update_bang);
      mo.observe(asb, {childList: true});
      (st["mutation-obs"] = mo);
    }
    update_bang();
    return log("enable");
  }
}

function disable_bang() {
  if (((_truthy) => _truthy !== false && _truthy != null)(st.overlay)) {
    const log = st.log;
    if (((_truthy) => _truthy !== false && _truthy != null)(st["resize-obs"])) {
      st["resize-obs"].disconnect();
    }
    if (((_truthy) => _truthy !== false && _truthy != null)(st["mutation-obs"])) {
      st["mutation-obs"].disconnect();
    }
    (st["resize-obs"] = null);
    (st["mutation-obs"] = null);
    st.overlay.remove();
    (st.overlay = null);
    return log("disable");
  }
}

function destroy_bang() {
  (() => { try {
    return Services.prefs.removeObserver(PREF, st.observer);
  } catch (e) {
    return null;
  } })();
  return disable_bang();
}

make_drag_overlay_bang = function(deps) {
  (st.log = create_logger_bang("drawer/drag-overlay"));
  (st["sidebar-main"] = deps.sidebarMain);
  (st.arrowscrollbox = document.getElementById("tabbrowser-arrowscrollbox"));
  if (((_truthy) => _truthy !== false && _truthy != null)((() => { try {
    return Services.prefs.getBoolPref(PREF, true);
  } catch (__e____scope__8__1__7__1__2__1__0) {
    return true;
  } })())) {
    enable_bang();
  }
  const obs = {observe: () => (((_truthy) => _truthy !== false && _truthy != null)((() => { try {
    return Services.prefs.getBoolPref(PREF, true);
  } catch (__e____scope__8__1__8__1__2__2__3__1__2__1__0) {
    return true;
  } })()) ? enable_bang() : disable_bang())};
  (st.observer = obs);
  Services.prefs.addObserver(PREF, obs);
  return {destroy: destroy_bang};
}

}

{
const $$bc$equiv = $$bc.equivV, $$bc$get = $$bc.get;

const WIDTH_PREF = "gjoa.sidebar.width";

const REPAIR_PREF = "gjoa.navbar.repaired";

function collect_icons_bang(scope, hits) {
  const sr = scope.shadowRoot;
  if (((_truthy) => _truthy !== false && _truthy != null)(sr)) {
    collect_icons_bang(sr, hits);
  }
  const kids = scope.children;
  if (((_truthy) => _truthy !== false && _truthy != null)(kids)) {
    return Array.from(kids).forEach((child) => { const tag = child.tagName.toLowerCase();
const cls = child.classList;
const is_icon = (($$bc$equiv(tag, "img")) || (($$bc$equiv(tag, "svg")) || (($$bc$equiv(tag, "moz-icon")) || ((_logical) => (_logical !== false && _logical != null ? _logical : cls.contains("button-icon")))(cls.contains("toolbarbutton-icon")))));
if (((_truthy) => _truthy !== false && _truthy != null)(is_icon)) {
  const r = child.getBoundingClientRect();
  if (((_truthy) => _truthy !== false && _truthy != null)(((r.width > 0) && ((r.height > 0) && (r.top >= 0))))) {
    hits.push(r);
  }
}
return collect_icons_bang(child, hits); });
  }
}

make_layout_bang = function(deps) {
  const log = create_logger_bang("drawer/layout");
  const sidebar_main = $$bc$get(deps, "sidebarMain");
  const navigator_toolbox = $$bc$get(deps, "navigatorToolbox");
  const urlbar_container = $$bc$get(deps, "urlbarContainer");
  const nav_bar = $$bc$get(deps, "navBar");
  const urlbar = $$bc$get(deps, "urlbar");
  const sidebar_main_element = sidebar_main.querySelector("sidebar-main");
  const toolbox_parent = navigator_toolbox.parentNode;
  const toolbox_next = navigator_toolbox.nextSibling;
  const urlbar_parent = urlbar_container.parentNode;
  const urlbar_next = urlbar_container.nextSibling;
  const state = {urlbar_toolbar: null, resize_obs: null, mutation_obs: null, extend_obs: null, updating: false};
  const inject_sidebar_shadow_overrides = () => { const sr = (() => { const some_thread____0 = sidebar_main_element; return ((some_thread____0 == null) ? null : some_thread____0.shadowRoot); })();
if ((sr == null)) {
  return setTimeout(inject_sidebar_shadow_overrides, 100);
} else {
  const s = new CSSStyleSheet();
  s.replaceSync(("".concat("#sidebar-tools-and-extensions-splitter { display: none !important; }", " .tools-and-extensions > moz-button:not(.tools-overflow):first-of-type {", "   --button-outer-padding-block-start: calc(var(--space-xxsmall) * 2) !important;", " }", " .tools-and-extensions > moz-button:not(.tools-overflow):last-of-type {", "   --button-outer-padding-block-end: var(--space-xxsmall) !important;", " }", " .bottom-actions > moz-button:first-of-type {", "   --button-outer-padding-block-start: var(--space-xxsmall) !important;", " }", " .bottom-actions > moz-button:last-of-type {", "   --button-outer-padding-block-end: calc(var(--space-xxsmall) * 2) !important;", " }", " :host([expanded]) .buttons-wrapper {", "   justify-content: flex-start !important;", "   align-items: center !important;", "   gap: calc(var(--space-xxsmall) * 2) !important;", " }", " :host([expanded]) .bottom-actions {", "   align-self: center !important;", " }", " :host([sidebar-positionend]) .actions-list {", "   align-items: end !important;", " }", " :host([expanded]) [part='overflow-button'] {", "   display: none !important;", " }", " :host([expanded]) button-group.tools-and-extensions:not([part='overflow-button']) > moz-button {", "   visibility: visible !important;", " }")));
  return sr.adoptedStyleSheets.push(s);
} };
  const sync_urlbar_width = () => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(state.updating)) && (!((_truthy) => _truthy !== false && _truthy != null)(urlbar.hasAttribute("breakout-extend")))) : _logical))(urlbar))) {
  (state.updating = true);
  const inset = ((_logical) => (_logical !== false && _logical != null ? _logical : 10))(parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gjoa-sidebar-inset")));
  const sidebar_w = sidebar_main.getBoundingClientRect().width;
  const w = Math.max(0.0, (sidebar_w - (inset * 2)));
  urlbar.style.setProperty("--urlbar-width", ("".concat(w, "px")));
  urlbar.style.setProperty("--gjoa-urlbar-resting-w", ("".concat(w, "px")));
  return (state.updating = false);
} };
  const drop_breakout_dimensions_bang = () => { if (((_truthy) => _truthy !== false && _truthy != null)(urlbar)) {
  urlbar.style.removeProperty("--urlbar-height");
  if (((_truthy) => _truthy !== false && _truthy != null)(urlbar.parentNode)) {
    urlbar.parentNode.style.removeProperty("--urlbar-container-height");
  }
}
if (((_truthy) => _truthy !== false && _truthy != null)(urlbar_container)) {
  return urlbar_container.style.removeProperty("--urlbar-container-height");
} };
  const relatch_breakout_bang = () => (() => { try {
    return window.promiseDocumentFlushed(() => null).then((__r) => { const u = window.gURLBar;
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? u.incrementBreakoutBlockerCount : _logical))(u))) {
  u.incrementBreakoutBlockerCount();
  return u.decrementBreakoutBlockerCount();
} }, (__e) => null);
  } catch (__e) {
    return null;
  } })();
  const remeasure_breakout_bang = () => { if (((_truthy) => _truthy !== false && _truthy != null)(state["extend-obs"])) {
  state["extend-obs"].disconnect();
  (state["extend-obs"] = null);
}
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(document.documentElement.hasAttribute("gjoa-urlbar-floating"))) : _logical))(urlbar.hasAttribute("breakout-extend")) : _logical))(urlbar))) {
  drop_breakout_dimensions_bang();
  const obs = new MutationObserver(() => { if ((!((_truthy) => _truthy !== false && _truthy != null)(urlbar.hasAttribute("breakout-extend")))) {
  obs.disconnect();
  (state["extend-obs"] = null);
  return relatch_breakout_bang();
} });
  obs.observe(urlbar, {attributes: true, attributeFilter: ["breakout-extend"]});
  return (state["extend-obs"] = obs);
} };
  const sync_symmetric_footer_once = () => { const sidebar_main_el = document.getElementById("sidebar-container");
if ((!((_truthy) => _truthy !== false && _truthy != null)(sidebar_main_el))) {
  return true;
} else {
  const nav_bar_el = sidebar_main_el.querySelector("#nav-bar");
  const footer = sidebar_main_el.querySelector(":scope > sidebar-main");
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(nav_bar_el)) || (!((_truthy) => _truthy !== false && _truthy != null)(footer))))) {
    return true;
  } else {
    const top_hits = [];
    const bottom_hits = [];
    collect_icons_bang(nav_bar_el, top_hits);
    collect_icons_bang(footer, bottom_hits);
    if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(top_hits.length, 0)) || ($$bc$equiv(bottom_hits.length, 0))))) {
      return true;
    } else {
      top_hits.sort((_pct1, _pct2) => { const a = _pct1.top;
const b = _pct2.top;
return (a - b); });
      bottom_hits.sort((_pct1, _pct2) => { const a = _pct1.bottom;
const b = _pct2.bottom;
return (a - b); });
      const top_icon = top_hits[0];
      const bottom_count = bottom_hits.length;
      const bottom_icon = bottom_hits[(bottom_count - 1)];
      const sidebar_rect = sidebar_main_el.getBoundingClientRect();
      const top_icon_top = top_icon.top;
      const bottom_icon_bottom = bottom_icon.bottom;
      const sidebar_top = sidebar_rect.top;
      const sidebar_bottom = sidebar_rect.bottom;
      const top_gap = (top_icon_top - sidebar_top);
      const bottom_gap = (sidebar_bottom - bottom_icon_bottom);
      const BOTTOM_OFFSET = 4;
      const delta = ((top_gap + BOTTOM_OFFSET) - bottom_gap);
      if ((Math.abs(delta) < 0.5)) {
        log(("".concat("symfooter:converged topGap=", top_gap.toFixed(1), " bottomGap=", bottom_gap.toFixed(1), " target=", (top_gap + BOTTOM_OFFSET).toFixed(1))));
        return true;
      } else {
        const current_var = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gjoa-symmetric-footer")));
        const next = Math.max(0, Math.round((current_var - (delta * 0.6))));
        document.documentElement.style.setProperty("--gjoa-symmetric-footer", ("".concat(next, "px")));
        log(("".concat("symfooter:pass topGap=", top_gap.toFixed(1), " bottomGap=", bottom_gap.toFixed(1), " var=", current_var, "→", next)));
        return false;
      }
    }
  }
} };
  const sync_symmetric_footer = () => Array.from({length: 30}).forEach((__, i) => setTimeout(sync_symmetric_footer_once, (i * 50)));
  const expand = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(state["urlbar-toolbar"]))) {
  log("expand");
  const stale = document.getElementById("gjoa-urlbar-toolbar");
  with_urlbar_focus_bang(() => { (sidebar_main.style.width = ("".concat((() => { try {
    return Services.prefs.getIntPref(WIDTH_PREF, 300);
  } catch (__e____scope__6__1__4__1__59__3__3__2__1__3__3__1__2__1__0) {
    return 300;
  } })(), "px")));
if (((_truthy) => _truthy !== false && _truthy != null)(sidebar_main_element)) {
  sidebar_main.insertBefore(navigator_toolbox, sidebar_main_element);
}
const tb = (() => { const __e____scope__6__1__4__1__59__3__3__2__1__5__1__2__1__0 = document.createXULElement("toolbar"); (__e____scope__6__1__4__1__59__3__3__2__1__5__1__2__1__0.id = "gjoa-urlbar-toolbar");
return __e____scope__6__1__4__1__59__3__3__2__1__5__1__2__1__0; })();
tb.classList.add("browser-toolbar");
tb.appendChild(urlbar_container);
nav_bar.after(tb);
return (state["urlbar-toolbar"] = tb); });
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!(stale === state["urlbar-toolbar"])) : _logical))(stale))) {
    stale.remove();
  }
  remeasure_breakout_bang();
  if (((_truthy) => _truthy !== false && _truthy != null)(urlbar)) {
    const ro = new ResizeObserver(sync_urlbar_width);
    ro.observe(sidebar_main);
    (state["resize-obs"] = ro);
    const mo = new MutationObserver(sync_urlbar_width);
    mo.observe(urlbar, {attributes: true, attributeFilter: ["style"]});
    return (state["mutation-obs"] = mo);
  }
} };
  const collapse = () => { if (((_truthy) => _truthy !== false && _truthy != null)(state["urlbar-toolbar"])) {
  log("collapse");
  (() => { const some_thread____1 = state; if ((some_thread____1 == null)) {
  return null;
} else {
  const some_thread____2 = some_thread____1["resize-obs"];
  return ((some_thread____2 == null) ? null : some_thread____2.disconnect());
} })();
  (() => { const some_thread____3 = state; if ((some_thread____3 == null)) {
  return null;
} else {
  const some_thread____4 = some_thread____3["mutation-obs"];
  return ((some_thread____4 == null) ? null : some_thread____4.disconnect());
} })();
  (state["resize-obs"] = null);
  (state["mutation-obs"] = null);
  sidebar_main.style.removeProperty("width");
  with_urlbar_focus_bang(() => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (urlbar_next.parentNode === urlbar_parent) : _logical))(urlbar_next))) {
  urlbar_parent.insertBefore(urlbar_container, urlbar_next);
} else {
  urlbar_parent.appendChild(urlbar_container);
}
state["urlbar-toolbar"].remove();
(state["urlbar-toolbar"] = null);
const spring2 = document.getElementById("customizableui-special-spring2");
const ext_btn = document.getElementById("unified-extensions-button");
const sb_btn = document.getElementById("gjoa-sidebar-button");
if (((_truthy) => _truthy !== false && _truthy != null)(spring2)) {
  urlbar_container.after(spring2);
}
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ext_btn : _logical))(spring2))) {
  spring2.after(ext_btn);
}
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? sb_btn : _logical))(ext_btn))) {
  ext_btn.after(sb_btn);
}
return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (toolbox_next.parentNode === toolbox_parent) : _logical))(toolbox_next)) ? toolbox_parent.insertBefore(navigator_toolbox, toolbox_next) : toolbox_parent.appendChild(navigator_toolbox)); });
  return remeasure_breakout_bang();
} };
  const on_context_menu = (e) => { if ((navigator_toolbox.parentNode === sidebar_main)) {
  return e.stopPropagation();
} };
  const placement_of = (id) => (() => { try {
    return CustomizableUI.getPlacementOfWidget(id);
  } catch (__e) {
    return null;
  } })();
  const build_in_window_bang = (id) => (() => { try {
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (document.getElementById(id) == null) : _logical))(placement_of(id)))) {
    return CustomizableUI.ensureWidgetPlacedInWindow(id, window);
  }
  } catch (__e) {
    return null;
  } })();
  const re_add_bang = (id, position) => (() => { try {
    if ((placement_of(id) == null)) {
    return CustomizableUI.addWidgetToArea(id, "nav-bar", position);
  }
  } catch (__e) {
    return null;
  } })();
  const nav_bar_slot_after = (anchor_id) => (() => { try {
    const p = placement_of(anchor_id);
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(p.area, "nav-bar")) : _logical))(p))) {
    const position = p.position;
    return (position + 1);
  } else {
    return null;
  }
  } catch (__e) {
    return null;
  } })();
  const snapshot_placements = () => ["stop-reload-button", "sidebar-button"].map((id) => { const p = placement_of(id);
return {id: id, live: (!(p == null)), position: (((_truthy) => _truthy !== false && _truthy != null)(p) ? p.position : null)}; });
  const repair_dropped_bang = (snap) => snap.forEach((entry) => { if (((_truthy) => _truthy !== false && _truthy != null)(entry.live)) {
  re_add_bang(entry.id, entry.position);
}
return build_in_window_bang(entry.id); });
  const heal_once_bang = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)((() => { try {
    return Services.prefs.getBoolPref(REPAIR_PREF, false);
  } catch (__e____scope__6__1__4__1__86__3__1__1__2__1__0) {
    return false;
  } })()))) {
  re_add_bang("stop-reload-button", nav_bar_slot_after("forward-button"));
  re_add_bang("sidebar-button", null);
  (() => { try {
    return Services.prefs.setBoolPref(REPAIR_PREF, true);
  } catch (__e____scope__6__1__4__1__86__3__4__2__1__0) {
    return null;
  } })();
}
build_in_window_bang("stop-reload-button");
return build_in_window_bang("sidebar-button"); };
  navigator_toolbox.addEventListener("contextmenu", on_context_menu);
  inject_sidebar_shadow_overrides();
  with_urlbar_focus_bang(heal_once_bang);
  if (((_truthy) => _truthy !== false && _truthy != null)(sidebar_main.hasAttribute("sidebar-launcher-expanded"))) {
    expand();
  }
  sync_symmetric_footer();
  window.addEventListener("resize", sync_symmetric_footer);
  const sidebar_main_el = document.getElementById("sidebar-container");
  const sym_resize_obs = new ResizeObserver(sync_symmetric_footer);
  if (((_truthy) => _truthy !== false && _truthy != null)(sidebar_main_el)) {
    sym_resize_obs.observe(sidebar_main_el);
  }
  const expand_observer = new MutationObserver(() => { const expanded = sidebar_main.hasAttribute("sidebar-launcher-expanded");
if (((_truthy) => _truthy !== false && _truthy != null)((expanded && (!((_truthy) => _truthy !== false && _truthy != null)(state["urlbar-toolbar"]))))) {
  expand();
} else {
  if (((_truthy) => _truthy !== false && _truthy != null)(((!expanded) && state["urlbar-toolbar"]))) {
    collapse();
  }
}
return sync_symmetric_footer(); });
  expand_observer.observe(sidebar_main, {attributes: true, attributeFilter: ["sidebar-launcher-expanded"]});
  const vt_observer = {observe: (__s, __t, __d) => { const vertical = (() => { try {
    return Services.prefs.getBoolPref("sidebar.verticalTabs", true);
  } catch (__e____scope__6__1__4__8__3__3__1__2__2__3__1__2__2__1__0) {
    return true;
  } })();
if (vertical) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(state["urlbar-toolbar"])) : _logical))(sidebar_main.hasAttribute("sidebar-launcher-expanded")))) {
    expand();
  }
} else {
  const snap = snapshot_placements();
  if (((_truthy) => _truthy !== false && _truthy != null)(state["urlbar-toolbar"])) {
    collapse();
  }
  window.setTimeout(() => repair_dropped_bang(snap), 0);
}
return sync_symmetric_footer(); }};
  Services.prefs.addObserver("sidebar.verticalTabs", vt_observer);
  const default_width = (() => { try {
    return Services.prefs.getIntPref(WIDTH_PREF, 300);
  } catch (__e____scope__6__1__4__8__3__4__1__2__2__1__0) {
    return 300;
  } })();
  if (((_truthy) => _truthy !== false && _truthy != null)(sidebar_main.hasAttribute("sidebar-launcher-expanded"))) {
    (sidebar_main.style.width = ("".concat(default_width, "px")));
  }
  const width_obs = new ResizeObserver(() => { if (((_truthy) => _truthy !== false && _truthy != null)(sidebar_main.hasAttribute("sidebar-launcher-expanded"))) {
  const w = Math.round(sidebar_main.getBoundingClientRect().width);
  if ((w > 0)) {
    return (() => { try {
    return Services.prefs.setIntPref(WIDTH_PREF, w);
  } catch (__e____scope__6__1__4__8__3__5__1__2__2__3__2__2__2__2__1__0) {
    return null;
  } })();
  }
} });
  width_obs.observe(sidebar_main);
  return {isExpanded: () => (!($$bc$equiv(state["urlbar-toolbar"], null))), destroy: () => { expand_observer.disconnect();
width_obs.disconnect();
sym_resize_obs.disconnect();
(() => { const some_thread____5 = state; if ((some_thread____5 == null)) {
  return null;
} else {
  const some_thread____6 = some_thread____5["resize-obs"];
  return ((some_thread____6 == null) ? null : some_thread____6.disconnect());
} })();
(() => { const some_thread____7 = state; if ((some_thread____7 == null)) {
  return null;
} else {
  const some_thread____8 = some_thread____7["mutation-obs"];
  return ((some_thread____8 == null) ? null : some_thread____8.disconnect());
} })();
(() => { const some_thread____9 = state; if ((some_thread____9 == null)) {
  return null;
} else {
  const some_thread____10 = some_thread____9["extend-obs"];
  return ((some_thread____10 == null) ? null : some_thread____10.disconnect());
} })();
navigator_toolbox.removeEventListener("contextmenu", on_context_menu);
return window.removeEventListener("resize", sync_symmetric_footer); }};
}

}

{
const $$bc$equiv = $$bc.equivV;

function install_bang(sidebar_button, sidebar_main, compact) {
  const og_icon = sidebar_button.querySelector(".toolbarbutton-icon");
  const og_icon_style = (((_truthy) => _truthy !== false && _truthy != null)(og_icon) ? getComputedStyle(og_icon).listStyleImage : null);
  (sidebar_button.style.display = "none");
  const button = (() => { const __e____scope__3__4__3__1__2__1__0 = document.createXULElement("toolbarbutton"); (__e____scope__3__4__3__1__2__1__0.id = "gjoa-sidebar-button");
return __e____scope__3__4__3__1__2__1__0; })();
  (button.className = sidebar_button.className);
  button.setAttribute("tooltiptext", "Toggle compact mode (right-click for more)");
  ["cui-areatype", "widget-id", "widget-type", "removable", "overflows"].forEach((_pct1) => { if (((_truthy) => _truthy !== false && _truthy != null)(sidebar_button.hasAttribute(_pct1))) {
  return button.setAttribute(_pct1, ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(sidebar_button.getAttribute(_pct1)));
} });
  button.setAttribute("removable", "false");
  button.setAttribute("skipintoolbarset", "true");
  if (((_truthy) => _truthy !== false && _truthy != null)(og_icon_style)) {
    (button.style.listStyleImage = og_icon_style);
  }
  const nav_bar = document.getElementById("nav-bar");
  const reload_btn = document.getElementById("stop-reload-button");
  const panel_ui = document.getElementById("PanelUI-button");
  if (((_truthy) => _truthy !== false && _truthy != null)(reload_btn)) {
    reload_btn.after(button);
  } else if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? (panel_ui.parentNode === nav_bar) : _logical))(panel_ui) : _logical))(nav_bar))) {
    panel_ui.after(button);
  } else {
    sidebar_button.after(button);
  }
  const strip_hide_button = (() => { const __e____scope__3__4__3__9__1__2__1__0 = document.createXULElement("toolbarbutton"); (__e____scope__3__4__3__9__1__2__1__0.id = "gjoa-strip-hide-button");
return __e____scope__3__4__3__9__1__2__1__0; })();
  const on_strip_hide_click = () => (() => { try {
    return Services.prefs.setBoolPref("gjoa.layout.horizontalSidebarStrip", false);
  } catch (__e____scope__3__4__3__9__1__5__3__2__1__0) {
    return null;
  } })();
  const on_click = (_pct1) => { if (($$bc$equiv(_pct1.button, 0))) {
  return compact.toggle();
} };
  strip_hide_button.setAttribute("tooltiptext", "Hide strip");
  strip_hide_button.addEventListener("click", on_strip_hide_click);
  sidebar_main.append(strip_hide_button);
  button.addEventListener("click", on_click);
  const menu = (() => { const __e____scope__3__4__3__9__6__1__2__1__0 = document.createXULElement("menupopup"); (__e____scope__3__4__3__9__6__1__2__1__0.id = "gjoa-sidebar-button-menu");
return __e____scope__3__4__3__9__6__1__2__1__0; })();
  const compact_item = (() => { const __item____scope__3__4__3__9__6__2__1__2__1__0 = document.createXULElement("menuitem"); __item____scope__3__4__3__9__6__2__1__2__1__0.setAttribute("label", "Enable Compact");
__item____scope__3__4__3__9__6__2__1__2__1__0.addEventListener("command", () => compact.toggle());
return __item____scope__3__4__3__9__6__2__1__2__1__0; })();
  const collapse_item = (() => { const __item____scope__3__4__3__9__6__2__1__5__1__0 = document.createXULElement("menuitem"); __item____scope__3__4__3__9__6__2__1__5__1__0.setAttribute("label", "Collapse Layout");
__item____scope__3__4__3__9__6__2__1__5__1__0.addEventListener("command", () => (() => { try {
    const prev_display = sidebar_button.style.display;
  (sidebar_button.style.display = "");
  sidebar_button.click();
  return (sidebar_button.style.display = prev_display);
  } catch (e) {
    return console.error("[GJOA:drawer] collapse layout failed", e);
  } })());
return __item____scope__3__4__3__9__6__2__1__5__1__0; })();
  const strip_item = (() => { const __item____scope__3__4__3__9__6__2__1__8__1__0 = document.createXULElement("menuitem"); __item____scope__3__4__3__9__6__2__1__8__1__0.setAttribute("label", "Show Strip");
__item____scope__3__4__3__9__6__2__1__8__1__0.addEventListener("command", () => { const cur = (() => { try {
    return Services.prefs.getBoolPref("gjoa.layout.horizontalSidebarStrip", false);
  } catch (__e____scope__3__4__3__9__6__2__1__8__3__4__3__1__2__2__1__0) {
    return false;
  } })();
return (() => { try {
    return Services.prefs.setBoolPref("gjoa.layout.horizontalSidebarStrip", (!cur));
  } catch (__e____scope__3__4__3__9__6__2__1__8__3__4__3__2__2__1__0) {
    return null;
  } })(); });
return __item____scope__3__4__3__9__6__2__1__8__1__0; })();
  const sidebar_item = (() => { const __item____scope__3__4__3__9__6__2__1__11__1__0 = document.createXULElement("menuitem"); __item____scope__3__4__3__9__6__2__1__11__1__0.setAttribute("label", "Enable Sidebar");
__item____scope__3__4__3__9__6__2__1__11__1__0.addEventListener("command", () => (() => { try {
    return ((((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? window.SidebarController.toggle : _logical))(window.SidebarController))) ? window.SidebarController.toggle() : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? window.SidebarUI.toggle : _logical))(window.SidebarUI))) ? window.SidebarUI.toggle() : (() => { const cmd = document.getElementById("cmd_toggleSidebar"); return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? cmd.doCommand : _logical))(cmd)) ? cmd.doCommand() : console.error("[GJOA:drawer] no sidebar-toggle API available")); })());
  } catch (e) {
    return console.error("[GJOA:drawer] sidebar toggle failed", e);
  } })());
return __item____scope__3__4__3__9__6__2__1__11__1__0; })();
  const layout_item = (() => { const __item____scope__3__4__3__9__6__2__1__14__1__0 = document.createXULElement("menuitem"); __item____scope__3__4__3__9__6__2__1__14__1__0.setAttribute("label", "Horizontal Tabs");
__item____scope__3__4__3__9__6__2__1__14__1__0.addEventListener("command", () => { const vertical = (() => { try {
    return Services.prefs.getBoolPref("sidebar.verticalTabs", true);
  } catch (__e____scope__3__4__3__9__6__2__1__14__3__4__3__1__2__2__1__0) {
    return true;
  } })();
return (() => { try {
    return Services.prefs.setBoolPref("sidebar.verticalTabs", (!vertical));
  } catch (__e____scope__3__4__3__9__6__2__1__14__3__4__3__2__2__1__0) {
    return null;
  } })(); });
return __item____scope__3__4__3__9__6__2__1__14__1__0; })();
  const customize_item = (() => { const __item____scope__3__4__3__9__6__2__1__17__1__0 = document.createXULElement("menuitem"); __item____scope__3__4__3__9__6__2__1__17__1__0.setAttribute("label", "Customize Sidebar");
__item____scope__3__4__3__9__6__2__1__17__1__0.addEventListener("command", () => (() => { try {
    const native = document.getElementById("toolbar-context-customize-sidebar");
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? native.doCommand : _logical))(native))) {
    return native.doCommand();
  } else {
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? native.click : _logical))(native))) {
      return native.click();
    }
  }
  } catch (e) {
    return console.error("gjoa: customize sidebar failed", e);
  } })());
return __item____scope__3__4__3__9__6__2__1__17__1__0; })();
  const block_item = (() => { const __item____scope__3__4__3__9__6__2__1__20__1__0 = document.createXULElement("menuitem"); __item____scope__3__4__3__9__6__2__1__20__1__0.setAttribute("label", "Disable Blocking");
__item____scope__3__4__3__9__6__2__1__20__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(window.gjoaBlocking)) {
  return window.gjoaBlocking.toggle();
} });
return __item____scope__3__4__3__9__6__2__1__20__1__0; })();
  (compact_item.id = "gjoa-toggle-compact");
  (collapse_item.id = "gjoa-collapse-layout");
  (strip_item.id = "gjoa-toggle-strip");
  (sidebar_item.id = "gjoa-toggle-sidebar");
  (layout_item.id = "gjoa-toggle-tab-layout");
  (customize_item.id = "gjoa-customize-sidebar");
  (block_item.id = "gjoa-toggle-blocking");
  menu.append(compact_item, collapse_item, strip_item, sidebar_item, layout_item, document.createXULElement("menuseparator"), block_item, customize_item);
  const popup_set = document.getElementById("mainPopupSet");
  if (((_truthy) => _truthy !== false && _truthy != null)(popup_set)) {
    popup_set.append(menu);
  }
  button.setAttribute("context", "gjoa-sidebar-button-menu");
  const on_popup_showing = () => { const vertical = (() => { try {
    return Services.prefs.getBoolPref("sidebar.verticalTabs", true);
  } catch (__e____scope__3__4__3__9__6__2__12__1__2__3__1__2__2__1__0) {
    return true;
  } })();
const is_compact = (vertical ? compact.isCompactVertical() : compact.isCompactHorizontal());
compact_item.setAttribute("label", (((_truthy) => _truthy !== false && _truthy != null)(is_compact) ? "Disable Compact" : "Enable Compact"));
(collapse_item.hidden = (!vertical));
if (vertical) {
  const expanded = sidebar_main.hasAttribute("sidebar-launcher-expanded");
  collapse_item.setAttribute("label", (expanded ? "Collapse Layout" : "Expand Layout"));
}
(strip_item.hidden = vertical);
if ((!vertical)) {
  const strip_on = (() => { try {
    return Services.prefs.getBoolPref("gjoa.layout.horizontalSidebarStrip", false);
  } catch (__e____scope__3__4__3__9__6__2__12__1__2__3__6__2__1__2__2__1__0) {
    return false;
  } })();
  strip_item.setAttribute("label", (strip_on ? "Hide Strip" : "Show Strip"));
}
const sidebar_open = (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(window.SidebarController.isOpen, undefined))) : _logical))(window.SidebarController)) ? window.SidebarController.isOpen : ((!((_truthy) => _truthy !== false && _truthy != null)(sidebar_main.hidden)) && (sidebar_main.getBoundingClientRect().width > 0)));
sidebar_item.setAttribute("label", (((_truthy) => _truthy !== false && _truthy != null)(sidebar_open) ? "Disable Sidebar" : "Enable Sidebar"));
layout_item.setAttribute("label", (vertical ? "Horizontal Tabs" : "Vertical Tabs"));
if (((_truthy) => _truthy !== false && _truthy != null)(window.gjoaBlocking)) {
  block_item.setAttribute("label", (((_truthy) => _truthy !== false && _truthy != null)(window.gjoaBlocking.enabled()) ? "Disable Blocking" : "Enable Blocking"));
}
if (((_truthy) => _truthy !== false && _truthy != null)(compact.isCompactVertical())) {
  compact.pinSidebar();
}
if (((_truthy) => _truthy !== false && _truthy != null)(compact.isCompactHorizontal())) {
  return compact.pinToolbox();
} };
  const on_popup_hidden = () => { compact.reconcile("menu:popuphidden");
return compact.reconcileHorizontal("menu:popuphidden"); };
  menu.addEventListener("popupshowing", on_popup_showing);
  menu.addEventListener("popuphidden", on_popup_hidden);
  return {destroy: () => { button.removeEventListener("click", on_click);
strip_hide_button.removeEventListener("click", on_strip_hide_click);
menu.removeEventListener("popupshowing", on_popup_showing);
menu.removeEventListener("popuphidden", on_popup_hidden);
menu.remove();
button.remove();
strip_hide_button.remove();
return (sidebar_button.style.display = ""); }};
}

make_sidebar_button_bang = function(deps) {
  const $beagle$binding$0 = deps;
  let sidebarMain = $beagle$binding$0["sidebarMain"];
  let compact = $beagle$binding$0["compact"];
  const log = create_logger_bang("drawer/sidebar-button");
  const sidebar_main = sidebarMain;
  const native = document.getElementById("sidebar-button");
  if (((_truthy) => _truthy !== false && _truthy != null)(native)) {
    return install_bang(native, sidebar_main, compact);
  } else {
    log("init:no native #sidebar-button after nav-bar repair — skipping custom-button swap");
    return {destroy: () => { return null; }};
  }
}

}

{

make_omni_icon_bang = function(deps) {
  const log = create_logger_bang("drawer/omni-icon");
  const nav_bar = document.getElementById("nav-bar");
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(nav_bar)) || document.getElementById("gjoa-omni-icon-button")))) {
    return {destroy: () => null};
  } else {
    const btn = (() => { const __e____scope__3__1__4__2__3__1__2__1__0 = document.createXULElement("toolbarbutton"); (__e____scope__3__1__4__2__3__1__2__1__0.id = "gjoa-omni-icon-button");
return __e____scope__3__1__4__2__3__1__2__1__0; })();
    const menu = (() => { const __e____scope__3__1__4__2__3__1__5__1__0 = document.createXULElement("menupopup"); (__e____scope__3__1__4__2__3__1__5__1__0.id = "gjoa-omni-icon-menu");
return __e____scope__3__1__4__2__3__1__5__1__0; })();
    const do_action = (name, thunk) => (() => { try {
    return thunk();
  } catch (e) {
    return log.error(("".concat(name, " failed")), e);
  } })();
    btn.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
    btn.setAttribute("type", "menu");
    btn.setAttribute("tooltiptext", "Navigation");
    btn.setAttribute("removable", "false");
    btn.setAttribute("skipintoolbarset", "true");
    btn.setAttribute("label", "Navigation");
    const back = (() => { const __item____scope__3__1__4__2__3__8__1__2__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__3__8__1__2__1__0.setAttribute("label", "Back");
__item____scope__3__1__4__2__3__8__1__2__1__0.addEventListener("command", () => do_action("back", () => { if (((_truthy) => _truthy !== false && _truthy != null)(gBrowser.canGoBack)) {
  return gBrowser.goBack();
} }));
return __item____scope__3__1__4__2__3__8__1__2__1__0; })();
    const fwd = (() => { const __item____scope__3__1__4__2__3__8__1__5__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__3__8__1__5__1__0.setAttribute("label", "Forward");
__item____scope__3__1__4__2__3__8__1__5__1__0.addEventListener("command", () => do_action("forward", () => { if (((_truthy) => _truthy !== false && _truthy != null)(gBrowser.canGoForward)) {
  return gBrowser.goForward();
} }));
return __item____scope__3__1__4__2__3__8__1__5__1__0; })();
    const reload = (() => { const __item____scope__3__1__4__2__3__8__1__8__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__3__8__1__8__1__0.setAttribute("label", "Reload");
__item____scope__3__1__4__2__3__8__1__8__1__0.addEventListener("command", () => do_action("reload", () => gBrowser.reload()));
return __item____scope__3__1__4__2__3__8__1__8__1__0; })();
    const ext = (() => { const __item____scope__3__1__4__2__3__8__1__11__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__3__8__1__11__1__0.setAttribute("label", "Extensions");
__item____scope__3__1__4__2__3__8__1__11__1__0.addEventListener("command", () => do_action("extensions", () => { const b = document.getElementById("unified-extensions-button");
if (((_truthy) => _truthy !== false && _truthy != null)(b)) {
  return b.click();
} }));
return __item____scope__3__1__4__2__3__8__1__11__1__0; })();
    const side = (() => { const __item____scope__3__1__4__2__3__8__1__14__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__3__8__1__14__1__0.setAttribute("label", "Toggle sidebar");
__item____scope__3__1__4__2__3__8__1__14__1__0.addEventListener("command", () => do_action("sidebar", () => { const sc = window.SidebarController;
return ((((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? sc.toggle : _logical))(sc))) ? sc.toggle() : (() => { const cmd = document.getElementById("cmd_toggleSidebar"); if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? cmd.doCommand : _logical))(cmd))) {
  return cmd.doCommand();
} })()); }));
return __item____scope__3__1__4__2__3__8__1__14__1__0; })();
    menu.append(back, fwd, reload, document.createXULElement("menuseparator"), ext, side);
    btn.appendChild(menu);
    const pui = document.getElementById("PanelUI-button");
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (pui.parentNode === nav_bar) : _logical))(pui))) {
      pui.after(btn);
    } else {
      nav_bar.prepend(btn);
    }
    return {destroy: () => btn.remove()};
  }
}

}

{
const $$bc$equiv = $$bc.equivV;

const FLOATING_HINTS = [{key: "ctrl+j", act: "down"}, {key: "ctrl+k", act: "up"}, {key: "esc", act: "exit"}];

make_urlbar_bang = function(deps) {
  const urlbar = deps.urlbar;
  const root = document.documentElement;
  const log = create_logger_bang("urlbar");
  const state = {activated: false, intent: "current", backdrop: null, ghost: null, hints: null, healObs: null, healFn: null, urlbarH0: "", containerH0: "", stage: null, home: null, popover0: null, pinObs: null};
  const intent_attr = (_pct1) => (($$bc$equiv(_pct1, "newTab")) ? "new-tab" : "current");
  const container = () => ((_logical) => (_logical !== false && _logical != null ? _logical : urlbar.parentNode))((() => { const some_thread____0 = state.home; return ((some_thread____0 == null) ? null : some_thread____0.parent); })());
  const ensure_hints = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____1 = state.hints; return ((some_thread____1 == null) ? null : some_thread____1.isConnected); })()))) {
  const el = document.createElement("div");
  (el.id = "gjoa-urlbar-hints");
  el.setAttribute("aria-hidden", "true");
  FLOATING_HINTS.forEach((h) => { const pair = (() => { const __e____scope__4__1__4__1__20__3__2__4__3__3__1__2__1__0 = document.createElement("span"); (__e____scope__4__1__4__1__20__3__2__4__3__3__1__2__1__0.className = "gjoa-urlbar-hint");
return __e____scope__4__1__4__1__20__3__2__4__3__3__1__2__1__0; })();
const k = (() => { const __e____scope__4__1__4__1__20__3__2__4__3__3__1__5__1__0 = document.createElement("span"); (__e____scope__4__1__4__1__20__3__2__4__3__3__1__5__1__0.className = "gjoa-urlbar-hint-key");
return __e____scope__4__1__4__1__20__3__2__4__3__3__1__5__1__0; })();
const a = (() => { const __e____scope__4__1__4__1__20__3__2__4__3__3__1__8__1__0 = document.createElement("span"); (__e____scope__4__1__4__1__20__3__2__4__3__3__1__8__1__0.className = "gjoa-urlbar-hint-act");
return __e____scope__4__1__4__1__20__3__2__4__3__3__1__8__1__0; })();
(k.textContent = h.key);
(a.textContent = h.act);
pair.appendChild(k);
pair.appendChild(a);
return el.appendChild(pair); });
  urlbar.appendChild(el);
  return (state.hints = el);
} };
  const ensure_stage_bang = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____2 = state.stage; return ((some_thread____2 == null) ? null : some_thread____2.isConnected); })()))) {
  const el = (() => { const __e____scope__4__1__4__1__23__3__2__1__2__1__0 = document.createXULElement("toolbar"); (__e____scope__4__1__4__1__23__3__2__1__2__1__0.id = "gjoa-urlbar-stage");
return __e____scope__4__1__4__1__23__3__2__1__2__1__0; })();
  el.setAttribute("customizable", "false");
  root.appendChild(el);
  (state.stage = el);
}
return state.stage; };
  const ensure_staged_bang = () => { const st = ensure_stage_bang();
if ((!((_truthy) => _truthy !== false && _truthy != null)(st.contains(urlbar)))) {
  (state.home = {parent: urlbar.parentNode, next: urlbar.nextSibling});
  return st.appendChild(urlbar);
} };
  const restore_home_bang = () => { const h = state.home;
if (((_truthy) => _truthy !== false && _truthy != null)(h)) {
  (state.home = null);
  const p = h.parent;
  const n = h.next;
  if (((_truthy) => _truthy !== false && _truthy != null)(p)) {
    return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (n.parentNode === p) : _logical))(n)) ? p.insertBefore(urlbar, n) : p.appendChild(urlbar));
  }
} };
  const pin_container_height_bang = (c, want) => { if (((_truthy) => _truthy !== false && _truthy != null)(state.pinObs)) {
  state.pinObs.disconnect();
  (state.pinObs = null);
}
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(want, ""))) : _logical))(c))) {
  const obs = new MutationObserver(() => { if ((!($$bc$equiv(c.style.getPropertyValue("--urlbar-container-height"), want)))) {
  obs.disconnect();
  (state.pinObs = null);
  return c.style.setProperty("--urlbar-container-height", want);
} });
  obs.observe(c, {attributes: true, attributeFilter: ["style"]});
  (state.pinObs = obs);
  return window.setTimeout(() => { if ((state.pinObs === obs)) {
  obs.disconnect();
  return (state.pinObs = null);
} }, 1000);
} };
  const install_popover_shim_bang = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(urlbar.gjoaPopoverShim))) {
  const native = urlbar.showPopover;
  if (((_truthy) => _truthy !== false && _truthy != null)(native)) {
    (urlbar.gjoaPopoverShim = true);
    return (urlbar.showPopover = () => { if (((_truthy) => _truthy !== false && _truthy != null)(urlbar.hasAttribute("popover"))) {
  return native.call(urlbar);
} });
  }
} };
  const finish_teardown = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(state.activated))) {
  if (((_truthy) => _truthy !== false && _truthy != null)(state.healObs)) {
    state.healObs.disconnect();
    (state.healObs = null);
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(state.healFn)) {
    urlbar.removeEventListener("toggle", state.healFn);
    (state.healFn = null);
  }
  (() => { try {
    const a = document.activeElement;
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((a === urlbar) || urlbar.contains(a)) : _logical))(a))) {
    (() => { const some_thread____3 = window; if ((some_thread____3 == null)) {
  return null;
} else {
  const some_thread____4 = some_thread____3.gjoaFocusGuard;
  return ((some_thread____4 == null) ? null : some_thread____4.release());
} })();
    (() => { const some_thread____5 = window; if ((some_thread____5 == null)) {
  return null;
} else {
  const some_thread____6 = some_thread____5.gBrowser;
  if ((some_thread____6 == null)) {
    return null;
  } else {
    const some_thread____7 = some_thread____6.selectedBrowser;
    return ((some_thread____7 == null) ? null : some_thread____7.focus());
  }
} })();
  }
  restore_home_bang();
  (() => { const some_thread____8 = window; if ((some_thread____8 == null)) {
  return null;
} else {
  const some_thread____9 = some_thread____8.gURLBar;
  if ((some_thread____9 == null)) {
    return null;
  } else {
    const some_thread____10 = some_thread____9.view;
    return ((some_thread____10 == null) ? null : some_thread____10.close());
  }
} })();
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? urlbar.hidePopover : _logical))(urlbar.matches(":popover-open")))) {
    urlbar.hidePopover();
  }
  if (($$bc$equiv(state.popover0, "manual"))) {
    urlbar.setAttribute("popover", "manual");
    if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(urlbar.matches(":popover-open"))) && urlbar.showPopover))) {
      urlbar.showPopover();
    }
  } else {
    urlbar.removeAttribute("popover");
  }
  urlbar.removeAttribute("breakout-extend");
  if (($$bc$equiv(state.urlbarH0, ""))) {
    urlbar.style.removeProperty("--urlbar-height");
  } else {
    urlbar.style.setProperty("--urlbar-height", state.urlbarH0);
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(urlbar.parentNode)) {
    if (($$bc$equiv(state.containerH0, ""))) {
      urlbar.parentNode.style.removeProperty("--urlbar-container-height");
    } else {
      urlbar.parentNode.style.setProperty("--urlbar-container-height", state.containerH0);
    }
    return pin_container_height_bang(urlbar.parentNode, state.containerH0);
  }
  } catch (e) {
    return log("finishTeardown:collapse-error", {msg: String(e)});
  } })();
  root.setAttribute("gjoa-urlbar-snap", "");
  root.removeAttribute("gjoa-urlbar-floating");
  root.removeAttribute("gjoa-urlbar-intent");
  root.removeAttribute("gjoa-urlbar-teardown");
  root.removeAttribute("gjoa-urlbar-arming");
  if (((_truthy) => _truthy !== false && _truthy != null)(state.backdrop)) {
    state.backdrop.remove();
    (state.backdrop = null);
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(state.ghost)) {
    state.ghost.remove();
    (state.ghost = null);
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(state.hints)) {
    state.hints.remove();
    (state.hints = null);
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(state.stage)) {
    state.stage.remove();
    (state.stage = null);
  }
  return window.requestAnimationFrame(() => window.requestAnimationFrame(() => root.removeAttribute("gjoa-urlbar-snap")));
} };
  const deactivate_floating = () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.activated)) {
  (state.activated = false);
  log("deactivateFloating");
  root.setAttribute("gjoa-urlbar-teardown", "");
  const h = {done: false, f: null};
  const fire = (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(h.done)) && ((!((_truthy) => _truthy !== false && _truthy != null)(e)) || ((e.target === urlbar) && ($$bc$equiv(e.propertyName, "opacity"))))))) {
  (h.done = true);
  (() => { try {
    return urlbar.removeEventListener("transitionend", h.f);
  } catch (__) {
    return null;
  } })();
  return finish_teardown();
} };
  (h.f = fire);
  urlbar.addEventListener("transitionend", fire);
  return window.setTimeout(() => fire(null), 260);
} };
  const ensure_floating_promoted = () => { (() => { try {
    if ((!((_truthy) => _truthy !== false && _truthy != null)(urlbar.hasAttribute("breakout")))) {
    urlbar.setAttribute("breakout", "true");
  }
  const c = container();
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(c.hasAttribute("breakout"))) : _logical))(c))) {
    c.setAttribute("breakout", "true");
  }
  if ((!($$bc$equiv(urlbar.getAttribute("popover"), "manual")))) {
    urlbar.setAttribute("popover", "manual");
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(urlbar.matches(":popover-open"))) && urlbar.showPopover))) {
    return urlbar.showPopover();
  }
  } catch (e) {
    return log("activateFloating:promote-error", {msg: String(e)});
  } })();
return (() => { try {
    (() => { const some_thread____11 = window; if ((some_thread____11 == null)) {
  return null;
} else {
  const some_thread____12 = some_thread____11.gURLBar;
  return ((some_thread____12 == null) ? null : some_thread____12.focus());
} })();
  return (() => { const some_thread____13 = window; if ((some_thread____13 == null)) {
  return null;
} else {
  const some_thread____14 = some_thread____13.gURLBar;
  return ((some_thread____14 == null) ? null : some_thread____14.select());
} })();
  } catch (e) {
    return log("activateFloating:focus-error", {msg: String(e)});
  } })(); };
  const heal = () => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(root.hasAttribute("gjoa-urlbar-teardown"))) : _logical))(root.hasAttribute("gjoa-urlbar-floating")) : _logical))(state.activated))) {
  if (((_truthy) => _truthy !== false && _truthy != null)((((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____15 = document.getElementById("window-modal-dialog"); return ((some_thread____15 == null) ? null : some_thread____15.open); })()) || root.hasAttribute("window-modal-open")))) {
    log("heal:modal-dismiss");
    return deactivate_floating();
  } else {
    if ((!((_truthy) => _truthy !== false && _truthy != null)((((_truthy) => _truthy !== false && _truthy != null)(urlbar.matches(":popover-open")) && urlbar.hasAttribute("breakout"))))) {
      log("heal:re-promote", {popoverOpen: ((_truthy) => _truthy !== false && _truthy != null)(urlbar.matches(":popover-open")), breakout: urlbar.hasAttribute("breakout")});
      ensure_staged_bang();
      return ensure_floating_promoted();
    }
  }
} };
  const install_heal = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(state.healFn))) {
  (state.healFn = heal);
  urlbar.addEventListener("toggle", heal);
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(state.healObs))) {
  const obs = new MutationObserver(heal);
  obs.observe(urlbar, {attributes: true, attributeFilter: ["popover", "breakout"]});
  return (state.healObs = obs);
} };
  const activate_floating = (new_intent) => { (state.intent = new_intent);
root.removeAttribute("gjoa-urlbar-teardown");
const attr_val = intent_attr(state.intent);
if (((_truthy) => _truthy !== false && _truthy != null)(state.activated)) {
  log("activateFloating:re-arm", {intent: state.intent});
  root.setAttribute("gjoa-urlbar-intent", attr_val);
  ensure_hints();
  ensure_staged_bang();
  return ensure_floating_promoted();
} else {
  (state.activated = true);
  log("activateFloating", {intent: state.intent});
  if ((state.home == null)) {
    const c = container();
    (state.urlbarH0 = urlbar.style.getPropertyValue("--urlbar-height"));
    (state.containerH0 = (((_truthy) => _truthy !== false && _truthy != null)(c) ? c.style.getPropertyValue("--urlbar-container-height") : ""));
    (state.popover0 = urlbar.getAttribute("popover"));
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(state.ghost)) && (state.home == null)))) {
    (() => { try {
    const parent = container();
  if (((_truthy) => _truthy !== false && _truthy != null)(parent)) {
    const rect = urlbar.getBoundingClientRect();
    const cs = window.getComputedStyle(urlbar);
    const g = document.createElement("div");
    const txt = document.createElement("div");
    const ph = ((_logical) => (_logical !== false && _logical != null ? _logical : "Search with Google or enter address"))((() => { const some_thread____16 = window; if ((some_thread____16 == null)) {
  return null;
} else {
  const some_thread____17 = some_thread____16.gURLBar;
  if ((some_thread____17 == null)) {
    return null;
  } else {
    const some_thread____18 = some_thread____17.inputField;
    return ((some_thread____18 == null) ? null : some_thread____18.placeholder);
  }
} })());
    const container = ((_logical) => (_logical !== false && _logical != null ? _logical : urlbar))(urlbar.querySelector(".urlbar-input-container"));
    const visible_p = (el) => { const r = el.getBoundingClientRect();
const c = window.getComputedStyle(el);
return ((r.width > 0) && ((r.height > 0) && ((!($$bc$equiv(c.display, "none"))) && (!($$bc$equiv(c.visibility, "hidden")))))); };
    const inner_nodes = (el) => { const sr = el.shadowRoot;
return Array.from(el.querySelectorAll("*")).concat((((_truthy) => _truthy !== false && _truthy != null)(sr) ? Array.from(sr.querySelectorAll("*")) : [])).filter(visible_p); };
    const inside_p = (host, n) => (((_truthy) => _truthy !== false && _truthy != null)(host.contains(n)) || ((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____19 = host.shadowRoot; return ((some_thread____19 == null) ? null : some_thread____19.contains(n)); })()));
    const content_url = (c) => { const m = new RegExp("url\\(\"?([^\")]+)\"?\\)").exec(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(c.content));
return (((_truthy) => _truthy !== false && _truthy != null)(m) ? m[1] : null); };
    const glyph_of = (el) => { const c = window.getComputedStyle(el);
const isrc = el.getAttribute("iconsrc");
const curl = content_url(c);
const src = (($$bc$equiv(el.localName, "img")) ? el.src : null);
return ((((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(isrc, ""))) : _logical))(isrc))) ? {css: ("".concat("background:url(\"", isrc, "\") center/contain no-repeat;"))} : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(src, ""))) : _logical))(src))) ? {css: ("".concat("background:url(\"", src, "\") center/contain no-repeat;"))} : (((_truthy) => _truthy !== false && _truthy != null)(curl)) ? {css: ("".concat("-moz-context-properties:fill;fill:", c.fill, ";", "background:url(\"", curl, "\") center/contain no-repeat;"))} : ((!($$bc$equiv(c.listStyleImage, "none")))) ? {css: ("".concat("-moz-context-properties:fill;fill:", c.fill, ";", "background:", c.listStyleImage, " center/contain no-repeat;"))} : ((!($$bc$equiv(c.backgroundImage, "none")))) ? {css: ("".concat("-moz-context-properties:fill;fill:", c.fill, ";", "background:", c.backgroundImage, " center/contain no-repeat;"))} : ((!($$bc$equiv(c.maskImage, "none")))) ? {css: ("".concat("background-color:", c.color, ";", "mask:", c.maskImage, " center/contain no-repeat;", "-webkit-mask:", c.maskImage, " center/contain no-repeat;"))} : null); };
    const own_text = (el) => Array.from(el.childNodes).filter((n) => ($$bc$equiv(n.nodeType, 3))).map((n) => n.textContent).join("").trim();
    const parts_of = (el) => { const nodes = inner_nodes(el);
const painter_p = (n) => ((_truthy) => _truthy !== false && _truthy != null)(glyph_of(n));
const leaf_glyph_p = (n) => ((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(nodes.some((m) => ((!($$bc$equiv(m, n))) && ((_logical) => (_logical !== false && _logical != null ? painter_p(m) : _logical))(inside_p(n, m)))))) : _logical))(painter_p(n));
const out = [];
nodes.forEach((n) => { const t = own_text(n);
return ((((_truthy) => _truthy !== false && _truthy != null)(leaf_glyph_p(n))) ? out.push({el: n, css: glyph_of(n).css}) : ((!($$bc$equiv(t, "")))) ? (() => { const c = window.getComputedStyle(n); return out.push({el: n, text: t, css: ("".concat("font:", c.font, ";color:", c.color, ";", "white-space:nowrap;overflow:hidden;"))}); })() : null); });
if (($$bc$equiv(out.length, 0))) {
  const g = glyph_of(el);
  if (((_truthy) => _truthy !== false && _truthy != null)(g)) {
    out.push({el: el, css: g.css});
  }
}
return out; };
    const opaque_p = (col) => ((_logical) => (_logical !== false && _logical != null ? ((!($$bc$equiv(col, "transparent"))) && (!((_truthy) => _truthy !== false && _truthy != null)(col.includes(", 0)")))) : _logical))(col);
    const box_chrome = (ch, r) => { const hit = [ch].concat(inner_nodes(ch)).find((n) => { const nr = n.getBoundingClientRect();
const c = window.getComputedStyle(n);
const nw = nr.width;
const nh = nr.height;
const rw = r.width;
const rh = r.height;
return ((Math.abs((nw - rw)) < 2) && ((Math.abs((nh - rh)) < 2) && ((_truthy) => _truthy !== false && _truthy != null)(opaque_p(c.backgroundColor)))); });
if (((_truthy) => _truthy !== false && _truthy != null)(hit)) {
  const c = window.getComputedStyle(hit);
  return ("".concat("background:", c.backgroundColor, ";", "border-radius:", c.borderRadius, ";"));
} else {
  return "";
} };
    const input_box = container.querySelector("moz-input-box, .urlbar-input-box");
    const text_el = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : input_box))(urlbar.querySelector(".urlbar-input"))))((() => { const some_thread____20 = window; if ((some_thread____20 == null)) {
  return null;
} else {
  const some_thread____21 = some_thread____20.gURLBar;
  return ((some_thread____21 == null) ? null : some_thread____21.inputField);
} })());
    const rect_left = rect.left;
    const input_left = (((_truthy) => _truthy !== false && _truthy != null)(text_el) ? (() => { const text_left = text_el.getBoundingClientRect().left; return (text_left - rect_left); })() : 36);
    const kids = Array.from(container.children);
    const input_idx = kids.indexOf(input_box);
    const leading = (((input_idx >= 0) ? kids.slice(0, input_idx) : kids)).filter(visible_p);
    const value = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____22 = window; if ((some_thread____22 == null)) {
  return null;
} else {
  const some_thread____23 = some_thread____22.gURLBar;
  return ((some_thread____23 == null) ? null : some_thread____23.value);
} })());
    const has_value_p = (!($$bc$equiv(value.trim(), "")));
    const text_str = (((_truthy) => _truthy !== false && _truthy != null)(has_value_p) ? value : ph);
    (g.id = "gjoa-urlbar-ghost");
    g.setAttribute("aria-hidden", "true");
    (g.style.cssText = ("".concat("position:absolute;display:block;box-sizing:border-box;padding:0;", "width:", rect.width, "px;height:", rect.height, "px;", "pointer-events:none;overflow:hidden;white-space:nowrap;", "border:", cs.border, ";border-radius:", cs.borderRadius, ";", "background:", cs.backgroundColor, ";", "font:", cs.font, ";color:", cs.color, ";")));
    (() => { leading.forEach((ch) => {
  const r = ch.getBoundingClientRect();
  const r_left = r.left;
  const r_top = r.top;
  const rect_top = rect.top;
  const parts = parts_of(ch);
  const slot = document.createElement("div");
  if ((parts.length > 0)) {
    (slot.style.cssText = ("".concat("position:absolute;box-sizing:border-box;", "left:", (r_left - rect_left), "px;", "top:", (r_top - rect_top), "px;", "width:", r.width, "px;height:", r.height, "px;", box_chrome(ch, r))));
    (() => { parts.forEach((p) => {
  const pr = p.el.getBoundingClientRect();
  const pr_left = pr.left;
  const pr_top = pr.top;
  const ic = document.createElement("div");
  (ic.style.cssText = ("".concat("position:absolute;box-sizing:border-box;", "left:", (pr_left - r_left), "px;", "top:", (pr_top - r_top), "px;", "width:", pr.width, "px;height:", pr.height, "px;", "opacity:.9;", p.css)));
  if (((_truthy) => _truthy !== false && _truthy != null)(p.text)) {
    (ic.textContent = p.text);
  }
  slot.appendChild(ic);
}); })();
    g.appendChild(slot);
  }
}); })();
    (txt.textContent = text_str);
    (txt.style.cssText = ("".concat("position:absolute;top:0;bottom:0;display:flex;align-items:center;", "left:", input_left, "px;right:8px;overflow:hidden;", "text-overflow:ellipsis;opacity:", (((_truthy) => _truthy !== false && _truthy != null)(has_value_p) ? ".95" : ".55"), ";")));
    g.appendChild(txt);
    parent.insertBefore(g, urlbar);
    return (state.ghost = g);
  }
  } catch (e) {
    return log("activateFloating:ghost-error", {msg: String(e)});
  } })();
  }
  root.setAttribute("gjoa-urlbar-arming", "");
  root.setAttribute("gjoa-urlbar-floating", "");
  root.setAttribute("gjoa-urlbar-intent", attr_val);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(state.backdrop))) {
    const bd = document.createElement("div");
    (bd.id = "gjoa-urlbar-backdrop");
    bd.addEventListener("mousedown", () => deactivate_floating());
    root.appendChild(bd);
    (state.backdrop = bd);
  }
  ensure_staged_bang();
  ensure_hints();
  ensure_floating_promoted();
  install_heal();
  const reveal = () => root.removeAttribute("gjoa-urlbar-arming");
  window.requestAnimationFrame(() => window.requestAnimationFrame(reveal));
  return window.setTimeout(reveal, 120);
} };
  const is_floating = () => state.activated;
  const on_focus_out = (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(state.activated)) {
  return setTimeout(() => { if (((_truthy) => _truthy !== false && _truthy != null)(state.activated)) {
  const a = document.activeElement;
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((a === urlbar) || urlbar.contains(a)) : _logical))(a)))) {
    return deactivate_floating();
  }
} }, 0);
} };
  const handle_accel = (e) => { const accel = ((_logical) => (_logical !== false && _logical != null ? _logical : e.metaKey))(e.ctrlKey);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(e.shiftKey)) && (!((_truthy) => _truthy !== false && _truthy != null)(e.altKey))) : _logical))(accel))) {
  const k = e.key;
  if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(k, "j")) || ($$bc$equiv(k, "k"))))) {
    const view = (() => { const some_thread____24 = window; if ((some_thread____24 == null)) {
  return null;
} else {
  const some_thread____25 = some_thread____24.gURLBar;
  return ((some_thread____25 == null) ? null : some_thread____25.view);
} })();
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? view.selectBy : _logical))(view))) {
      e.preventDefault();
      e.stopImmediatePropagation();
      (() => { try {
    return view.selectBy((($$bc$equiv(k, "j")) ? 1 : -1));
  } catch (err) {
    return log("selectBy:error", {msg: String(err)});
  } })();
      return true;
    }
  }
} };
  const on_keydown = (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(handle_accel(e))) && state.activated))) {
  return ((($$bc$equiv(e.key, "Escape"))) ? (() => { e.preventDefault();
e.stopImmediatePropagation();
deactivate_floating();
return setTimeout(() => (() => { try {
    (() => { const some_thread____26 = window; if ((some_thread____26 == null)) {
  return null;
} else {
  const some_thread____27 = some_thread____26.gURLBar;
  if ((some_thread____27 == null)) {
    return null;
  } else {
    const some_thread____28 = some_thread____27.view;
    return ((some_thread____28 == null) ? null : some_thread____28.close());
  }
} })();
  const a = document.activeElement;
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((a === urlbar) || urlbar.contains(a)) : _logical))(a))) {
    (() => { const some_thread____29 = window; if ((some_thread____29 == null)) {
  return null;
} else {
  const some_thread____30 = some_thread____29.gjoaFocusGuard;
  return ((some_thread____30 == null) ? null : some_thread____30.release());
} })();
    return (() => { const some_thread____31 = window; if ((some_thread____31 == null)) {
  return null;
} else {
  const some_thread____32 = some_thread____31.gBrowser;
  if ((some_thread____32 == null)) {
    return null;
  } else {
    const some_thread____33 = some_thread____32.selectedBrowser;
    return ((some_thread____33 == null) ? null : some_thread____33.focus());
  }
} })();
  }
  } catch (err) {
    return log("escape:teardown-error", {msg: String(err)});
  } })(), 135); })() : (($$bc$equiv(e.key, "Enter"))) ? (() => { if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(state.intent, "newTab")) && (!((_truthy) => _truthy !== false && _truthy != null)(e.altKey))))) {
  e.preventDefault();
  e.stopImmediatePropagation();
  log("intercept:newTab-enter");
  const target = e.target;
  target.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter", code: "Enter", keyCode: 13, which: 13, altKey: true, bubbles: true, cancelable: true, view: window}));
}
return setTimeout(deactivate_floating, 0); })() : null);
} };
  const on_activate_request = (e) => { const detail = e.detail;
return activate_floating((((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(detail.intent, "newTab")) : _logical))(detail)) ? "newTab" : "current")); };
  const on_deactivate_request = () => deactivate_floating();
  install_popover_shim_bang();
  urlbar.addEventListener("focusout", on_focus_out, true);
  urlbar.addEventListener("keydown", on_keydown, true);
  document.addEventListener("gjoa-urlbar-activate", on_activate_request);
  document.addEventListener("gjoa-urlbar-deactivate", on_deactivate_request);
  return {activateFloating: activate_floating, deactivateFloating: deactivate_floating, isFloating: is_floating, destroy: () => { urlbar.removeEventListener("focusout", on_focus_out, true);
urlbar.removeEventListener("keydown", on_keydown, true);
document.removeEventListener("gjoa-urlbar-activate", on_activate_request);
document.removeEventListener("gjoa-urlbar-deactivate", on_deactivate_request);
if (((_truthy) => _truthy !== false && _truthy != null)(state.healObs)) {
  state.healObs.disconnect();
  (state.healObs = null);
}
if (((_truthy) => _truthy !== false && _truthy != null)(state.healFn)) {
  urlbar.removeEventListener("toggle", state.healFn);
  (state.healFn = null);
}
if (((_truthy) => _truthy !== false && _truthy != null)(state.pinObs)) {
  state.pinObs.disconnect();
  (state.pinObs = null);
}
return deactivate_floating(); }};
}

}

{
const $$bc$equiv = $$bc.equivV;

function init_bang() {
  const sidebar_main = document.getElementById("sidebar-container");
  const navigator_toolbox = document.getElementById("navigator-toolbox");
  const urlbar_container = document.getElementById("urlbar-container");
  const nav_bar = document.getElementById("nav-bar");
  const urlbar = document.getElementById("urlbar");
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(sidebar_main)) || ((!((_truthy) => _truthy !== false && _truthy != null)(navigator_toolbox)) || ((!((_truthy) => _truthy !== false && _truthy != null)(urlbar_container)) || (!((_truthy) => _truthy !== false && _truthy != null)(nav_bar))))))) {
    return console.error("gjoa-drawer: missing required elements");
  } else {
    const focus_guard = make_focus_guard_bang();
    const layout = make_layout_bang({sidebarMain: sidebar_main, navigatorToolbox: navigator_toolbox, urlbarContainer: urlbar_container, navBar: nav_bar, urlbar: urlbar});
    const drag_overlay = make_drag_overlay_bang({sidebarMain: sidebar_main});
    const compact = make_compact_bang({sidebarMain: sidebar_main, navigatorToolbox: navigator_toolbox, urlbar: urlbar});
    const state = {urlbar_api: null, urlbar_key: null};
    if (((_truthy) => _truthy !== false && _truthy != null)(urlbar)) {
      (state["urlbar-api"] = make_urlbar_bang({urlbar: urlbar}));
      (state["urlbar-key"] = (e) => { const accel = ((_logical) => (_logical !== false && _logical != null ? _logical : e.metaKey))(e.ctrlKey);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(e.shiftKey)) && (!((_truthy) => _truthy !== false && _truthy != null)(e.altKey))) : _logical))(accel))) {
  if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(e.key, "l")) || ($$bc$equiv(e.key, "L"))))) {
    return state["urlbar-api"].activateFloating("current");
  }
} });
      document.addEventListener("keydown", state["urlbar-key"], true);
    }
    (window.gjoaCompact = compact);
    (window.gjoaFocusGuard = focus_guard);
    const sidebar_button = make_sidebar_button_bang({sidebarMain: sidebar_main, compact: compact});
    const banner = make_banner_bang();
    (() => { try {
    return make_omni_icon_bang({});
  } catch (e) {
    return console.error("gjoa-drawer: omni-icon failed", e);
  } })();
    const __el____scope__3__4__2__3__5__3__1__0 = window;
    const __ev____scope__3__4__2__3__5__3__1__3 = "unload";
    const __h____scope__3__4__2__3__5__3__1__6 = () => { layout.destroy();
drag_overlay.destroy();
compact.destroy();
(window.gjoaCompact = null);
(window.gjoaFocusGuard = null);
if (((_truthy) => _truthy !== false && _truthy != null)(state["urlbar-key"])) {
  document.removeEventListener("keydown", state["urlbar-key"], true);
  (state["urlbar-key"] = null);
}
if (((_truthy) => _truthy !== false && _truthy != null)(state["urlbar-api"])) {
  state["urlbar-api"].destroy();
}
sidebar_button.destroy();
focus_guard.destroy();
return banner.destroy(); };
    __el____scope__3__4__2__3__5__3__1__0.addEventListener(__ev____scope__3__4__2__3__5__3__1__3, __h____scope__3__4__2__3__5__3__1__6, {once: true});
    if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(__ev____scope__3__4__2__3__5__3__1__3, "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__3__4__2__3__5__3__1__0.__gjoaHR.teardowns : _logical))(__el____scope__3__4__2__3__5__3__1__0.__gjoaHR)))) {
      __el____scope__3__4__2__3__5__3__1__0.__gjoaHR.teardowns.push(__h____scope__3__4__2__3__5__3__1__6);
    }
    __h____scope__3__4__2__3__5__3__1__6;
    return console.log("gjoa-drawer: initialized");
  }
}

init_bang();

}
})();