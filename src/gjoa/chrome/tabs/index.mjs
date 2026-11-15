import { build_context_menu_bang, build_group_context_menu_bang, build_panel_context_menu_bang } from './menu.mjs';
import { make_drag_bang } from './drag.mjs';
import { make_events_bang } from './events.mjs';
import { make_rows_bang } from './rows.mjs';
import { make_vim_bang } from './vim.mjs';
import { all_rows, all_tabs, pin_tab_id, tab_url, tree_data_bang, try_register_pin_attr_bang } from './helpers.mjs';
import { create_logger_bang } from './log.mjs';
import { make_history_bang } from './history.mjs';
import { make_content_focus_bang } from './content-focus.mjs';
import { ensure_vertical_tabs_default, apply_menubar_default } from '../firefox/prefs.mjs';
import { make_niri_binding_bang } from '../spaces/niri.mjs';
import { make_gjoa_bang } from '../platform/index.mjs';
import { make_saver_bang } from './snapshot.mjs';
import { make_layout_bang } from './layout.mjs';
import { make_spaces_bang } from '../spaces/manager.mjs';
import { closed_tabs, row_of, saved_tab_queue, selection, state, tree_of } from './state.mjs';

import { equiv, truthy } from "../lib/value.mjs";
const pfx_log = create_logger_bang("tabs");

const sidebar_main = document.getElementById("sidebar-container");

function clear_selection() {
  Array.from(selection).forEach((_pct1) => _pct1.removeAttribute("gjoa-multi"));
  return selection.clear();
}

function select_range(to_row) {
  const from_row = ((_logical) => (_logical !== false && _logical != null ? _logical : row_of.get(gBrowser.selectedTab)))(state.cursor);
  if (truthy(from_row)) {
    const rows = all_rows().filter((_pct1) => (!truthy(_pct1.hidden)));
    const from_idx = rows.indexOf(from_row);
    const to_idx = rows.indexOf(to_row);
    if (((from_idx >= 0) && (to_idx >= 0))) {
      clear_selection();
      const start = Math.min(from_idx, to_idx);
      const end = Math.max(from_idx, to_idx);
      return rows.slice(start, (end + 1)).forEach((r) => { selection.add(r);
return r.setAttribute("gjoa-multi", "true"); });
    }
  }
}

function remove_children_bang(container, stop_el) {
  return (() => {  while (true) {
    if (truthy(((_logical) => (_logical !== false && _logical != null ? (!(equiv(container.firstChild, stop_el))) : _logical))(container.firstChild))) { container.firstChild.remove();  continue; } else { return null; }
  } })();
}

function clear_all_rows_bang() {
  remove_children_bang(state.panel, state.spacer);
  return remove_children_bang(state.pinnedContainer, null);
}

function build_panel_bang(rows_api) {
  clear_all_rows_bang();
  Array.from(gBrowser.tabs).forEach((tab) => { const row = rows_api.createTabRow(tab);
return (truthy(((_logical) => (_logical !== false && _logical != null ? state.pinnedContainer : _logical))(tab.pinned)) ? state.pinnedContainer.appendChild(row) : state.panel.insertBefore(row, state.spacer)); });
  if (truthy(state.pinnedContainer)) {
    (state.pinnedContainer.hidden = (!truthy(state.pinnedContainer.querySelector(".gjoa-tab-row"))));
  }
  return rows_api.updateVisibility();
}

const history = make_history_bang();

const content_focus = make_content_focus_bang();

const gjoa_api = make_gjoa_bang({history: history});

(window.Gjoa = gjoa_api);

const rows_ref = {v: null};

const vim_ref = {v: null};

function update_space_header() {
  const el = state.spaceHeader;
  const label = (() => { const some_thread____0 = el; return ((some_thread____0 == null) ? null : some_thread____0.querySelector("#gjoa-space-header-label")); })();
  if (truthy(((_logical) => (_logical !== false && _logical != null ? label : _logical))(el))) {
    return label.setAttribute("value", spaces.active().name);
  }
}

