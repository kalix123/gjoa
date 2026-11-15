import { INDENT } from './constants.js';
import { has_children_bang, is_horizontal, level_of_bang, level_of_row_bang, tree_data_bang, data_of_bang, all_rows } from './helpers.js';
import { create_logger_bang } from './log.js';
import { hz_display, moving_tabs, row_of, state } from './state.js';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

function reset_style_bang(el) {
  (el.style.gridColumn = "");
  (el.style.gridRow = "");
  (el.style.position = "");
  (el.style.left = "");
  (el.style.top = "");
  (el.style.width = "");
  return (el.style.zIndex = "");
}

export function make_rows_bang(deps) {
  const setupDrag = $$bc$get(deps, "setupDrag");
  const activateVim = $$bc$get(deps, "activateVim");
  const selectRange = $$bc$get(deps, "selectRange");
  const clearSelection = $$bc$get(deps, "clearSelection");
  const cloneAsSibling = $$bc$get(deps, "cloneAsSibling");
  const startRename = $$bc$get(deps, "startRename");
  const scheduleSave = $$bc$get(deps, "scheduleSave");
  const log = create_logger_bang("tabs/rows");
  const counters = {group: 0, resync_pending: false, grid_raf: 0};
  const sync_tab_row = (tab) => { const row = row_of.get(tab);
if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
  const td = tree_data_bang(tab);
  const show_tab = ((_logical) => (_logical !== false && _logical != null ? _logical : tab))(hz_display.get(row));
  const show_td = (($$bc$equiv(show_tab, tab)) ? td : tree_data_bang(show_tab));
  const img = show_tab.getAttribute("image");
  const icon_el = row.querySelector(".gjoa-tab-icon");
  if (((_truthy) => _truthy !== false && _truthy != null)(icon_el)) {
    icon_el.setAttribute("src", ((_logical) => (_logical !== false && _logical != null ? _logical : "chrome://global/skin/icons/defaultFavicon.svg"))(img));
  }
  const label_el = row.querySelector(".gjoa-tab-label");
  if (((_truthy) => _truthy !== false && _truthy != null)(label_el)) {
    (label_el.textContent = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : "New Tab"))(show_tab.label)))(show_td.name));
  }
  row.toggleAttribute("selected", tab.selected);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(moving_tabs.has(tab)))) {
    row.toggleAttribute("busy", tab.hasAttribute("busy"));
  }
  row.toggleAttribute("pinned", tab.pinned);
  row.toggleAttribute("gjoa-collapsed", ((_logical) => (_logical !== false && _logical != null ? has_children_bang(row) : _logical))((((_truthy) => _truthy !== false && _truthy != null)(td.collapsed) || ((_truthy) => _truthy !== false && _truthy != null)(td.layoutCollapsed))));
  return (row.style.paddingInlineStart = ("".concat(((level_of_bang(tab) * INDENT) + 8), "px")));
} };
  const sync_group_row = (row) => { const g = row._group;
if (((_truthy) => _truthy !== false && _truthy != null)(g)) {
  const label = row.querySelector(".gjoa-tab-label");
  const state_prefix = ((($$bc$equiv(g.state, "todo"))) ? "[ ] " : (($$bc$equiv(g.state, "wip"))) ? "[-] " : (($$bc$equiv(g.state, "done"))) ? "[x] " : "");
  if (((_truthy) => _truthy !== false && _truthy != null)(label)) {
    (label.textContent = ("".concat(state_prefix, g.name)));
  }
  row.toggleAttribute("gjoa-collapsed", ((_logical) => (_logical !== false && _logical != null ? has_children_bang(row) : _logical))((((_truthy) => _truthy !== false && _truthy != null)(g.collapsed) || ((_truthy) => _truthy !== false && _truthy != null)(g.layoutCollapsed))));
  return (row.style.paddingInlineStart = (() => { const level = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(g.level); return ("".concat(((level * INDENT) + 8), "px")); })());
} };
  const update_horizontal_grid = () => { if (is_horizontal()) {
  const raw_containers = [];
  if (((_truthy) => _truthy !== false && _truthy != null)(state.pinnedContainer)) {
    raw_containers.push(state.pinnedContainer);
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(state.panel)) {
    raw_containers.push(state.panel);
  }
  raw_containers.forEach((c) => { const rows_in_container = Array.from(c.querySelectorAll(".gjoa-tab-row, .gjoa-group-row"));
const gs = {col: 0, ric: 0, sc: 0};
rows_in_container.forEach((_pct1) => { const d = data_of_bang(_pct1);
if (((_truthy) => _truthy !== false && _truthy != null)(d)) {
  if (((_truthy) => _truthy !== false && _truthy != null)(_pct1.hidden)) {
    return _pct1.removeAttribute("gjoa-popout-child");
  } else {
    const col = gs.col;
    if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(level_of_row_bang(_pct1), 0)) || ($$bc$equiv(col, 0))))) {
      (gs.col = (col + 1));
      (gs.ric = 0);
    }
    const ric = gs.ric;
    (gs.ric = (ric + 1));
    (_pct1.style.gridColumn = String(gs.col));
    (_pct1.style.gridRow = String(gs.ric));
    _pct1.toggleAttribute("gjoa-popout-child", (gs.ric > 1));
    if (((_truthy) => _truthy !== false && _truthy != null)(_pct1.hasAttribute("selected"))) {
      return (gs.sc = gs.col);
    }
  }
} });
if ((gs.col > 0)) {
  const tracks = [];
  (() => { let i = 1; while (true) {
    if ((i <= gs.col)) { tracks.push((($$bc$equiv(i, gs.sc)) ? "minmax(200px, 200px)" : "minmax(0, 200px)")); const _recur_0 = (i + 1); i = _recur_0; continue; } else { return null; }
  } })();
  return (c.style.gridTemplateColumns = tracks.join(" "));
} else {
  return (c.style.gridTemplateColumns = "");
} });
  if ((counters["grid-raf"] > 0)) {
    cancelAnimationFrame(counters["grid-raf"]);
  }
  return (counters["grid-raf"] = requestAnimationFrame(() => { (counters["grid-raf"] = 0);
if (is_horizontal()) {
  raw_containers.forEach((_pct1) => { const first_row = _pct1.querySelector(".gjoa-tab-row:not([hidden]), .gjoa-group-row:not([hidden])");
if (((_truthy) => _truthy !== false && _truthy != null)(first_row)) {
  const row_height = first_row.offsetHeight;
  return (_pct1.style.maxHeight = ("".concat((row_height + 2), "px")));
} });
  const panel_popouts = (((_truthy) => _truthy !== false && _truthy != null)(state.panel) ? state.panel.querySelectorAll("[gjoa-popout-child]").length : 0);
  const pinned_popouts = (((_truthy) => _truthy !== false && _truthy != null)(state.pinnedContainer) ? state.pinnedContainer.querySelectorAll("[gjoa-popout-child]").length : 0);
  const total_popouts = (panel_popouts + pinned_popouts);
  const urlbar = document.getElementById("urlbar");
  if (((_truthy) => _truthy !== false && _truthy != null)(urlbar)) {
    if (((_truthy) => _truthy !== false && _truthy != null)(((total_popouts > 0) && urlbar.hasAttribute("popover")))) {
      urlbar.removeAttribute("popover");
    }
    log("hzGrid:urlbar", {totalPopouts: total_popouts});
  }
  return raw_containers.forEach((container) => { const all_in_c = container.querySelectorAll(".gjoa-tab-row, .gjoa-group-row");
all_in_c.forEach((_pct1) => { if (($$bc$equiv(_pct1.style.position, "fixed"))) {
  return reset_style_bang(_pct1);
} });
const popouts = Array.from(container.querySelectorAll("[gjoa-popout-child]"));
if (((_truthy) => _truthy !== false && _truthy != null)(popouts.length)) {
  container.offsetHeight;
  const rects = popouts.map((_pct1) => _pct1.getBoundingClientRect());
  return popouts.forEach((p, idx) => { const r = rects[idx];
if (((_truthy) => _truthy !== false && _truthy != null)(((r.width > 0) && (r.height > 0)))) {
  (p.style.position = "fixed");
  (p.style.left = ("".concat(r.left, "px")));
  (p.style.top = ("".concat(r.top, "px")));
  (p.style.width = ("".concat(r.width, "px")));
  return (p.style.zIndex = "9999");
} });
} });
} }));
} };
  const update_visibility = () => { const space_filter = deps.isTabInActiveSpace;
const group_filter = deps.isGroupInActiveSpace;
const hide_state = {below: -1};
all_rows().forEach((_pct1) => { const d = data_of_bang(_pct1);
if (((_truthy) => _truthy !== false && _truthy != null)(d)) {
  const lv = level_of_row_bang(_pct1);
  return ((((_truthy) => _truthy !== false && _truthy != null)(((hide_state.below >= 0) && (lv > hide_state.below)))) ? (_pct1.hidden = true) : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(space_filter(_pct1._tab))) : _logical))(_pct1._tab) : _logical))(space_filter))) ? (_pct1.hidden = true) : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(group_filter(_pct1._group))) : _logical))(_pct1._group) : _logical))(group_filter))) ? (() => { (_pct1.hidden = true);
return (hide_state.below = lv); })() : (() => { (_pct1.hidden = false);
return (hide_state.below = (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? has_children_bang(_pct1) : _logical))(((_logical) => (_logical !== false && _logical != null ? _logical : d.layoutCollapsed))(d.collapsed))) ? lv : -1)); })());
} });
return update_horizontal_grid(); };
  const clear_horizontal_grid = () => { if ((counters["grid-raf"] > 0)) {
  cancelAnimationFrame(counters["grid-raf"]);
  (counters["grid-raf"] = 0);
}
const both = [];
if (((_truthy) => _truthy !== false && _truthy != null)(state.pinnedContainer)) {
  both.push(state.pinnedContainer);
}
if (((_truthy) => _truthy !== false && _truthy != null)(state.panel)) {
  both.push(state.panel);
}
both.forEach((container) => { (container.style.maxHeight = "");
return (container.style.gridTemplateColumns = ""); });
return all_rows().forEach((row) => { reset_style_bang(row);
return row.removeAttribute("gjoa-popout-child"); }); };
  const toggle_collapse = (row) => { const d = data_of_bang(row);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? has_children_bang(row) : _logical))(d))) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : d.layoutCollapsed))(d.collapsed))) {
    (d.collapsed = false);
    (d.layoutCollapsed = false);
  } else {
    (d.collapsed = true);
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(row._tab)) {
    sync_tab_row(row._tab);
  } else {
    sync_group_row(row);
  }
  update_visibility();
  return scheduleSave();
} };
  const create_tab_row = (tab) => { const row = (() => { const __e____scope__4__1__4__1__47__3__1__2__1__0 = document.createXULElement("hbox"); (__e____scope__4__1__4__1__47__3__1__2__1__0.className = "gjoa-tab-row");
return __e____scope__4__1__4__1__47__3__1__2__1__0; })();
const icon = (() => { const __e____scope__4__1__4__1__47__3__1__5__1__0 = document.createXULElement("image"); (__e____scope__4__1__4__1__47__3__1__5__1__0.className = "gjoa-tab-icon");
return __e____scope__4__1__4__1__47__3__1__5__1__0; })();
const label = (() => { const __e____scope__4__1__4__1__47__3__1__8__1__0 = document.createElement("span"); (__e____scope__4__1__4__1__47__3__1__8__1__0.className = "gjoa-tab-label");
return __e____scope__4__1__4__1__47__3__1__8__1__0; })();
const close = (() => { const __e____scope__4__1__4__1__47__3__1__11__1__0 = document.createXULElement("image"); (__e____scope__4__1__4__1__47__3__1__11__1__0.className = "gjoa-tab-close");
return __e____scope__4__1__4__1__47__3__1__11__1__0; })();
const chevron = (() => { const __e____scope__4__1__4__1__47__3__1__14__1__0 = document.createXULElement("image"); (__e____scope__4__1__4__1__47__3__1__14__1__0.className = "gjoa-tab-chevron");
return __e____scope__4__1__4__1__47__3__1__14__1__0; })();
row.setAttribute("align", "center");
close.setAttribute("tooltiptext", "Close tab");
close.addEventListener("click", (_pct1) => { if (($$bc$equiv(_pct1.button, 0))) {
  _pct1.stopPropagation();
  return gBrowser.removeTab(tab);
} });
chevron.addEventListener("click", (_pct1) => { if (($$bc$equiv(_pct1.button, 0))) {
  _pct1.stopPropagation();
  return toggle_collapse(row);
} });
row.append(icon, label, close, chevron);
(row._tab = tab);
row_of.set(tab, row);
row.addEventListener("click", (_pct1) => { if (($$bc$equiv(_pct1.button, 0))) {
  if (((_truthy) => _truthy !== false && _truthy != null)(_pct1.shiftKey)) {
    return selectRange(row);
  } else {
    const target = ((_logical) => (_logical !== false && _logical != null ? _logical : tab))(hz_display.get(row));
    clearSelection();
    (gBrowser.selectedTab = target);
    return activateVim(((_logical) => (_logical !== false && _logical != null ? _logical : row))(row_of.get(target)));
  }
} else {
  if (($$bc$equiv(_pct1.button, 1))) {
    _pct1.preventDefault();
    return gBrowser.removeTab(tab);
  }
} });
row.addEventListener("dblclick", (_pct1) => { if (($$bc$equiv(_pct1.button, 0))) {
  _pct1.stopPropagation();
  return cloneAsSibling(tab);
} });
row.addEventListener("contextmenu", (e) => { e.preventDefault();
e.stopPropagation();
(state.contextTab = tab);
const menu = document.getElementById("gjoa-tab-menu");
if (((_truthy) => _truthy !== false && _truthy != null)(menu)) {
  return menu.openPopupAtScreen(e.screenX, e.screenY, true);
} });
setupDrag(row);
sync_tab_row(tab);
return row; };
  const create_group_row = (name, level) => { const lv = (($$bc$equiv(level, undefined)) ? 0 : level);
const group_seq = counters.group;
const __ = (counters.group = (group_seq + 1));
const group = {id: ("".concat("g", counters.group)), type: "group", name: ((_logical) => (_logical !== false && _logical != null ? _logical : "New Group"))(name), level: lv, state: null, collapsed: false, spaceId: (((_truthy) => _truthy !== false && _truthy != null)(deps.getActiveSpaceId) ? ((_logical) => (_logical !== false && _logical != null ? _logical : null))(deps.getActiveSpaceId()) : null)};
const row = (() => { const __e____scope__4__1__4__1__50__3__1__14__1__0 = document.createXULElement("hbox"); (__e____scope__4__1__4__1__50__3__1__14__1__0.className = "gjoa-group-row");
return __e____scope__4__1__4__1__50__3__1__14__1__0; })();
const marker = (() => { const __e____scope__4__1__4__1__50__3__1__17__1__0 = document.createElement("span"); (__e____scope__4__1__4__1__50__3__1__17__1__0.className = "gjoa-group-marker");
return __e____scope__4__1__4__1__50__3__1__17__1__0; })();
const label = (() => { const __e____scope__4__1__4__1__50__3__1__20__1__0 = document.createElement("span"); (__e____scope__4__1__4__1__50__3__1__20__1__0.className = "gjoa-tab-label");
return __e____scope__4__1__4__1__50__3__1__20__1__0; })();
const chevron = (() => { const __e____scope__4__1__4__1__50__3__1__23__1__0 = document.createXULElement("image"); (__e____scope__4__1__4__1__50__3__1__23__1__0.className = "gjoa-tab-chevron");
return __e____scope__4__1__4__1__50__3__1__23__1__0; })();
row.setAttribute("align", "center");
(row._group = group);
(marker.textContent = "●");
(label.textContent = group.name);
chevron.addEventListener("click", (_pct1) => { if (($$bc$equiv(_pct1.button, 0))) {
  _pct1.stopPropagation();
  return toggle_collapse(row);
} });
marker.addEventListener("click", (_pct1) => { if (($$bc$equiv(_pct1.button, 0))) {
  _pct1.stopPropagation();
  return toggle_collapse(row);
} });
row.append(marker, label, chevron);
row.addEventListener("click", (_pct1) => { if (($$bc$equiv(_pct1.button, 0))) {
  return activateVim(row);
} });
row.addEventListener("dblclick", (_pct1) => { if (($$bc$equiv(_pct1.button, 0))) {
  _pct1.stopPropagation();
  return startRename(row);
} });
row.addEventListener("contextmenu", (e) => { e.preventDefault();
e.stopPropagation();
(state.contextGroupRow = row);
const menu = document.getElementById("gjoa-group-menu");
if (((_truthy) => _truthy !== false && _truthy != null)(menu)) {
  return menu.openPopupAtScreen(e.screenX, e.screenY, true);
} });
setupDrag(row);
sync_group_row(row);
return row; };
  const schedule_tree_resync = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(counters["resync-pending"]))) {
  (counters["resync-pending"] = true);
  return Promise.resolve(undefined).then(() => { (counters["resync-pending"] = false);
Array.from(gBrowser.tabs).forEach((_pct1) => { if (((_truthy) => _truthy !== false && _truthy != null)(row_of.get(_pct1))) {
  return sync_tab_row(_pct1);
} });
return update_visibility(); });
} };
  const sync_any_row = (row) => { if (((_truthy) => _truthy !== false && _truthy != null)(row._tab)) {
  return sync_tab_row(row._tab);
} else {
  if (((_truthy) => _truthy !== false && _truthy != null)(row._group)) {
    return sync_group_row(row);
  }
} };
  return {createTabRow: create_tab_row, syncTabRow: sync_tab_row, createGroupRow: create_group_row, syncGroupRow: sync_group_row, syncAnyRow: sync_any_row, updateVisibility: update_visibility, updateHorizontalGrid: update_horizontal_grid, clearHorizontalGrid: clear_horizontal_grid, toggleCollapse: toggle_collapse, scheduleTreeResync: schedule_tree_resync};
}
