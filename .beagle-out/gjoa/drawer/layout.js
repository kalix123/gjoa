import { with_urlbar_focus_bang } from './focus.js';
import { create_logger_bang } from '../tabs/log.js';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

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

export function make_layout_bang(deps) {
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