const spaces = make_spaces_bang({onChange: () => { if (truthy(rows_ref.v)) {
  rows_ref.v.scheduleTreeResync();
}
if (truthy(schedule_save)) {
  schedule_save();
}
update_space_header();
if ((!truthy(spaces.isApplying()))) {
  const snap = {spaces: spaces.list(), tabSpaces: Array.from(gBrowser.tabs).map((t) => [tree_data_bang(t).id, spaces.spaceOf(t)])};
  const e = Services.wm.getEnumerator("navigator:browser");
  return (() => {  while (true) {
    if (truthy(e.hasMoreElements())) { (() => { const w = e.getNext(); if (truthy((!truthy(Object.is(w, window))) && w.Spaces)) {
  return w.Spaces.applyRemoteSpaces(snap);
} })();  continue; } else { return null; }
  } })();
} }, onActivated: (__prev, next) => { const current = gBrowser.selectedTab;
if ((!truthy(((_logical) => (_logical !== false && _logical != null ? (equiv(spaces.spaceOf(current), next)) : _logical))(current)))) {
  const in_next = Array.from(gBrowser.tabs).filter((_pct1) => (equiv(spaces.spaceOf(_pct1), next)));
  if ((in_next.length > 0)) {
    return (gBrowser.selectedTab = in_next[0]);
  }
} }, tabById: (gjoa_id) => Array.from(gBrowser.tabs).find((_pct1) => { const td = tree_data_bang(_pct1);
return ((_logical) => (_logical !== false && _logical != null ? (equiv(td.id, gjoa_id)) : _logical))(td); })});

(window.Spaces = spaces);

const e = Services.wm.getEnumerator("navigator:browser");
(() => {  while (true) {
    if (truthy(e.hasMoreElements())) {  const w = e.getNext(); if (truthy((!truthy(Object.is(w, window))) && w.Spaces)) { return spaces.applyRemoteSpaces({spaces: w.Spaces.list(), tabSpaces: []}); } else {  continue; } } else { return null; }
  } })();

make_niri_binding_bang();

export function should_defer_reveal_p(dynamic_on_p, narrow_p) {
  return (dynamic_on_p && narrow_p);
}

if (truthy((() => { try {
    return Services.prefs.getBoolPref("gjoa.layout.dynamicOrientation", true);
  } catch (__e____scope__22__1__2__1__0) {
    return true;
  } })())) {
  const threshold = (() => { try {
    return Services.prefs.getIntPref("gjoa.layout.narrowThreshold", 1000);
  } catch (__e____scope__22__2__1__2__2__1__0) {
    return 1000;
  } })();
  const mq = window.matchMedia(("".concat("(max-width: ", threshold, "px)")));
  const apply_orientation = () => { if (truthy((() => { try {
    return Services.prefs.getBoolPref("gjoa.layout.dynamicOrientation", true);
  } catch (__e____scope__22__2__1__8__3__1__2__1__0) {
    return true;
  } })())) {
  const want_horizontal = mq.matches;
  const is_vertical = (() => { try {
    return Services.prefs.getBoolPref("sidebar.verticalTabs", true);
  } catch (__e____scope__22__2__1__8__3__2__1__5__2__1__0) {
    return true;
  } })();
  if ((is_vertical === want_horizontal)) {
    return (() => { try {
    return Services.prefs.setBoolPref("sidebar.verticalTabs", (!want_horizontal));
  } catch (__e____scope__22__2__1__8__3__2__2__2__2__1__0) {
    return null;
  } })();
  }
} };
  if (truthy(mq.matches)) {
    document.documentElement.setAttribute("gjoa-booting", "");
    setTimeout(() => document.documentElement.removeAttribute("gjoa-booting"), 1200);
  }
  apply_orientation();
  mq.addEventListener("change", apply_orientation);
}

const apply_gap = () => document.documentElement.style.setProperty("--gjoa-card-gap", ("".concat((() => { try {
    return Services.prefs.getIntPref("gjoa.layout.cardGap", 8);
  } catch (__e____scope__23__1__2__3__4__1__2__1__0) {
    return 8;
  } })(), "px")));
const gap_observer = {observe: (__s, __t, __d) => apply_gap()};
apply_gap();
Services.prefs.addObserver("gjoa.layout.cardGap", gap_observer);

const schedule_save = make_saver_bang(() => { const snap = {tabs: Array.from(gBrowser.tabs), rows: () => all_rows(), savedTabQueue: saved_tab_queue, closedTabs: closed_tabs, nextTabId: state.nextTabId, tabUrl: tab_url, treeData: tree_data_bang, spaces: {spaces: spaces.list(), activeId: spaces.activeId(), tabSpaces: Array.from(gBrowser.tabs).map((t) => { const id = tree_data_bang(t).id;
const sp = spaces.spaceOf(t);
return [id, sp]; })}};
return snap; }, history, null);

