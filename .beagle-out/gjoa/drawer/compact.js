import { create_logger_bang } from '../tabs/log.js';
import { collapse_protection_duration_ms } from './timing.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

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

export function make_compact_bang(deps) {
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