function reconcile_selection_bang() {
  const sel = gBrowser.selectedTab;
  const active = spaces.activeId();
  if (truthy(((_logical) => (_logical !== false && _logical != null ? (!(equiv(spaces.spaceOf(sel), active))) : _logical))(sel))) {
    const in_active = Array.from(gBrowser.tabs).find((_pct1) => (equiv(spaces.spaceOf(_pct1), active)));
    return (truthy(in_active) ? (gBrowser.selectedTab = in_active) : spaces.setActive(spaces.spaceOf(sel)));
  }
}

const drag = make_drag_bang({clearSelection: clear_selection, scheduleTreeResync: () => rows_ref.v.scheduleTreeResync(), scheduleSave: schedule_save});

(rows_ref.v = make_rows_bang({setupDrag: drag.setupDrag, activateVim: (_pct1) => vim_ref.v.activateVim(_pct1), selectRange: select_range, clearSelection: clear_selection, cloneAsSibling: (_pct1) => vim_ref.v.cloneAsSibling(_pct1), startRename: (_pct1) => vim_ref.v.startRename(_pct1), scheduleSave: schedule_save, isTabInActiveSpace: (_pct1) => spaces.isVisible(_pct1), getActiveSpaceId: () => spaces.activeId(), isGroupInActiveSpace: (_pct1) => spaces.isSpaceActive(_pct1.spaceId)}));

const layout = make_layout_bang({sidebarMain: sidebar_main, rows: rows_ref.v, isTabInActiveSpace: (_pct1) => spaces.isVisible(_pct1), reconcileSelection: reconcile_selection_bang});

(vim_ref.v = make_vim_bang({rows: rows_ref.v, layout: layout, scheduleSave: schedule_save, clearSelection: clear_selection, selectRange: select_range, sidebarMain: sidebar_main, history: history, contentFocus: content_focus, spaces: spaces}));

const events = make_events_bang({rows: rows_ref.v, vim: vim_ref.v, scheduleSave: schedule_save, spaces: spaces});

function match_tabs_loop_bang(tab_nodes, tabs, ni, li_ref, applied, apply_fn) {
  if (((ni < tab_nodes.length) && (li_ref.v < tabs.length))) {
    const s = tab_nodes[ni];
    const live = tabs[li_ref.v];
    const live_url = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____1 = live; if ((some_thread____1 == null)) {
  return null;
} else {
  const some_thread____2 = some_thread____1.linkedBrowser;
  if ((some_thread____2 == null)) {
    return null;
  } else {
    const some_thread____3 = some_thread____2.currentURI;
    return ((some_thread____3 == null) ? null : some_thread____3.spec);
  }
} })());
    const pending = ((live_url === "about:blank"));
    if (truthy((equiv(live_url, s.url)) || pending)) {
      apply_fn(live, s, ni);
      const live_idx = li_ref.v;
      (li_ref.v = (live_idx + 1));
      return match_tabs_loop_bang(tab_nodes, tabs, (ni + 1), li_ref, applied, apply_fn);
    } else {
      const live_idx = li_ref.v;
      const off = (() => { let j = 1; while (true) {
    if (((j > 5) || ((live_idx + j) >= tabs.length))) { return 0; } else if ((equiv(((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____4 = tabs[(live_idx + j)]; if ((some_thread____4 == null)) {
  return null;
} else {
  const some_thread____5 = some_thread____4.linkedBrowser;
  if ((some_thread____5 == null)) {
    return null;
  } else {
    const some_thread____6 = some_thread____5.currentURI;
    return ((some_thread____6 == null) ? null : some_thread____6.spec);
  }
} })()), s.url))) { return j; } else { const _recur_0 = (j + 1); j = _recur_0; continue; }
  } })();
      if ((off > 0)) {
        apply_fn(tabs[(live_idx + off)], s, ni);
        (li_ref.v = (live_idx + off + 1));
      }
      return match_tabs_loop_bang(tab_nodes, tabs, (ni + 1), li_ref, applied, apply_fn);
    }
  }
}

const loaded_nodes_ref = {v: null};

function load_from_history_bang() {
  return history.getRecent(1).then((recent) => { if ((recent.length > 0)) {
  const env = recent[0].snapshot;
  return (() => { try {
    if ((!((env.nextTabId == null)))) {
    (state.nextTabId = env.nextTabId);
  }
  (closed_tabs.length = 0);
  closed_tabs.push.apply(closed_tabs, env.closedTabs);
  const tabs = all_tabs();
  const tab_nodes = env.nodes.filter((_pct1) => (!((_pct1.type === "group")))).map((_pct1) => clone_node_fields(_pct1));
  (state.lastLoadedNodes = tab_nodes.map((_pct1) => clone_node_fields(_pct1)));
  tab_nodes.forEach((s) => { const saved_id = s.id;
if (truthy(((_logical) => (_logical !== false && _logical != null ? (saved_id >= state.nextTabId) : _logical))(s.id))) {
  return (state.nextTabId = (saved_id + 1));
} });
  pfx_log("loadFromHistory", {nextTabId: state.nextTabId, savedNextTabId: env.nextTabId, tabNodes: tab_nodes.length, liveTabs: tabs.length, tabNodeIds: tab_nodes.map((_pct1) => _pct1.id), liveTabPfxIds: tabs.map((_pct1) => ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(((_logical) => (_logical !== false && _logical != null ? _pct1.getAttribute("gjoa-id") : _logical))(_pct1.getAttribute)))});
  const applied = new Set();
  const apply_fn = (tab, s, i) => { const id = ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const nid = state.nextTabId; (state.nextTabId = (nid + 1));
return nid; })()))(s.id);
tree_of.set(tab, {id: id, parentId: ((_logical) => (_logical !== false && _logical != null ? _logical : null))(s.parentId), name: ((_logical) => (_logical !== false && _logical != null ? _logical : null))(s.name), state: ((_logical) => (_logical !== false && _logical != null ? _logical : null))(s.state), collapsed: truthy(s.collapsed)});
pin_tab_id(tab, id);
return applied.add(i); };
  const li_ref = {v: 0};
  match_tabs_loop_bang(tab_nodes, tabs, 0, li_ref, applied, apply_fn);
  console.log(("".concat("gjoa-tabs: loaded ", tab_nodes.length, " saved tab nodes, ", "matched ", applied.size, " to live tabs (of ", tabs.length, ").")));
  (saved_tab_queue.length = 0);
  tab_nodes.forEach((s, i) => { if ((!(applied.has(i)))) {
  (s._origIdx = i);
  return saved_tab_queue.push(s);
} });
  if (truthy(env.spaces)) {
    const tab_by_gjoa_id = (gjoa_id) => tabs.find((_pct1) => { const td = tree_of.get(_pct1);
return ((_logical) => (_logical !== false && _logical != null ? (equiv(td.id, gjoa_id)) : _logical))(td); });
    spaces.hydrate(env.spaces, tab_by_gjoa_id);
  }
  return (loaded_nodes_ref.v = env.nodes);
  } catch (e) {
    return console.error("gjoa-tabs: loadFromHistory apply error", e);
  } })();
} });
}

function build_from_saved_bang() {
  const loaded_nodes = loaded_nodes_ref.v;
  if (((!truthy(loaded_nodes)) || (!truthy(state.panel)))) {
    return false;
  } else {
    const rows_api = rows_ref.v;
    const group_nodes = loaded_nodes.filter((_pct1) => ((_pct1.type === "group")));
    const leading_groups = [];
    const gafter = {entries: []};
    group_nodes.forEach((g) => { if (((g.afterTabId == null))) {
  return leading_groups.push(g);
} else {
  const entry = gafter.entries.find((_pct1) => (equiv(_pct1[0], g.afterTabId)));
  if (truthy(entry)) {
    return entry[1].push(g);
  } else {
    const arr = [g];
    return gafter.entries.push([g.afterTabId, arr]);
  }
} });
    const mk_group = (g) => { const row = rows_api.createGroupRow(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(g.name), ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(g.level));
(row._group.state = ((_logical) => (_logical !== false && _logical != null ? _logical : null))(g.state));
(row._group.collapsed = truthy(g.collapsed));
if (truthy(g.spaceId)) {
  (row._group.spaceId = g.spaceId);
}
rows_api.syncGroupRow(row);
return row; };
    clear_all_rows_bang();
    leading_groups.forEach((_pct1) => state.panel.insertBefore(mk_group(_pct1), state.spacer));
    Array.from(gBrowser.tabs).forEach((tab) => { const row = rows_api.createTabRow(tab);
if (truthy(((_logical) => (_logical !== false && _logical != null ? state.pinnedContainer : _logical))(tab.pinned))) {
  return state.pinnedContainer.appendChild(row);
} else {
  state.panel.insertBefore(row, state.spacer);
  const tid = tree_data_bang(tab).id;
  const entry = gafter.entries.find((_pct1) => (equiv(_pct1[0], tid)));
  if (truthy(entry)) {
    return entry[1].forEach((_pct1) => state.panel.insertBefore(mk_group(_pct1), state.spacer));
  }
} });
    if (truthy(state.pinnedContainer)) {
      (state.pinnedContainer.hidden = (!truthy(state.pinnedContainer.querySelector(".gjoa-tab-row"))));
    }
    (loaded_nodes_ref.v = null);
    rows_api.scheduleTreeResync();
    rows_api.updateVisibility();
    return true;
  }
}

function describe(el) {
  if ((!truthy(el))) {
    return "null";
  } else {
    const tag = ((_logical) => (_logical !== false && _logical != null ? _logical : "?"))((() => { const some_thread____7 = el; if ((some_thread____7 == null)) {
  return null;
} else {
  const some_thread____8 = some_thread____7.tagName;
  return ((some_thread____8 == null) ? null : some_thread____8.toLowerCase());
} })());
    const id_str = (truthy(el.id) ? ("".concat("#", el.id)) : "");
    const raw = (((typeof el.className === "string")) ? (() => { return el.className.trim(); })() : null);
    const cls = (truthy(raw) ? ("".concat(".", raw.split(new RegExp("\\s+")).slice(0, 2).join("."))) : "");
    return ("".concat(tag, id_str, cls));
  }
}

function init_bang() {
  (() => { try {
    return ensure_vertical_tabs_default();
  } catch (e) {
    return console.error("gjoa-tabs: ensureVerticalTabsDefault threw — continuing", e);
  } })();
  (() => { try {
    return apply_menubar_default(document);
  } catch (e) {
    return console.error("gjoa-tabs: applyMenubarDefault threw — continuing", e);
  } })();
  (() => { try {
    return try_register_pin_attr_bang();
  } catch (e) {
    return console.error("gjoa-tabs: tryRegisterPinAttr threw — continuing", e);
  } })();
  return load_from_history_bang().catch((_pct1) => console.error("gjoa-tabs: loadFromHistory threw — init proceeds with empty state", _pct1)).then(() => new Promise((_pct1) => requestAnimationFrame(_pct1)).then(() => { const rows_api = rows_ref.v;
const vim_api = vim_ref.v;
(() => { ["gjoa-pinned-container", "gjoa-tab-panel", "gjoa-space-header"].forEach((id) => {
  (() => { const some_thread____30 = document.getElementById(id); return ((some_thread____30 == null) ? null : some_thread____30.remove()); })();
}); })();
(state.pinnedContainer = (() => { const __e____scope__36__7__2__2__3__2__2__3__3__3__1__0 = document.createXULElement("vbox"); (__e____scope__36__7__2__2__3__2__2__3__3__3__1__0.id = "gjoa-pinned-container");
return __e____scope__36__7__2__2__3__2__2__3__3__3__1__0; })());
(state.pinnedContainer.hidden = true);
drag.setupPinnedContainerDrop(state.pinnedContainer);
(state.panel = (() => { const __e____scope__36__7__2__2__3__2__2__3__6__3__1__0 = document.createXULElement("vbox"); (__e____scope__36__7__2__2__3__2__2__3__6__3__1__0.id = "gjoa-tab-panel");
return __e____scope__36__7__2__2__3__2__2__3__6__3__1__0; })());
(state.spacer = (() => { const __e____scope__36__7__2__2__3__2__2__3__7__3__1__0 = document.createXULElement("box"); (__e____scope__36__7__2__2__3__2__2__3__7__3__1__0.id = "gjoa-tab-spacer");
return __e____scope__36__7__2__2__3__2__2__3__7__3__1__0; })());
state.spacer.setAttribute("flex", "1");
state.panel.appendChild(state.spacer);
drag.setupPanelDrop(state.panel);
(state.spaceHeader = (() => { const __e____scope__36__7__2__2__3__2__2__3__11__3__1__0 = document.createXULElement("hbox"); (__e____scope__36__7__2__2__3__2__2__3__11__3__1__0.id = "gjoa-space-header");
return __e____scope__36__7__2__2__3__2__2__3__11__3__1__0; })());
const header_label = (() => { const __e____scope__36__7__2__2__3__2__2__3__12__1__2__1__0 = document.createXULElement("label"); (__e____scope__36__7__2__2__3__2__2__3__12__1__2__1__0.id = "gjoa-space-header-label");
return __e____scope__36__7__2__2__3__2__2__3__12__1__2__1__0; })();
state.spaceHeader.appendChild(header_label);
state.spaceHeader.addEventListener("click", () => (() => { try {
    return vim_ref.v.runExCommand("space list");
  } catch (e) {
    return console.error("gjoa: space header click failed", e);
  } })());
update_space_header();
layout.positionPanel();
requestAnimationFrame(() => document.documentElement.removeAttribute("gjoa-booting"));
const obs = new MutationObserver(() => layout.requestPositionPanel());
const opts = {childList: true, attributes: true, attributeFilter: ["sidebar-launcher-expanded", "data-gjoa-compact", "gjoa-has-hover"]};
obs.observe(sidebar_main, opts);
Services.prefs.addObserver("sidebar.verticalTabs", {observe: () => layout.requestPositionPanel()});
if ((!build_from_saved_bang())) {
  build_panel_bang(rows_api);
}
build_context_menu_bang({startRename: vim_api.startRename, toggleCollapse: rows_api.toggleCollapse, createGroupRow: rows_api.createGroupRow, setCursor: vim_api.setCursor, updateVisibility: rows_api.updateVisibility, scheduleTreeResync: rows_api.scheduleTreeResync, scheduleSave: schedule_save});
build_group_context_menu_bang({startRename: vim_api.startRename, toggleCollapse: rows_api.toggleCollapse, syncGroupRow: rows_api.syncGroupRow, updateVisibility: rows_api.updateVisibility, scheduleSave: schedule_save});
const panel_menu = build_panel_context_menu_bang({createGroupRow: rows_api.createGroupRow, startRename: vim_api.startRename, setCursor: vim_api.setCursor, updateVisibility: rows_api.updateVisibility, scheduleSave: schedule_save});
vim_api.createModeline();
vim_api.setupVimKeys();
vim_api.setupGlobalKeys();
vim_api.focusPanelUnlessUrlbar();
const teardown_events = events.install();
Array.from(gBrowser.tabs).forEach((t) => { if ((!(row_of.has(t)))) {
  const row = rows_api.createTabRow(t);
  return (truthy(t.pinned) ? state.pinnedContainer.appendChild(row) : state.panel.insertBefore(row, state.spacer));
} });
reconcile_selection_bang();
rows_api.updateVisibility();
state.spacer.addEventListener("click", () => { const visible = all_rows().filter((_pct1) => (!truthy(_pct1.hidden)));
if ((visible.length > 0)) {
  return vim_api.activateVim((() => { const __a____scope__36__7__2__2__3__2__2__3__22__6__5__4__3__2__2__3__1__0 = visible; const __n____scope__36__7__2__2__3__2__2__3__22__6__5__4__3__2__2__3__1__3 = __a____scope__36__7__2__2__3__2__2__3__22__6__5__4__3__2__2__3__1__0.length; return __a____scope__36__7__2__2__3__2__2__3__22__6__5__4__3__2__2__3__1__0[(__n____scope__36__7__2__2__3__2__2__3__22__6__5__4__3__2__2__3__1__3 - 1)]; })());
} });
state.spacer.addEventListener("contextmenu", (e) => { e.preventDefault();
e.stopPropagation();
return panel_menu.openPopupAtScreen(e.screenX, e.screenY, true); });
const __el____scope__36__7__2__2__3__2__2__3__22__6__7__1__0 = window;
const __ev____scope__36__7__2__2__3__2__2__3__22__6__7__1__3 = "unload";
const __h____scope__36__7__2__2__3__2__2__3__22__6__7__1__6 = teardown_events;
__el____scope__36__7__2__2__3__2__2__3__22__6__7__1__0.addEventListener(__ev____scope__36__7__2__2__3__2__2__3__22__6__7__1__3, __h____scope__36__7__2__2__3__2__2__3__22__6__7__1__6, {once: true});
if (truthy(((__ev____scope__36__7__2__2__3__2__2__3__22__6__7__1__3 === "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__36__7__2__2__3__2__2__3__22__6__7__1__0.__gjoaHR.teardowns : _logical))(__el____scope__36__7__2__2__3__2__2__3__22__6__7__1__0.__gjoaHR))) {
  __el____scope__36__7__2__2__3__2__2__3__22__6__7__1__0.__gjoaHR.teardowns.push(__h____scope__36__7__2__2__3__2__2__3__22__6__7__1__6);
}
__h____scope__36__7__2__2__3__2__2__3__22__6__7__1__6;
const session_tagger = {observe: (__subject, topic) => { if (((topic === "quit-application"))) {
  return history.tagLatest("session").catch((_pct1) => console.error("gjoa-tabs: tagLatest on quit failed", _pct1));
} }};
Services.obs.addObserver(session_tagger, "quit-application");
const __el____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__0 = window;
const __ev____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__3 = "unload";
const __h____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__6 = () => Services.obs.removeObserver(session_tagger, "quit-application");
__el____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__0.addEventListener(__ev____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__3, __h____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__6, {once: true});
if (truthy(((__ev____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__3 === "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__0.__gjoaHR.teardowns : _logical))(__el____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__0.__gjoaHR))) {
  __el____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__0.__gjoaHR.teardowns.push(__h____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__6);
}
__h____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__6;
setTimeout(() => history.runRetention().catch((e) => console.error("gjoa-tabs: initial retention pass failed", e)), 30000);
const retention_timer = setInterval(() => history.runRetention().catch(() => null), (10 * 60 * 1000));
const __el____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__0 = window;
const __ev____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__3 = "unload";
const __h____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__6 = () => { clearInterval(retention_timer);
history.close().catch(() => null);
content_focus.destroy();
return gjoa_api.destroy(); };
__el____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__0.addEventListener(__ev____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__3, __h____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__6, {once: true});
if (truthy(((__ev____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__3 === "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__0.__gjoaHR.teardowns : _logical))(__el____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__0.__gjoaHR))) {
  __el____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__0.__gjoaHR.teardowns.push(__h____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__6);
}
__h____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__6;
if (truthy((() => { try {
    return Services.prefs.getBoolPref("gjoa.test.exposeAPI", false);
  } catch (__e____scope__36__7__2__2__3__2__2__3__22__6__11__1__2__1__0) {
    return false;
  } })())) {
  (window.gjoaTest = {state: state, treeOf: tree_of, rowOf: row_of, cursorId: () => { const r = state.cursor;
if (truthy(((_logical) => (_logical !== false && _logical != null ? r._tab : _logical))(r))) {
  const td = tree_of.get(r._tab);
  return ((_logical) => (_logical !== false && _logical != null ? td.id : _logical))(td);
} }, snapshotTree: () => { const out = [];
Array.from(gBrowser.tabs).forEach((t) => { const td = tree_of.get(t);
if (truthy(td)) {
  return out.push({id: td.id, parentId: td.parentId, name: td.name, collapsed: td.collapsed, pinned: truthy(t.pinned), url: ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____31 = t; if ((some_thread____31 == null)) {
  return null;
} else {
  const some_thread____32 = some_thread____31.linkedBrowser;
  if ((some_thread____32 == null)) {
    return null;
  } else {
    const some_thread____33 = some_thread____32.currentURI;
    return ((some_thread____33 == null) ? null : some_thread____33.spec);
  }
} })()), label: t.label});
} });
return out; }, vim: vim_api, rows: rows_api, layout: layout, scheduleSave: schedule_save, history: history, contentFocus: content_focus, contentInputFocused: () => content_focus.contentInputFocused(), contentFocusDiag: () => content_focus.diag(), Gjoa: gjoa_api});
  console.log("gjoa-tabs: gjoaTest debug API exposed");
}
if (truthy((() => { try {
    return Services.prefs.getBoolPref("gjoa.debug", false);
  } catch (__e____scope__36__7__2__2__3__2__2__3__22__6__12__1__2__1__0) {
    return false;
  } })())) {
  const pfx_ns = ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { (window.pfx = {});
return window.pfx; })()))(window.pfx);
  (pfx_ns.measure = (...els) => els.map((el, i) => { const r = (() => { const some_thread____34 = el; return ((some_thread____34 == null) ? null : some_thread____34.getBoundingClientRect()); })();
return (((r == null)) ? {i: i, tag: describe(el), error: "no rect"} : {i: i, tag: describe(el), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom)}); }));
  (pfx_ns.gaps = (...els) => els.slice(1).map((el, i) => { const a = (() => { const some_thread____35 = els[i]; return ((some_thread____35 == null) ? null : some_thread____35.getBoundingClientRect()); })();
const b = (() => { const some_thread____36 = el; return ((some_thread____36 == null) ? null : some_thread____36.getBoundingClientRect()); })();
if ((((a == null)) || ((b == null)))) {
  return {i: i, error: "no rect"};
} else {
  const a_bottom = a.bottom;
  const a_right = a.right;
  const b_top = b.top;
  const b_left = b.left;
  return {i: i, between: ("".concat(describe(els[i]), " -> ", describe(el))), gapY: Math.round((b_top - a_bottom)), gapX: Math.round((b_left - a_right)), sameY: (Math.round(a.top) === Math.round(b_top)), sameX: (Math.round(a.left) === Math.round(b_left))};
} }));
  console.log("gjoa-tabs: dev helpers (window.pfx) exposed (gjoa.debug=true)");
}
return console.log("gjoa-tabs: initialized"); }));
}

function safe_init_bang() {
  return init_bang().then((__) => { const u = window.gURLBar;
if (truthy(u)) {
  const blank_p = () => { const spec = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____45 = gBrowser; if ((some_thread____45 == null)) {
  return null;
} else {
  const some_thread____46 = some_thread____45.selectedBrowser;
  if ((some_thread____46 == null)) {
    return null;
  } else {
    const some_thread____47 = some_thread____46.currentURI;
    return ((some_thread____47 == null) ? null : some_thread____47.spec);
  }
} })());
return ((_logical) => (_logical !== false && _logical != null ? _logical : (((spec === "about:newtab")) || (((spec === "about:home")) || ((spec === "about:blank"))))))(spec.startsWith("chrome://gjoa-newtab")); };
  const focus_it_bang = () => { if (truthy(blank_p() && ((((_logical) => (_logical !== false && _logical != null ? _logical : ""))(u.value) === "")))) {
  return (() => { try {
    u.focus();
  return u.select();
  } catch (__e) {
    return null;
  } })();
} };
  const holder = {fn: null};
  const stop_bang = () => { if (truthy(holder.fn)) {
  window.removeEventListener("focusin", holder.fn, true);
  return (holder.fn = null);
} };
  (holder.fn = (e) => { if ((((() => { const some_thread____48 = e; if ((some_thread____48 == null)) {
  return null;
} else {
  const some_thread____49 = some_thread____48.target;
  return ((some_thread____49 == null) ? null : some_thread____49.tagName);
} })() === "browser"))) {
  focus_it_bang();
  return stop_bang();
} });
  window.addEventListener("focusin", holder.fn, true);
  window.setTimeout(stop_bang, 2500);
  window.setTimeout(focus_it_bang, 120);
  return window.setTimeout(() => console.log(("".concat("gjoa-urlbar-focus FINAL active=", (() => { const some_thread____50 = window; if ((some_thread____50 == null)) {
  return null;
} else {
  const some_thread____51 = some_thread____50.document;
  if ((some_thread____51 == null)) {
    return null;
  } else {
    const some_thread____52 = some_thread____51.activeElement;
    return ((some_thread____52 == null) ? null : some_thread____52.tagName);
  }
} })()))), 2200);
} }).catch((_pct1) => console.error("gjoa-tabs: init() threw — sidebar may be empty", _pct1));
}

function clone_node_fields(src) {
  return {id: src.id, parentId: src.parentId, url: src.url, name: src.name, state: src.state, collapsed: src.collapsed};
}

if (truthy(sidebar_main)) {
  if (truthy(gBrowserInit.delayedStartupFinished)) {
    safe_init_bang();
  } else {
    const obs = (subject, topic) => { if (truthy(((topic === "browser-delayed-startup-finished")) && (equiv(subject, window)))) {
  Services.obs.removeObserver(obs, topic);
  return safe_init_bang();
} };
    Services.obs.addObserver(obs, "browser-delayed-startup-finished");
  }
}
