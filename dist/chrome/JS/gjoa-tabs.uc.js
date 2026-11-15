// ==UserScript==
// @name           Gjoa Tabs
// @description    Tree-style tab panel with vim keybindings
// @include        main
// ==/UserScript==

(function() {
"use strict";
var create_logger_bang, INDENT, CHORD_TIMEOUT, CLOSED_MEMORY, PIN_ATTR, SPACE_ATTR, state, tree_of, row_of, hz_display, saved_tab_queue, closed_tabs, selection, moving_tabs, xul, xul_label, xul_hbox, xul_vbox, xul_box, xul_image, xul_menu_popup, xul_menu_item, xul_menu_separator, profile_dir, profile_path, join_path, parent_path, read_text, write_text, exists_p, stat_file, ensure_dir, remove_file, on, notify, get_bool, set_bool, get_int, set_int, get_string, set_string, ensure_vertical_tabs_default, apply_menubar_default, observe, all_tabs, selected_tab, select_tab_bang, tab_container, pin_tab, unpin_tab, toggle_pinned, remove_tab, duplicate_tab, reload_tab, move_tab_to, open_tab_bang, tab_icon, ids, delayed_startup_finished, system_principal_bang, import_esm, same_node_p, SS, try_register_pin_attr_bang, pin_tab_id, read_pinned_id, tree_data_bang, tab_by_id, group_by_id, parent_of_tab_bang, level_of_bang, level_of_row_bang, data_of_bang, all_rows, has_children_bang, subtree_rows_bang, is_horizontal, tab_url, build_envelope_bang, make_saver_bang, pop_saved_by_url, pop_saved_by_index, pop_saved_for_tab, make_history_bang, is_in_active_space, DEFAULT_NAME, new_space_id, make_spaces_bang, reduce_event, switch_to_target, frame_lines, make_niri_binding_bang, DOMAIN_ORDER, make_scheduler_bang, make_window_tabs_bang, make_gjoa_window_bang, make_persisted, make_cross_window_tabs, make_gjoa_bang, collapse_flags, make_layout_bang, make_rows_bang, make_drag_bang, build_context_menu_bang, build_group_context_menu_bang, build_panel_context_menu_bang, make_events_bang, make_picker_bang, make_content_focus_bang, make_vim_bang, should_defer_reveal_p;

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



}

{

INDENT = 14;

CHORD_TIMEOUT = 500;

CLOSED_MEMORY = 32;

PIN_ATTR = "gjoa-id";

SPACE_ATTR = "gjoa-space-id";

}

{

state = {panel: null, spacer: null, pinnedContainer: null, spaceHeader: null, contextTab: null, contextGroupRow: null, cursor: null, nextTabId: 1, inSessionRestore: true, lastLoadedNodes: []};

tree_of = new WeakMap();

row_of = new WeakMap();

hz_display = new WeakMap();

saved_tab_queue = [];

closed_tabs = [];

selection = new Set();

moving_tabs = new Set();

}

{
const $$bc$equiv = $$bc.equivV;

xul = function(tag, attrs) {
  const el = document.createXULElement(tag);
  if (((_truthy) => _truthy !== false && _truthy != null)(attrs)) {
    Object.entries(attrs).forEach((entry) => { const name = entry[0];
const value = entry[1];
if (((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(value, false))) && ((!($$bc$equiv(value, null))) && (!($$bc$equiv(value, undefined))))))) {
  return el.setAttribute(name, String(value));
} });
  }
  return el;
}

xul_label = function(attrs) {
  return xul("label", attrs);
}

xul_hbox = function(attrs) {
  return xul("hbox", attrs);
}

xul_vbox = function(attrs) {
  return xul("vbox", attrs);
}

xul_box = function(attrs) {
  return xul("box", attrs);
}

xul_image = function(attrs) {
  return xul("image", attrs);
}

xul_menu_popup = function(attrs) {
  return xul("menupopup", attrs);
}

xul_menu_item = function(attrs) {
  return xul("menuitem", attrs);
}

xul_menu_separator = function(attrs) {
  return xul("menuseparator", attrs);
}

}

{

profile_dir = function() {
  return Services.dirsvc.get("ProfD", Ci.nsIFile).path;
}

profile_path = function(subpath) {
  return PathUtils.join(profile_dir(), subpath);
}

join_path = function(a, b) {
  return PathUtils.join(a, b);
}

parent_path = function(path) {
  return PathUtils.parent(path);
}

read_text = function(path) {
  return IOUtils.readUTF8(path);
}

write_text = function(path, data) {
  return IOUtils.writeUTF8(path, data);
}

exists_p = function(path) {
  return IOUtils.exists(path).catch((__e) => false);
}

stat_file = function(path) {
  return IOUtils.stat(path).then((s) => { const result = {size: s.size, lastModified: s.lastModified};
return result; }).catch((__e) => null);
}

ensure_dir = function(path) {
  return IOUtils.makeDirectory(path, {ignoreExisting: true, createAncestors: true});
}

remove_file = function(path) {
  return IOUtils.remove(path).catch((__e) => null);
}

}

{

on = function(topic, handler) {
  const observer = {observe: (subject, __topic, data) => (() => { try {
    return handler(subject, data);
  } catch (__e) {
    return console.error(("".concat("gjoa obs handler ", topic, ":")), __e);
  } })()};
  (() => { try {
    return Services.obs.addObserver(observer, topic);
  } catch (__e) {
    return null;
  } })();
  return () => (() => { try {
    return Services.obs.removeObserver(observer, topic);
  } catch (__e) {
    return null;
  } })();
}

notify = function(topic, subject, data) {
  return (() => { try {
    return Services.obs.notifyObservers(subject, topic, data);
  } catch (__e) {
    return console.error(("".concat("gjoa obs notify ", topic, ":")), __e);
  } })();
}

}

{

get_bool = function(name, default_value) {
  return (() => { try {
    return Services.prefs.getBoolPref(name, ((_logical) => (_logical !== false && _logical != null ? _logical : false))(default_value));
  } catch (__e____scope__3__1__4__2__1__0) {
    return ((_logical) => (_logical !== false && _logical != null ? _logical : false))(default_value);
  } })();
}

set_bool = function(name, value) {
  return (() => { try {
    return Services.prefs.setBoolPref(name, value);
  } catch (__e____scope__4__1__4__2__1__0) {
    return null;
  } })();
}

get_int = function(name, default_value) {
  return (() => { try {
    return Services.prefs.getIntPref(name, ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(default_value));
  } catch (__e____scope__5__1__4__2__1__0) {
    return ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(default_value);
  } })();
}

set_int = function(name, value) {
  return (() => { try {
    return Services.prefs.setIntPref(name, value);
  } catch (__e____scope__6__1__4__2__1__0) {
    return null;
  } })();
}

get_string = function(name, default_value) {
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

set_string = function(name, value) {
  return (() => { try {
    return Services.prefs.setStringPref(name, value);
  } catch (__e____scope__8__1__4__2__1__0) {
    return null;
  } })();
}

ensure_vertical_tabs_default = function() {
  const prefs = Services.prefs;
  return (() => { try {
    if ((!((_truthy) => _truthy !== false && _truthy != null)(prefs.prefHasUserValue("sidebar.verticalTabs")))) {
    return prefs.setBoolPref("sidebar.verticalTabs", true);
  }
  } catch (__e) {
    return null;
  } })();
}

apply_menubar_default = function(doc) {
  return (() => { try {
    const mb = doc.getElementById("toolbar-menubar");
  if (((_truthy) => _truthy !== false && _truthy != null)(mb)) {
    return mb.setAttribute("autohide", "false");
  }
  } catch (__e) {
    return null;
  } })();
}

observe = function(name, handler) {
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

}

{

all_tabs = function() {
  return gBrowser.tabs;
}

selected_tab = function() {
  return gBrowser.selectedTab;
}

select_tab_bang = function(tab) {
  return (gBrowser.selectedTab = tab);
}

tab_container = function() {
  return gBrowser.tabContainer;
}

pin_tab = function(tab) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(tab.pinned))) {
    return gBrowser.pinTab(tab);
  }
}

unpin_tab = function(tab) {
  if (((_truthy) => _truthy !== false && _truthy != null)(tab.pinned)) {
    return gBrowser.unpinTab(tab);
  }
}

toggle_pinned = function(tab) {
  return (((_truthy) => _truthy !== false && _truthy != null)(tab.pinned) ? unpin_tab(tab) : pin_tab(tab));
}

remove_tab = function(tab) {
  return gBrowser.removeTab(tab);
}

duplicate_tab = function(tab) {
  return gBrowser.duplicateTab(tab);
}

reload_tab = function(tab) {
  return gBrowser.reloadTab(tab);
}

move_tab_to = function(tab, index) {
  return gBrowser.moveTabTo(tab, index);
}

open_tab_bang = function(url) {
  const opts = {};
  (opts.triggeringPrincipal = Services.scriptSecurityManager.getSystemPrincipal());
  return gBrowser.addTab(url, opts);
}

tab_icon = function(tab) {
  return (() => { try {
    return gBrowser.getIcon(tab);
  } catch (__e) {
    return null;
  } })();
}

}

{
const $$bc$equiv = $$bc.equivV;

ids = {sidebar_main: () => document.getElementById("sidebar-container"), navigator_toolbox: () => document.getElementById("navigator-toolbox"), urlbar: () => document.getElementById("urlbar"), urlbar_container: () => document.getElementById("urlbar-container"), nav_bar: () => document.getElementById("nav-bar"), tabs_toolbar: () => document.getElementById("TabsToolbar"), tabs_toolbar_target: () => document.getElementById("TabsToolbar-customization-target"), tabbrowser_tabs: () => document.getElementById("tabbrowser-tabs"), main_popup_set: () => document.getElementById("mainPopupSet"), unified_extensions_button: () => document.getElementById("unified-extensions-button"), sidebar_button: () => document.getElementById("sidebar-button")};

delayed_startup_finished = function() {
  return gBrowserInit.delayedStartupFinished;
}

const state = {cached_principal: undefined};

system_principal_bang = function() {
  if (($$bc$equiv(state["cached-principal"], undefined))) {
    const p = Services.scriptSecurityManager.getSystemPrincipal();
    (state["cached-principal"] = p);
    return p;
  } else {
    return state["cached-principal"];
  }
}

import_esm = function(url) {
  return ChromeUtils.importESModule(url);
}

}

{
const $$bc$equiv = $$bc.equivV;

const log = create_logger_bang("tabs");

same_node_p = function(a, b) {
  return ((_truthy) => _truthy !== false && _truthy != null)(Object.is(a, b));
}

SS = (() => { const try_global = (() => { try {
    return ((!($$bc$equiv(typeof SessionStore, "undefined"))) ? SessionStore : null);
  } catch (__e) {
    return null;
  } })(); return ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { try {
    return ChromeUtils.importESModule("resource:///modules/sessionstore/SessionStore.sys.mjs").SessionStore;
  } catch (e) {
    console.error("gjoa-tabs: SessionStore unavailable", e);
    return null;
  } })()))(try_global); })();

const pin_reg = {done: false};

try_register_pin_attr_bang = function() {
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(pin_reg.done)) && ((_logical) => (_logical !== false && _logical != null ? SS.persistTabAttribute : _logical))(SS)))) {
    return (() => { try {
    SS.persistTabAttribute(PIN_ATTR);
  SS.persistTabAttribute(SPACE_ATTR);
  return (pin_reg.done = true);
  } catch (e) {
    return console.error("gjoa-tabs: persistTabAttribute failed", e);
  } })();
  }
}

pin_tab_id = function(tab, id) {
  return (() => { try {
    return tab.setAttribute(PIN_ATTR, String(id));
  } catch (__e) {
    return null;
  } })();
}

read_pinned_id = function(tab) {
  return (() => { try {
    const raw = ((_logical) => (_logical !== false && _logical != null ? tab.getAttribute(PIN_ATTR) : _logical))(tab.getAttribute);
  return ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(((_logical) => (_logical !== false && _logical != null ? Number(raw) : _logical))(raw));
  } catch (__e) {
    return 0;
  } })();
}

tree_data_bang = function(tab) {
  if (((_truthy) => _truthy !== false && _truthy != null)(tree_of.has(tab))) {
    return tree_of.get(tab);
  } else {
    const pinned_id = read_pinned_id(tab);
    const id = (((_truthy) => _truthy !== false && _truthy != null)(pinned_id) ? (() => { if ((pinned_id >= state.nextTabId)) {
  (state.nextTabId = (pinned_id + 1));
}
log("treeData:pinnedId", {id: pinned_id, label: tab.label, nextTabId: state.nextTabId});
return pinned_id; })() : (() => { const fresh = state.nextTabId; (state.nextTabId = (fresh + 1));
pin_tab_id(tab, fresh);
log("treeData:fresh", {id: fresh, label: tab.label, nextTabId: state.nextTabId});
return fresh; })());
    tree_of.set(tab, {id: id, parentId: null, name: null, state: null, collapsed: false});
    return tree_of.get(tab);
  }
}

tab_by_id = function(id) {
  return (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(id, null)) || (($$bc$equiv(id, undefined)) || ((!($$bc$equiv(typeof id, "number"))) || (!((_truthy) => _truthy !== false && _truthy != null)(id)))))) ? null : Array.from(gBrowser.tabs).find((_pct1) => { const td = tree_of.get(_pct1);
return ((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(td.id, id)) : _logical))(td); }));
}

group_by_id = function(id) {
  if (((_truthy) => _truthy !== false && _truthy != null)(id)) {
    return all_rows().find((_pct1) => { const g = _pct1._group;
return ((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(g.id, id)) : _logical))(g); });
  }
}

parent_of_tab_bang = function(tab) {
  return tab_by_id(tree_data_bang(tab).parentId);
}

level_of_bang = function(tab) {
  const seen = new Set();
  return (() => { let t = tab; let lv = 0; while (true) {
    if (((_truthy) => _truthy !== false && _truthy != null)(((t == null) || seen.has(t)))) { return lv; } else { seen.add(t); const pid = tree_data_bang(t).parentId; if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(pid, null)) || ($$bc$equiv(pid, undefined))))) { return lv; } else if (($$bc$equiv(typeof pid, "string"))) { return (() => { const group = group_by_id(pid); if (((() => { const some_thread____0 = group; return ((some_thread____0 == null) ? null : some_thread____0._group); })() == null)) {
  return lv;
} else {
  const group_level = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(group._group.level);
  return (lv + 1 + group_level);
} })(); } else { const p = tab_by_id(pid); if ((p == null)) { return lv; } else { const _recur_0 = p; const _recur_1 = (lv + 1); t = _recur_0; lv = _recur_1; continue; } } }
  } })();
}

level_of_row_bang = function(row) {
  return (((row == null)) ? 0 : (((_truthy) => _truthy !== false && _truthy != null)(row._group)) ? ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(row._group.level) : (((_truthy) => _truthy !== false && _truthy != null)(row._tab)) ? level_of_bang(row._tab) : 0);
}

data_of_bang = function(row) {
  return ((((_truthy) => _truthy !== false && _truthy != null)(row._group)) ? row._group : (((_truthy) => _truthy !== false && _truthy != null)(row._tab)) ? tree_data_bang(row._tab) : null);
}

all_tabs = function() {
  return Array.from(gBrowser.tabs);
}

all_rows = function() {
  const pinned = (((_truthy) => _truthy !== false && _truthy != null)(state.pinnedContainer) ? Array.from(state.pinnedContainer.querySelectorAll(".gjoa-tab-row")) : []);
  const tree_rows = (((_truthy) => _truthy !== false && _truthy != null)(state.panel) ? Array.from(state.panel.querySelectorAll(".gjoa-tab-row, .gjoa-group-row")) : []);
  return pinned.concat(tree_rows);
}

has_children_bang = function(row) {
  const next = row.nextElementSibling;
  return (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(next)) || ($$bc$equiv(next, state.spacer)))) ? false : (level_of_row_bang(next) > level_of_row_bang(row)));
}

subtree_rows_bang = function(row) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(row))) {
    return [];
  } else {
    const lv = level_of_row_bang(row);
    const out = [row];
    (() => { let cur = out[0]; while (true) {
    const nxt = cur.nextElementSibling; if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!($$bc$equiv(nxt, state.spacer))) && (level_of_row_bang(nxt) > lv)) : _logical))(nxt))) { out.push(nxt); const _recur_0 = nxt; cur = _recur_0; continue; } else { return null; }
  } })();
    return out;
  }
}

is_horizontal = function() {
  return ((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? state.panel.hasAttribute("gjoa-horizontal") : _logical))(state.panel));
}

tab_url = function(tab) {
  if ((tab == null)) {
    return "";
  } else {
    const spec = (() => { const some_thread____1 = tab; if ((some_thread____1 == null)) {
  return null;
} else {
  const some_thread____2 = some_thread____1.linkedBrowser;
  if ((some_thread____2 == null)) {
    return null;
  } else {
    const some_thread____3 = some_thread____2.currentURI;
    return ((some_thread____3 == null) ? null : some_thread____3.spec);
  }
} })();
    return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(spec, "about:blank"))) : _logical))(spec)) ? ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(spec) : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(spec)))((((_truthy) => _truthy !== false && _truthy != null)(SS) ? (() => { return (() => { try {
    const raw = SS.getTabState(tab);
  if (((_truthy) => _truthy !== false && _truthy != null)(raw)) {
    const ts = JSON.parse(raw);
    const entries = ts.entries;
    if (((_truthy) => _truthy !== false && _truthy != null)((Array.isArray(entries) && entries.length))) {
      const entry_count = entries.length;
      const ss_index = ((_logical) => (_logical !== false && _logical != null ? _logical : 1))(ts.index);
      const idx = Math.max(0, Math.min((entry_count - 1), (ss_index - 1)));
      return (() => { const some_thread____4 = entries; if ((some_thread____4 == null)) {
  return null;
} else {
  const some_thread____5 = some_thread____4[idx];
  return ((some_thread____5 == null) ? null : some_thread____5.url);
} })();
    }
  }
  } catch (e) {
    console.error("gjoa-tabs: getTabState failed", e);
    return null;
  } })(); })() : null)));
  }
}

}

{
const $$bc$equiv = $$bc.equivV;

build_envelope_bang = function(snapshot) {
  const tab_space_map = new Map();
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? snapshot.spaces.tabSpaces : _logical))(snapshot.spaces))) {
    snapshot.spaces.tabSpaces.forEach((_pct1) => tab_space_map.set(_pct1[0], _pct1[1]));
  }
  const tabEntries = snapshot.tabs.map((_pct1) => { const d = snapshot.treeData(_pct1);
const sp = tab_space_map.get(d.id);
return {id: d.id, parentId: d.parentId, url: snapshot.tabUrl(_pct1), name: d.name, state: d.state, collapsed: d.collapsed, spaceId: sp}; });
  const groupEntries = [];
  const lastSeen = {id: null};
  Array.from(snapshot.rows()).forEach((_pct1) => { if (((_truthy) => _truthy !== false && _truthy != null)(_pct1._tab)) {
  return (lastSeen.id = snapshot.treeData(_pct1._tab).id);
} else {
  if (((_truthy) => _truthy !== false && _truthy != null)(_pct1._group)) {
    return groupEntries.push({id: 0, parentId: null, type: "group", name: _pct1._group.name, level: _pct1._group.level, state: _pct1._group.state, collapsed: _pct1._group.collapsed, spaceId: _pct1._group.spaceId, afterTabId: lastSeen.id});
  }
} });
  const liveUrls = new Set(tabEntries.map((_pct1) => _pct1.url).filter(Boolean));
  const leftovers = snapshot.savedTabQueue.filter((_pct1) => ((!((_truthy) => _truthy !== false && _truthy != null)(_pct1.url)) || (!((_truthy) => _truthy !== false && _truthy != null)(liveUrls.has(_pct1.url))))).map((_pct1) => Object.assign({}, _pct1));
  const out = tabEntries.concat(groupEntries, leftovers);
  return {nodes: out, closedTabs: snapshot.closedTabs.slice((0 - CLOSED_MEMORY)), nextTabId: snapshot.nextTabId, spaces: snapshot.spaces};
}

function do_save_bang(flags, getSnapshot, history, onErr) {
  if (((_truthy) => _truthy !== false && _truthy != null)(flags.inFlight)) {
    return (flags.pending = true);
  } else {
    (flags.inFlight = true);
    return history.appendEvent(build_envelope_bang(getSnapshot())).catch((_pct1) => onErr(_pct1)).then(() => { (flags.inFlight = false);
if (((_truthy) => _truthy !== false && _truthy != null)(flags.pending)) {
  (flags.pending = false);
  return do_save_bang(flags, getSnapshot, history, onErr);
} });
  }
}

make_saver_bang = function(getSnapshot, history, onError) {
  const fallback = (_pct1) => console.error("gjoa-tabs: save chain", _pct1);
  const onErr = ((_logical) => (_logical !== false && _logical != null ? _logical : fallback))(onError);
  const flags = {inFlight: false, pending: false};
  return () => do_save_bang(flags, getSnapshot, history, onErr);
}

pop_saved_by_url = function(queue, url) {
  if (((_truthy) => _truthy !== false && _truthy != null)(url)) {
    const i = queue.findIndex((_pct1) => ($$bc$equiv(_pct1.url, url)));
    if ((i >= 0)) {
      return queue.splice(i, 1)[0];
    }
  }
}

pop_saved_by_index = function(queue, idx) {
  if ((idx >= 0)) {
    const i = queue.findIndex((_pct1) => ($$bc$equiv(_pct1._origIdx, idx)));
    if ((i >= 0)) {
      return queue.splice(i, 1)[0];
    }
  }
}

pop_saved_for_tab = function(queue, ctx) {
  const currentIdx = ctx.currentIdx;
  const pinnedId = ctx.pinnedId;
  const url = ctx.url;
  const inSessionRestore = ctx.inSessionRestore;
  const log = ctx.log;
  const try_url_fifo = () => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(url, "about:blank"))) : _logical))(url))) {
  const node = pop_saved_by_url(queue, url);
  if (((_truthy) => _truthy !== false && _truthy != null)(log)) {
    log("popSavedForTab:url", {idx: currentIdx, url: url, found: ((_truthy) => _truthy !== false && _truthy != null)(node)});
  }
  return node;
} else {
  if (inSessionRestore) {
    const node = (((_truthy) => _truthy !== false && _truthy != null)(queue.length) ? (() => { return queue.shift(); })() : null);
    if (((_truthy) => _truthy !== false && _truthy != null)(log)) {
      log("popSavedForTab:fifo", {idx: currentIdx, pfxId: pinnedId, url: url, nodeId: ((_logical) => (_logical !== false && _logical != null ? node.id : _logical))(node), nodeOrigIdx: ((_logical) => (_logical !== false && _logical != null ? node._origIdx : _logical))(node)});
    }
    return node;
  }
} };
  if (((_truthy) => _truthy !== false && _truthy != null)(pinnedId)) {
    const i = queue.findIndex((_pct1) => ($$bc$equiv(_pct1.id, pinnedId)));
    if ((i >= 0)) {
      if (((_truthy) => _truthy !== false && _truthy != null)(log)) {
        log("popSavedForTab:pfxId", {idx: currentIdx, pfxId: pinnedId, url: url});
      }
      return queue.splice(i, 1)[0];
    } else {
      return try_url_fifo();
    }
  } else {
    return try_url_fifo();
  }
}

}

{
const $$bc$equiv = $$bc.equivV;

const INSTANCE_ID_PREF = "gjoa.instance.id";

const fts_available = {v: false};

const SCHEMA = ["CREATE TABLE IF NOT EXISTS events (\n    id        INTEGER PRIMARY KEY,\n    timestamp INTEGER NOT NULL,\n    hash      TEXT    NOT NULL UNIQUE,\n    snapshot  TEXT    NOT NULL,\n    tag       TEXT,\n    instance_id TEXT NOT NULL\n  )", "CREATE INDEX IF NOT EXISTS events_timestamp ON events(timestamp DESC)", "CREATE INDEX IF NOT EXISTS events_tag ON events(tag) WHERE tag IS NOT NULL", "CREATE INDEX IF NOT EXISTS events_instance ON events(instance_id)", "CREATE TABLE IF NOT EXISTS events_search_content (\n    rowid    INTEGER PRIMARY KEY AUTOINCREMENT,\n    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,\n    url      TEXT NOT NULL,\n    label    TEXT NOT NULL\n  )", "CREATE INDEX IF NOT EXISTS esc_event ON events_search_content(event_id)", "CREATE INDEX IF NOT EXISTS esc_url ON events_search_content(url)", "CREATE INDEX IF NOT EXISTS esc_label ON events_search_content(label)"];

const log = create_logger_bang("history");

const state = {conn: null, lastHash: null, instanceId: null};

function load_instance_id_bang() {
  return ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const id_from_pref = (() => { try {
    return Services.prefs.getStringPref(INSTANCE_ID_PREF, "");
  } catch (__e____scope__8__4__2__1__2__2__1__0) {
    return (() => { try {
    return Services.prefs.getCharPref(INSTANCE_ID_PREF, "");
  } catch (__e2____scope__8__4__2__1__2__2__2__2__1__0) {
    return "";
  } })();
  } })(); if ((!($$bc$equiv(id_from_pref, "")))) {
  (state.instanceId = id_from_pref);
  return id_from_pref;
} else {
  const fresh = crypto.randomUUID();
  (() => { try {
    return Services.prefs.setStringPref(INSTANCE_ID_PREF, fresh);
  } catch (__e____scope__8__4__2__2__3__2__2__1__0) {
    return null;
  } })();
  log("instanceId:generated", {id: fresh});
  (state.instanceId = fresh);
  return fresh;
} })()))(state.instanceId);
}

function canonicalize(value) {
  return ((($$bc$equiv(typeof value, "undefined"))) ? "null" : (($$bc$equiv(value, null))) ? "null" : ((!($$bc$equiv(typeof value, "object")))) ? JSON.stringify(value) : (Array.isArray(value)) ? ("".concat("[", value.map((_pct1) => canonicalize(_pct1)).join(","), "]")) : (() => { const keys = Object.keys(value).sort().filter((_pct1) => (!($$bc$equiv(typeof value[_pct1], "undefined")))); return ("".concat("{", keys.map((_pct1) => ("".concat(JSON.stringify(_pct1), ":", canonicalize(value[_pct1])))).join(","), "}")); })());
}

function sha256_hex(text) {
  const data = new TextEncoder().encode(text);
  return crypto.subtle.digest("SHA-256", data).then((_pct1) => { const bytes = new Uint8Array(_pct1);
const hex_parts = [];
bytes.forEach((b) => hex_parts.push(b.toString(16).padStart(2, "0")));
return hex_parts.join(""); });
}

function execute_stmts(conn, stmts, idx) {
  if ((idx < stmts.length)) {
    return conn.execute(stmts[idx]).then(() => execute_stmts(conn, stmts, (idx + 1)));
  }
}

function try_create_fts_bang(conn) {
  return conn.execute("CREATE VIRTUAL TABLE IF NOT EXISTS events_fts USING fts5(url, label, content=events_search_content, content_rowid=rowid)").then(() => { (fts_available.v = true);
return conn.execute("INSERT INTO events_fts(events_fts) VALUES('rebuild')"); }).then(() => log("fts5", {status: "ready"})).catch((_pct1) => { (fts_available.v = false);
return log("fts5", {status: "unavailable", error: String(_pct1)}); });
}

function initialize_schema_bang(conn) {
  return conn.executeTransaction(() => execute_stmts(conn, SCHEMA, 0)).then(() => try_create_fts_bang(conn));
}

function prime_last_hash_bang(conn) {
  return conn.execute("SELECT hash FROM events ORDER BY id DESC LIMIT 1").then((_pct1) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _pct1.length : _logical))(_pct1))) {
  return (state.lastHash = _pct1[0].getResultByName("hash"));
} });
}

function open_connection_bang() {
  if (((_truthy) => _truthy !== false && _truthy != null)(state.conn)) {
    return Promise.resolve(state.conn);
  } else {
    const sqlite_mod = ChromeUtils.importESModule("resource://gre/modules/Sqlite.sys.mjs");
    const sqlite = sqlite_mod.Sqlite;
    const prof_dir = Services.dirsvc.get("ProfD", Ci.nsIFile).path;
    const path = PathUtils.join(prof_dir, "gjoa-history.sqlite");
    return sqlite.openConnection({path: path}).then((_pct1) => { log("openConnection", {path: path});
return _pct1; }).then((_pct1) => _pct1.execute("PRAGMA journal_mode = WAL").then(() => _pct1.execute("PRAGMA foreign_keys = ON")).then(() => initialize_schema_bang(_pct1)).then(() => { (state.conn = _pct1);
return prime_last_hash_bang(_pct1); }).then(() => _pct1));
  }
}

function date_label(d) {
  const dt = ((_logical) => (_logical !== false && _logical != null ? _logical : new Date()))(d);
  const day_short = dt.toLocaleDateString("en-US", {weekday: "short"});
  const yyyy = dt.getFullYear();
  const month = dt.getMonth();
  const mm = String((month + 1)).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  return ("".concat("Session - ", day_short, " ", yyyy, "/", mm, "/", dd, " ", hh, ":", min));
}

function decode_row(row) {
  return {id: row.getResultByName("id"), timestamp: row.getResultByName("timestamp"), hash: row.getResultByName("hash"), snapshot: JSON.parse(row.getResultByName("snapshot")), tag: row.getResultByName("tag"), instanceId: row.getResultByName("instance_id")};
}

function extract_searchable_rows(snapshot) {
  const out = [];
  snapshot.nodes.forEach((_pct1) => { const url = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(_pct1.url);
const label = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(_pct1.name);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : label))(url))) {
  return out.push({url: url, label: label});
} });
  return out;
}

function insert_search_rows(conn, event_id, rows, idx) {
  if ((idx < rows.length)) {
    const row = rows[idx];
    return conn.execute("INSERT INTO events_search_content(event_id, url, label) VALUES (?, ?, ?)", [event_id, row.url, row.label]).then(() => { if (((_truthy) => _truthy !== false && _truthy != null)(fts_available.v)) {
  return conn.execute("INSERT INTO events_fts(rowid, url, label) VALUES (last_insert_rowid(), ?, ?)", [row.url, row.label]);
} }).catch((_pct1) => log("insert-search-rows:fts-sync", {error: String(_pct1)})).then(() => insert_search_rows(conn, event_id, rows, (idx + 1)));
  }
}

function build_search_query(tokens) {
  const escape_like = (s) => s.replace(new RegExp("([%_\\\\])", "g"), "\\$1");
  const conditions = [];
  const params = [];
  tokens.forEach((_pct1) => { const pat = ("".concat("%", escape_like(_pct1), "%"));
conditions.push("(esc.url LIKE ? ESCAPE '\\' OR esc.label LIKE ? ESCAPE '\\')");
params.push(pat);
return params.push(pat); });
  return {conditions: conditions, params: params};
}

function with_conn_bang(f) {
  return open_connection_bang().then(f);
}

const EVENTS_COLS = "SELECT id, timestamp, hash, snapshot, tag, instance_id FROM events";

function query_rows_bang(sql, params) {
  return with_conn_bang((_pct1) => _pct1.execute(sql, params)).then((_pct1) => _pct1.map(decode_row));
}

function query_one_bang(sql, params) {
  return with_conn_bang((_pct1) => _pct1.execute(sql, params)).then((_pct1) => { if (((_truthy) => _truthy !== false && _truthy != null)(_pct1.length)) {
  return decode_row(_pct1[0]);
} });
}

function read_changes(rows) {
  return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? rows[0] : _logical))(rows.length) : _logical))(rows)) ? ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(rows[0].getResultByName("c")) : 0);
}

make_history_bang = function() {
  return {appendEvent: (snapshot) => with_conn_bang((_pct1) => { const canon = canonicalize(snapshot);
return sha256_hex(canon).then((hash) => { if ((!($$bc$equiv(hash, state.lastHash)))) {
  const ts = Date.now();
  const inst_id = load_instance_id_bang();
  const result = {insertedId: null};
  return _pct1.executeTransaction(() => _pct1.execute("INSERT OR IGNORE INTO events(timestamp, hash, snapshot, tag, instance_id) VALUES (?, ?, ?, NULL, ?)", [ts, hash, canon, inst_id]).then(() => _pct1.execute("SELECT id FROM events WHERE hash = ?", [hash])).then((id_rows) => { if (((_truthy) => _truthy !== false && _truthy != null)(id_rows.length)) {
  (result.insertedId = id_rows[0].getResultByName("id"));
  return insert_search_rows(_pct1, result.insertedId, extract_searchable_rows(snapshot), 0);
} })).then(() => { if ((!($$bc$equiv(result.insertedId, null)))) {
  (state.lastHash = hash);
  log("appendEvent", {id: result.insertedId, ts: ts, hashHead: hash.slice(0, 12)});
}
return result.insertedId; });
} }); }), tagLatest: (kind, label) => with_conn_bang((_pct1) => { const final_label = ((_logical) => (_logical !== false && _logical != null ? _logical : (($$bc$equiv(kind, "session")) ? date_label(null) : "Untitled")))(label);
const tag_value = ("".concat(kind, ":", final_label));
return _pct1.execute("UPDATE events SET tag = ? WHERE id = (SELECT MAX(id) FROM events)", [tag_value]).then(() => _pct1.execute("SELECT id FROM events ORDER BY id DESC LIMIT 1")).then((id_rows) => { const id = ((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? id_rows[0].getResultByName("id") : _logical))(id_rows[0]) : _logical))(id_rows.length) : _logical))(id_rows);
log("tagLatest", {id: id, tagValue: tag_value});
return id; }); }), getTagged: (limit) => query_rows_bang(("".concat(EVENTS_COLS, " WHERE tag IS NOT NULL ORDER BY timestamp DESC LIMIT ?")), [((_logical) => (_logical !== false && _logical != null ? _logical : 50))(limit)]), getById: (id) => query_one_bang(("".concat(EVENTS_COLS, " WHERE id = ?")), [id]), getRecent: (limit) => query_rows_bang(("".concat(EVENTS_COLS, " ORDER BY timestamp DESC LIMIT ?")), [((_logical) => (_logical !== false && _logical != null ? _logical : 50))(limit)]), search: (query, opts) => { const tagged_only = ((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? opts.taggedOnly : _logical))(opts));
const lim = ((_logical) => (_logical !== false && _logical != null ? _logical : 50))(((_logical) => (_logical !== false && _logical != null ? opts.limit : _logical))(opts));
const trimmed = query.trim();
if (($$bc$equiv(trimmed, ""))) {
  return Promise.resolve([]);
} else {
  if (((_truthy) => _truthy !== false && _truthy != null)(fts_available.v)) {
    const match_expr = trimmed.split(new RegExp("\\s+")).filter(Boolean).map((_pct1) => ("".concat("\"", _pct1.replace(new RegExp("\"", "g"), "\"\""), "\"", " *"))).join(" ");
    const tagged_clause = (tagged_only ? " AND e.tag IS NOT NULL" : "");
    const sql = ("".concat("SELECT e.id, e.timestamp, e.hash, e.snapshot, e.tag, e.instance_id", " FROM events e", " WHERE e.id IN (", "   SELECT DISTINCT esc.event_id FROM events_search_content esc", "   WHERE esc.rowid IN (SELECT rowid FROM events_fts WHERE events_fts MATCH ?)", " )", tagged_clause, " ORDER BY e.timestamp DESC", " LIMIT ?"));
    return query_rows_bang(sql, [match_expr, lim]);
  } else {
    const tokens = trimmed.split(new RegExp("\\s+")).filter(Boolean);
    const qr = build_search_query(tokens);
    const where_clause = qr.conditions.join(" AND ");
    const tagged_clause = (tagged_only ? " AND events.tag IS NOT NULL" : "");
    const sql = ("".concat("SELECT events.id, events.timestamp, events.hash, events.snapshot, events.tag, events.instance_id", " FROM events", " JOIN events_search_content esc ON esc.event_id = events.id", " WHERE ", where_clause, tagged_clause, " GROUP BY events.id", " ORDER BY events.timestamp DESC", " LIMIT ?"));
    const params = qr.params;
    params.push(lim);
    return query_rows_bang(sql, params);
  }
} }, runRetention: (opts) => with_conn_bang((_pct1) => { const days = ((_logical) => (_logical !== false && _logical != null ? _logical : Services.prefs.getIntPref("gjoa.history.retainDays", 30)))(((_logical) => (_logical !== false && _logical != null ? opts.retainDays : _logical))(opts));
const max_rows = ((_logical) => (_logical !== false && _logical != null ? _logical : Services.prefs.getIntPref("gjoa.history.maxRows", 10000)))(((_logical) => (_logical !== false && _logical != null ? opts.maxRows : _logical))(opts));
const cutoff = (Date.now() - (days * 24 * 60 * 60 * 1000));
const result = {deleted: 0};
return _pct1.executeTransaction(() => _pct1.execute("DELETE FROM events WHERE tag IS NULL AND timestamp < ?", [cutoff]).then(() => _pct1.execute("SELECT changes() AS c")).then((r) => { const deleted = result.deleted;
return (result.deleted = (deleted + read_changes(r))); }).then(() => _pct1.execute("DELETE FROM events WHERE tag IS NULL AND id IN (SELECT id FROM events WHERE tag IS NULL ORDER BY timestamp ASC LIMIT MAX(0, (SELECT COUNT(*) FROM events WHERE tag IS NULL) - ?))", [max_rows])).then(() => _pct1.execute("SELECT changes() AS c")).then((r) => { const deleted = result.deleted;
return (result.deleted = (deleted + read_changes(r))); })).then(() => { if (((_truthy) => _truthy !== false && _truthy != null)(result.deleted)) {
  log("runRetention", {deleted: result.deleted, retainDays: days, maxRows: max_rows});
}
return result.deleted; }); }), lastHash: () => state.lastHash, instanceId: () => load_instance_id_bang(), close: () => (((_truthy) => _truthy !== false && _truthy != null)(state.conn) ? state.conn.close().catch((__e) => null).then(() => { (state.conn = null);
return (state.lastHash = null); }) : Promise.resolve(null))};
}

}

{



}

{
const $$bc$equiv = $$bc.equivV;

is_in_active_space = function(tab, tab_space, spaces, default_id, active_id) {
  const id = tab_space.get(tab);
  const effective = (((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(id, undefined))) && spaces.has(id))) ? id : default_id);
  return (effective === active_id);
}

}

{
const $$bc$equiv = $$bc.equivV;

DEFAULT_NAME = "Main";

new_space_id = function() {
  return crypto.randomUUID();
}

make_spaces_bang = function(deps) {
  const on_change = deps.onChange;
  const on_activated = deps.onActivated;
  const tab_by_id = deps.tabById;
  const spaces = new Map();
  const tab_space = new WeakMap();
  const state = {active_id: null, applying: false};
  const default_space = {id: new_space_id(), name: DEFAULT_NAME, createdAt: Date.now()};
  spaces.set(default_space.id, default_space);
  (state["active-id"] = default_space.id);
  const list_in_order = () => Array.from(spaces.values());
  const default_id = () => list_in_order()[0].id;
  return {list: list_in_order, activeId: () => state["active-id"], get: (_pct1) => spaces.get(_pct1), active: () => spaces.get(state["active-id"]), spaceOf: (tab) => { const cached = tab_space.get(tab);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? spaces.has(cached) : _logical))(cached))) {
  return cached;
} else {
  const persisted = (() => { try {
    return tab.getAttribute(SPACE_ATTR);
  } catch (__e) {
    return null;
  } })();
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? spaces.has(persisted) : _logical))(persisted))) {
    tab_space.set(tab, persisted);
    return persisted;
  } else {
    return default_id();
  }
} }, create: (name, icon) => { const s = {id: new_space_id(), name: ((_logical) => (_logical !== false && _logical != null ? _logical : "Untitled"))(name), createdAt: Date.now()};
if (((_truthy) => _truthy !== false && _truthy != null)(icon)) {
  (s.icon = icon);
}
spaces.set(s.id, s);
on_change();
return s; }, rename: (id, name) => { const s = spaces.get(id);
if (((_truthy) => _truthy !== false && _truthy != null)(s)) {
  if ((!($$bc$equiv(s.name, name)))) {
    (s.name = name);
    spaces.set(id, s);
    return on_change();
  }
} }, setIcon: (id, icon) => { const s = spaces.get(id);
if (((_truthy) => _truthy !== false && _truthy != null)(s)) {
  if (((_truthy) => _truthy !== false && _truthy != null)(icon)) {
    (s.icon = icon);
  } else {
    delete$(s.icon);
  }
  spaces.set(id, s);
  return on_change();
} }, delete: (id) => { const def = default_id();
if (((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(id, def))) && spaces.has(id)))) {
  spaces.delete(id);
  const reactivated = ($$bc$equiv(state["active-id"], id));
  if (reactivated) {
    (state["active-id"] = def);
  }
  on_change();
  if (((_truthy) => _truthy !== false && _truthy != null)((reactivated && on_activated))) {
    return on_activated(id, def);
  }
} }, setActive: (id) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(state["active-id"], id))) : _logical))(spaces.has(id)))) {
  const prev = state["active-id"];
  (state["active-id"] = id);
  on_change();
  if (((_truthy) => _truthy !== false && _truthy != null)(on_activated)) {
    return on_activated(prev, id);
  }
} }, assignTab: (tab, id) => { if (((_truthy) => _truthy !== false && _truthy != null)(spaces.has(id))) {
  const prev = tab_space.get(tab);
  if ((!($$bc$equiv(prev, id)))) {
    tab_space.set(tab, id);
    (() => { try {
    return tab.setAttribute(SPACE_ATTR, id);
  } catch (__e) {
    return null;
  } })();
    return on_change();
  }
} }, isVisible: (_pct1) => is_in_active_space(_pct1, tab_space, spaces, default_id(), state["active-id"]), isSpaceActive: (_pct1) => { const effective = (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? spaces.has(_pct1) : _logical))(_pct1)) ? _pct1 : default_id());
return ($$bc$equiv(effective, state["active-id"])); }, hydrate: (snapshot, tabById) => { spaces.clear();
snapshot.spaces.forEach((_pct1) => spaces.set(_pct1.id, _pct1));
if (($$bc$equiv(spaces.size, 0))) {
  spaces.set(default_space.id, default_space);
  (state["active-id"] = default_space.id);
} else {
  (state["active-id"] = (((_truthy) => _truthy !== false && _truthy != null)(spaces.has(snapshot.activeId)) ? snapshot.activeId : default_id()));
}
snapshot.tabSpaces.forEach((entry) => { const tab_id = entry[0];
const space_id = entry[1];
if (((_truthy) => _truthy !== false && _truthy != null)(spaces.has(space_id))) {
  const tab = tabById(tab_id);
  if (((_truthy) => _truthy !== false && _truthy != null)(tab)) {
    return tab_space.set(tab, space_id);
  }
} });
return on_change(); }, isApplying: () => state.applying, applyRemoteSpaces: (snapshot) => { (state.applying = true);
(() => { try {
    spaces.clear();
  snapshot.spaces.forEach((_pct1) => spaces.set(_pct1.id, _pct1));
  if (($$bc$equiv(spaces.size, 0))) {
    spaces.set(default_space.id, default_space);
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(spaces.has(state["active-id"])))) {
    (state["active-id"] = default_id());
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(tab_by_id)) {
    snapshot.tabSpaces.forEach((entry) => { const tab_id = entry[0];
const space_id = entry[1];
if (((_truthy) => _truthy !== false && _truthy != null)(spaces.has(space_id))) {
  const tab = tab_by_id(tab_id);
  if (((_truthy) => _truthy !== false && _truthy != null)(tab)) {
    return tab_space.set(tab, space_id);
  }
} });
  }
  return on_change();
  } catch (e) {
    return console.error("[Gjoa.spaces.applyRemoteSpaces] failed", e);
  } })();
return (state.applying = false); }};
}

}

{
const $$bc$equiv = $$bc.equivV;

function get_subprocess() {
  return ChromeUtils.importESModule("resource://gre/modules/Subprocess.sys.mjs").Subprocess;
}

reduce_event = function(cache, ev) {
  return ((((_truthy) => _truthy !== false && _truthy != null)(ev.WorkspacesChanged)) ? (() => { const next = new Map(); const arr = ev.WorkspacesChanged.workspaces; arr.forEach((_pct1) => next.set(_pct1.id, _pct1));
return {cache: next, switch: null}; })() : (((_truthy) => _truthy !== false && _truthy != null)(ev.WorkspaceActivated)) ? (() => { const a = ev.WorkspaceActivated; if ((!((_truthy) => _truthy !== false && _truthy != null)(a.focused))) {
  return {cache: cache, switch: null};
} else {
  const ws = cache.get(a.id);
  return (((_truthy) => _truthy !== false && _truthy != null)(ws) ? {cache: cache, switch: {name: ws.name, idx: ws.idx}} : {cache: cache, switch: null});
} })() : {cache: cache, switch: null});
}

switch_to_target = function(spaces, target) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? target : _logical))(spaces)))) {
    return {action: "none", reason: "no-spaces-or-target"};
  } else {
    const name = target.name;
    const idx = target.idx;
    return ((((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (name.length > 0) : _logical))(name))) ? (() => { const match = spaces.list().find((_pct1) => ($$bc$equiv(_pct1.name.toLowerCase(), name.toLowerCase()))); if (((_truthy) => _truthy !== false && _truthy != null)(match)) {
  spaces.setActive(match.id);
  return {action: "activate", id: match.id, by: "name"};
} else {
  const created = spaces.create(name);
  spaces.setActive(created.id);
  return {action: "create", id: created.id, name: name};
} })() : (((_truthy) => _truthy !== false && _truthy != null)(((typeof idx === 'number') && ((_logical) => (_logical !== false && _logical != null ? (idx > 0) : _logical))(Number.isInteger(idx))))) ? (() => { const pos = Math.trunc(idx); const lst = spaces.list(); const at = lst[(pos - 1)]; if (((_truthy) => _truthy !== false && _truthy != null)(at)) {
  spaces.setActive(at.id);
  return {action: "activate", id: at.id, by: "idx"};
} else {
  return {action: "none", reason: "no-space-at-idx", idx: idx};
} })() : {action: "none", reason: "no-name-or-idx"});
  }
}

const st = (() => { const cache = new Map(); return {proc: null, alive: false, debounce_id: null, cache: cache, pending: null, backoff: 500}; })();

function apply_switch_bang(target) {
  const delay = (() => { try {
    return Services.prefs.getIntPref("gjoa.niri.debounceMs", 120);
  } catch (__e____scope__7__4__1__2__2__1__0) {
    return 120;
  } })();
  (st.pending = target);
  if (((_truthy) => _truthy !== false && _truthy != null)(st["debounce-id"])) {
    clearTimeout(st["debounce-id"]);
  }
  return (st["debounce-id"] = setTimeout(() => { (st["debounce-id"] = null);
const tgt = st.pending;
const spaces = window.Spaces;
(st.pending = null);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? spaces : _logical))(tgt))) {
  (st.__niriDriving = true);
  return (() => { try {
    const res = switch_to_target(spaces, tgt);
  return console.log("gjoa-niri: workspace", ("".concat("name=", tgt.name, " idx=", tgt.idx)), "->", res.action, ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(res.reason)))(res.by));
  } catch (e) {
    return console.error("gjoa-niri: switch failed", e);
  } finally {
    (st.__niriDriving = false);
  } })();
} }, delay));
}

function handle_line_bang(line) {
  const ev = (() => { try {
    return JSON.parse(line);
  } catch (__e) {
    return null;
  } })();
  if (((_truthy) => _truthy !== false && _truthy != null)(ev)) {
    if (((_truthy) => _truthy !== false && _truthy != null)(ev.WorkspacesChanged)) {
      console.log("gjoa-niri: workspaces changed,", ev.WorkspacesChanged.workspaces.length, "workspaces");
    }
    const r = reduce_event(st.cache, ev);
    (st.cache = r.cache);
    if (((_truthy) => _truthy !== false && _truthy != null)(r.switch)) {
      return apply_switch_bang(r.switch);
    }
  }
}

frame_lines = function(buf, chunk) {
  const lines = [];
  return (() => { let rest = ("".concat(buf, chunk)); while (true) {
    const nl = rest.indexOf("\n"); if ((nl < 0)) { return {lines: lines, rest: rest}; } else { const line = rest.slice(0, nl); ((line.length > 0) ? (() => { return lines.push(line); })() : null); const _recur_0 = rest.slice((nl + 1)); rest = _recur_0; continue; }
  } })();
}

function pump_step_bang(proc, buf) {
  return proc.stdout.readString().then((chunk) => { if (($$bc$equiv(chunk, ""))) {
  return null;
} else {
  const framed = frame_lines(buf.s, chunk);
  (buf.s = framed.rest);
  framed.lines.forEach((_pct1) => handle_line_bang(_pct1));
  return pump_step_bang(proc, buf);
} });
}

function pump_bang(proc) {
  return pump_step_bang(proc, {s: ""});
}

function schedule_respawn_bang() {
  const b = st.backoff;
  (st.backoff = Math.min((b * 2), 30000));
  return setTimeout(() => { if (((_truthy) => _truthy !== false && _truthy != null)(st.alive)) {
  return spawn_bang();
} }, b);
}

function spawn_bang() {
  const sp = get_subprocess();
  return sp.pathSearch("niri").then((niri) => sp.call({command: niri, arguments: ["msg", "event-stream"], stderr: "stdout"}).then((proc) => { (st.proc = proc);
(st.alive = true);
(st.backoff = 500);
console.log("gjoa-niri: event-stream attached");
return pump_bang(proc).then((__) => { (st.proc = null);
if (((_truthy) => _truthy !== false && _truthy != null)(st.alive)) {
  return schedule_respawn_bang();
} }); })).catch((e) => { console.error("gjoa-niri: spawn failed (niri on PATH?)", e);
if (((_truthy) => _truthy !== false && _truthy != null)(st.alive)) {
  return schedule_respawn_bang();
} });
}

function teardown_bang() {
  (st.alive = false);
  if (((_truthy) => _truthy !== false && _truthy != null)(st["debounce-id"])) {
    clearTimeout(st["debounce-id"]);
  }
  const p = st.proc;
  if (((_truthy) => _truthy !== false && _truthy != null)(p)) {
    (() => { try {
    return p.kill();
  } catch (__e) {
    return null;
  } })();
  }
  return (st.proc = null);
}

make_niri_binding_bang = function() {
  const enabled = (() => { try {
    return Services.prefs.getBoolPref("gjoa.niri.enabled", true);
  } catch (__e____scope__15__1__4__1__2__2__1__0) {
    return true;
  } })();
  const sock = (() => { try {
    return Services.env.get("NIRI_SOCKET");
  } catch (__e) {
    return "";
  } })();
  return (((!enabled)) ? console.log("gjoa-niri: disabled via pref") : (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(sock)) || ($$bc$equiv(sock, ""))))) ? console.log("gjoa-niri: NIRI_SOCKET unset — not a niri session, skipping") : (() => { (st.alive = true);
spawn_bang();
const __el____scope__15__1__4__2__6__3__1__0 = window;
const __ev____scope__15__1__4__2__6__3__1__3 = "unload";
const __h____scope__15__1__4__2__6__3__1__6 = teardown_bang;
__el____scope__15__1__4__2__6__3__1__0.addEventListener(__ev____scope__15__1__4__2__6__3__1__3, __h____scope__15__1__4__2__6__3__1__6, {once: true});
if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(__ev____scope__15__1__4__2__6__3__1__3, "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__15__1__4__2__6__3__1__0.__gjoaHR.teardowns : _logical))(__el____scope__15__1__4__2__6__3__1__0.__gjoaHR)))) {
  __el____scope__15__1__4__2__6__3__1__0.__gjoaHR.teardowns.push(__h____scope__15__1__4__2__6__3__1__6);
}
__h____scope__15__1__4__2__6__3__1__6;
return console.log("gjoa-niri: started"); })());
}

}

{
const $$bc$equiv = $$bc.equivV;

DOMAIN_ORDER = ["prefs", "windows", "tabs", "snapshots", "sidebar", "command"];

make_scheduler_bang = function() {
  const log = create_logger_bang("scheduler");
  const reconcilers = new Map();
  const pending = new Map();
  const state = {pendingFlush: null, pendingResolve: null, lastReconcileMs: null, destroyed: false};
  return (() => { function get_dirty(domain) { return ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const fresh = []; pending.set(domain, fresh);
return fresh; })()))(pending.get(domain)); } function run_once() { if ((!((_truthy) => _truthy !== false && _truthy != null)(state.destroyed))) {
  const started_at = performance.now();
  const snapshot = (() => { const snap = new Map(); pending.forEach((reasons, domain) => snap.set(domain, reasons));
return snap; })();
  pending.clear();
  DOMAIN_ORDER.forEach((domain) => { const reasons = snapshot.get(domain);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(reasons.length, 0))) : _logical))(reasons))) {
  const handlers = ((_logical) => (_logical !== false && _logical != null ? _logical : []))(reconcilers.get(domain));
  return handlers.forEach((_pct1) => (() => { try {
    return _pct1.run(reasons);
  } catch (e) {
    return log("reconciler:error", {domain: domain, reasons: reasons, msg: String(e)});
  } })());
} });
  (state.lastReconcileMs = (performance.now() - started_at));
  return log("reconcile:done", {ms: state.lastReconcileMs});
} } function schedule() { if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : state.destroyed))(state.pendingFlush)))) {
  return (state.pendingFlush = new Promise((resolve) => { (state.pendingResolve = resolve);
return queueMicrotask(() => (() => { try {
    return run_once();
  }  finally {
    const co = {v: false};
    pending.forEach((_pct1) => { if ((_pct1.length > 0)) {
  return (co.v = true);
} });
    (state.pendingFlush = null);
    const local_resolve = state.pendingResolve;
    (state.pendingResolve = null);
    if (((_truthy) => _truthy !== false && _truthy != null)(co.v)) {
      schedule();
    }
    if (((_truthy) => _truthy !== false && _truthy != null)(local_resolve)) {
      local_resolve();
    }
  } })()); }));
} } function register(reconciler) { const list = ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const fresh = []; reconcilers.set(reconciler.domain, fresh);
return fresh; })()))(reconcilers.get(reconciler.domain));
list.push(reconciler);
log("register", {domain: reconciler.domain});
return () => { const arr = reconcilers.get(reconciler.domain);
if (((_truthy) => _truthy !== false && _truthy != null)(arr)) {
  const i = arr.indexOf(reconciler);
  if ((i >= 0)) {
    return arr.splice(i, 1);
  }
} }; } function mark_dirty(domain, reason) { if ((!((_truthy) => _truthy !== false && _truthy != null)(state.destroyed))) {
  get_dirty(domain).push(reason);
  return schedule();
} } function flush_bang() { return ((!((_truthy) => _truthy !== false && _truthy != null)(state.pendingFlush)) ? Promise.resolve(undefined) : state.pendingFlush.then(() => { if (((_truthy) => _truthy !== false && _truthy != null)(state.pendingFlush)) {
  return flush_bang();
} })); } function diag() { const out = DOMAIN_ORDER.reduce((acc, domain) => ({...acc, [domain]: ((_logical) => (_logical !== false && _logical != null ? _logical : []))(pending.get(domain))}), {});
return {pending: out, nextFlushPending: (!($$bc$equiv(state.pendingFlush, null))), lastReconcileMs: state.lastReconcileMs}; } function destroy() { (state.destroyed = true);
pending.clear();
return reconcilers.clear(); } return {register: register, markDirty: mark_dirty, flush: flush_bang, diag: diag, destroy: destroy}; })();
}

}

{
const $$bc$equiv = $$bc.equivV;

function resolve_tab(ref) {
  return (($$bc$equiv(typeof ref, "number")) ? tab_by_id(ref) : ref);
}

function depth_of(td) {
  return (() => { let d = td; let lv = 0; while (true) {
    if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(d, null)) || ($$bc$equiv(d.parentId, null))))) { return lv; } else { const parent = (($$bc$equiv(typeof d.parentId, "number")) ? tab_by_id(d.parentId) : null); if (($$bc$equiv(parent, null))) { return (lv + 1); } else { const _recur_0 = tree_of.get(parent); const _recur_1 = (lv + 1); d = _recur_0; lv = _recur_1; continue; } }
  } })();
}

function project(tab) {
  const td = tree_of.get(tab);
  if (((_truthy) => _truthy !== false && _truthy != null)(td)) {
    return {id: td.id, url: ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____0 = tab; if ((some_thread____0 == null)) {
  return null;
} else {
  const some_thread____1 = some_thread____0.linkedBrowser;
  if ((some_thread____1 == null)) {
    return null;
  } else {
    const some_thread____2 = some_thread____1.currentURI;
    return ((some_thread____2 == null) ? null : some_thread____2.spec);
  }
} })()), label: ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(tab.label), customName: td.name, pinned: ((_truthy) => _truthy !== false && _truthy != null)(tab.pinned), selected: ((_truthy) => _truthy !== false && _truthy != null)(tab.selected), hidden: ((_truthy) => _truthy !== false && _truthy != null)(tab.hidden), parentId: td.parentId, depth: depth_of(td)};
  }
}

function list_tabs() {
  const out = [];
  const tabs = adapter_all_tabs();
  tabs.forEach((_pct1) => { const p = project(_pct1);
if (((_truthy) => _truthy !== false && _truthy != null)(p)) {
  return out.push(p);
} });
  return out;
}

function selected_tab() {
  return project(adapter_selected_tab());
}

function get_tab(ref) {
  const t = resolve_tab(ref);
  if (((_truthy) => _truthy !== false && _truthy != null)(t)) {
    return project(t);
  }
}

function with_tab(ref, op, reason, scheduler, log) {
  const t = resolve_tab(ref);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(t))) {
    return log("ref:not-found", {ref: (($$bc$equiv(typeof ref, "number")) ? ref : "(Tab elem)")});
  } else {
    op(t);
    return scheduler.markDirty("tabs", reason);
  }
}

make_window_tabs_bang = function(scheduler) {
  const log = create_logger_bang("platform/tabs");
  return {list: () => list_tabs(), selected: () => selected_tab(), get: (_pct1) => get_tab(_pct1), pin: (_pct1) => with_tab(_pct1, adapter_pin_tab, "Gjoa.tabs.pin", scheduler, log), unpin: (_pct1) => with_tab(_pct1, adapter_unpin_tab, "Gjoa.tabs.unpin", scheduler, log), togglePinned: (_pct1) => with_tab(_pct1, adapter_toggle_pinned, "Gjoa.tabs.togglePinned", scheduler, log), close: (_pct1) => with_tab(_pct1, adapter_remove_tab, "Gjoa.tabs.close", scheduler, log), duplicate: (r) => { const t = resolve_tab(r);
if (((_truthy) => _truthy !== false && _truthy != null)(t)) {
  const dup = adapter_duplicate_tab(t);
  scheduler.markDirty("tabs", "Gjoa.tabs.duplicate");
  return project(dup);
} }, reload: (_pct1) => with_tab(_pct1, adapter_reload_tab, "Gjoa.tabs.reload", scheduler, log), select: (_pct1) => with_tab(_pct1, adapter_select_tab, "Gjoa.tabs.select", scheduler, log), activate: (r) => { const t = resolve_tab(r);
if ((!((_truthy) => _truthy !== false && _truthy != null)(t))) {
  log("activate:not-found");
  return false;
} else {
  adapter_select_tab(t);
  (() => { try {
    return window.focus();
  } catch (e) {
    return null;
  } })();
  scheduler.markDirty("tabs", "Gjoa.tabs.activate");
  return true;
} }, open: (url) => { const t = adapter_open_tab(url);
scheduler.markDirty("tabs", "Gjoa.tabs.open");
return project(t); }};
}

}

{

make_gjoa_window_bang = function(scheduler) {
  const window_id = crypto.randomUUID();
  return {windowId: window_id, tabs: make_window_tabs_bang(scheduler)};
}

}

{

function is_of_kind(kind) {
  const prefix = ("".concat(kind, ":"));
  return (_pct1) => ((_logical) => (_logical !== false && _logical != null ? _pct1.tag.startsWith(prefix) : _logical))(_pct1.tag);
}

make_persisted = function(history) {
  return {history: {recent: (_pct1) => history.getRecent(((_logical) => (_logical !== false && _logical != null ? _logical : 50))(((_logical) => (_logical !== false && _logical != null ? _pct1.limit : _logical))(_pct1))), search: (query, opts) => history.search(query, {taggedOnly: ((_logical) => (_logical !== false && _logical != null ? _logical : false))(((_logical) => (_logical !== false && _logical != null ? opts.taggedOnly : _logical))(opts)), limit: ((_logical) => (_logical !== false && _logical != null ? _logical : 50))(((_logical) => (_logical !== false && _logical != null ? opts.limit : _logical))(opts))}), byId: (_pct1) => history.getById(_pct1), instanceId: () => history.instanceId()}, checkpoints: {list: (opts) => history.getTagged(((_logical) => (_logical !== false && _logical != null ? _logical : 100))(((_logical) => (_logical !== false && _logical != null ? opts.limit : _logical))(opts))).then((_pct1) => _pct1.filter(is_of_kind("checkpoint"))), search: (query, opts) => history.search(query, {taggedOnly: true, limit: ((_logical) => (_logical !== false && _logical != null ? _logical : 50))(((_logical) => (_logical !== false && _logical != null ? opts.limit : _logical))(opts))}).then((_pct1) => _pct1.filter(is_of_kind("checkpoint"))), tag: (_pct1) => history.tagLatest("checkpoint", _pct1)}, sessions: {list: (opts) => history.getTagged(((_logical) => (_logical !== false && _logical != null ? _logical : 100))(((_logical) => (_logical !== false && _logical != null ? opts.limit : _logical))(opts))).then((_pct1) => _pct1.filter(is_of_kind("session"))), search: (query, opts) => history.search(query, {taggedOnly: true, limit: ((_logical) => (_logical !== false && _logical != null ? _logical : 50))(((_logical) => (_logical !== false && _logical != null ? opts.limit : _logical))(opts))}).then((_pct1) => _pct1.filter(is_of_kind("session"))), tag: (_pct1) => history.tagLatest("session", _pct1)}};
}

}

{
const $$bc$equiv = $$bc.equivV;

make_cross_window_tabs = function() {
  return {all: () => { const out = [];
(() => { try {
    return (() => { let e = Services.wm.getEnumerator("navigator:browser"); while (true) {
    if (((_truthy) => _truthy !== false && _truthy != null)(e.hasMoreElements())) { (() => { const w = e.getNext(); const p = w.Gjoa; if (((_truthy) => _truthy !== false && _truthy != null)(p)) {
  return (() => { try {
    const win = p.windows.current();
  const tabs = win.tabs.list();
  return tabs.forEach((t) => out.push({id: t.id, url: t.url, label: t.label, customName: t.customName, pinned: t.pinned, selected: t.selected, hidden: t.hidden, parentId: t.parentId, depth: t.depth, windowId: win.windowId}));
  } catch (__e) {
    return null;
  } })();
} })(); const _recur_0 = e; e = _recur_0; continue; } else { return out; }
  } })();
  } catch (err) {
    return console.error("[Gjoa.tabs.all] enumerate failed", err);
  } })();
return out; }, activate: (gjoa_id, window_id) => (() => { try {
    return (() => { let e = Services.wm.getEnumerator("navigator:browser"); while (true) {
    if (((_truthy) => _truthy !== false && _truthy != null)(e.hasMoreElements())) { const w = e.getNext(); const p = w.Gjoa; if (((_truthy) => _truthy !== false && _truthy != null)(p)) { const win = p.windows.current(); if (($$bc$equiv(win.windowId, window_id))) { return win.tabs.activate(gjoa_id); } else { const _recur_0 = e; e = _recur_0; continue; } } else { const _recur_0 = e; e = _recur_0; continue; } } else { return false; }
  } })();
  } catch (err) {
    console.error("[Gjoa.tabs.activate] failed", err);
    return false;
  } })()};
}

}

{

make_gjoa_bang = function(deps) {
  const scheduler = make_scheduler_bang();
  const win = make_gjoa_window_bang(scheduler);
  const persisted = make_persisted(deps.history);
  const cross_window_tabs = make_cross_window_tabs();
  return {windows: {current: () => win}, tabs: cross_window_tabs, history: persisted.history, sessions: persisted.sessions, checkpoints: persisted.checkpoints, flush: () => scheduler.flush(), diag: () => { const s = scheduler.diag();
const wid = win.windowId;
const iid = deps.history.instanceId();
return {scheduler: s, windowId: wid, instanceId: iid}; }, destroy: () => scheduler.destroy()};
}

}

{
const $$bc$equiv = $$bc.equivV;

collapse_flags = function(launcher_expanded, compact, hover) {
  const compact_revealed = (compact && hover);
  return {iconsOnly: ((!launcher_expanded) && (!((_truthy) => _truthy !== false && _truthy != null)(compact_revealed))), sidebarCollapsed: ((!launcher_expanded) || compact)};
}

make_layout_bang = function(deps) {
  const sidebar_main = deps.sidebarMain;
  const rows = deps.rows;
  const log = create_logger_bang("tabs/layout");
  const priv = {toolboxResizeObs: null, alignSpacer: null, lastVertical: null, posPanelRaf: 0};
  const is_vertical = () => (() => { try {
    return Services.prefs.getBoolPref("sidebar.verticalTabs", true);
  } catch (__e____scope__4__1__4__1__14__3__2__1__0) {
    return true;
  } })();
  const apply_layout_tree_collapse = () => { const vertical = is_vertical();
const space_filter = deps.isTabInActiveSpace;
const all = all_rows();
const mutated = {v: false};
const set_lc_bang = (row, val) => { const d = data_of_bang(row);
const cur = (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? d.layoutCollapsed : _logical))(d)) ? true : false);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!(cur === val)) : _logical))(d))) {
  (d.layoutCollapsed = val);
  rows.syncAnyRow(row);
  return (mutated.v = true);
} };
if (((_truthy) => _truthy !== false && _truthy != null)(vertical)) {
  all.forEach((row) => { if (($$bc$equiv(level_of_row_bang(row), 0))) {
  return set_lc_bang(row, false);
} });
} else {
  const active_tab = ((_logical) => (_logical !== false && _logical != null ? gBrowser.selectedTab : _logical))(gBrowser);
  const active_row = ((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? _logical : all.find((_pct1) => ($$bc$equiv(_pct1._tab, active_tab)))))(row_of.get(active_tab)) : _logical))(active_tab);
  const found = {root: null};
  if (((_truthy) => _truthy !== false && _truthy != null)(active_row)) {
    (() => { let i = all.indexOf(active_row); while (true) {
    if ((i >= 0)) {  if (($$bc$equiv(level_of_row_bang(all[i]), 0))) { return (found.root = all[i]); } else { const _recur_0 = (i - 1); i = _recur_0; continue; } } else { return null; }
  } })();
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(found.root)) {
    all.forEach((row) => { if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(level_of_row_bang(row), 0)) && (() => { const t = row._tab; return ((!((_truthy) => _truthy !== false && _truthy != null)(t)) || ((!((_truthy) => _truthy !== false && _truthy != null)(space_filter)) || space_filter(t))); })()))) {
  return set_lc_bang(row, (!($$bc$equiv(row, found.root))));
} });
  }
}
if (((_truthy) => _truthy !== false && _truthy != null)(mutated.v)) {
  return rows.updateVisibility();
} };
  const setup_horizontal_align_spacer = () => { const target = document.getElementById("TabsToolbar-customization-target");
if (((_truthy) => _truthy !== false && _truthy != null)(target)) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(priv.alignSpacer))) {
    const el = document.createXULElement("box");
    (el.id = "gjoa-content-alignment-spacer");
    (el.style.flex = "0 0 auto");
    (el.style.width = "10px");
    (priv.alignSpacer = el);
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(same_node_p(target.firstChild, priv.alignSpacer)))) {
    return target.prepend(priv.alignSpacer);
  }
} };
  const teardown_horizontal_align_spacer = () => { if (((_truthy) => _truthy !== false && _truthy != null)(priv.alignSpacer)) {
  return priv.alignSpacer.remove();
} };
  const set_urlbar_top_layer = (in_top_layer) => { const urlbar = document.getElementById("urlbar");
if (((_truthy) => _truthy !== false && _truthy != null)(urlbar)) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(sidebar_main.hasAttribute("data-gjoa-compact")))) {
    if (((_truthy) => _truthy !== false && _truthy != null)((in_top_layer && (!((_truthy) => _truthy !== false && _truthy != null)(urlbar.hasAttribute("popover")))))) {
      urlbar.setAttribute("popover", "manual");
      return (() => { try {
    return urlbar.showPopover();
  } catch (__e) {
    return null;
  } })();
    } else {
      if (((_truthy) => _truthy !== false && _truthy != null)(((!in_top_layer) && urlbar.hasAttribute("popover")))) {
        return urlbar.removeAttribute("popover");
      }
    }
  }
} };
  const position_panel = () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.panel)) {
  const vertical = is_vertical();
  state.panel.toggleAttribute("gjoa-horizontal", (!((_truthy) => _truthy !== false && _truthy != null)(vertical)));
  if (((_truthy) => _truthy !== false && _truthy != null)(state.pinnedContainer)) {
    state.pinnedContainer.toggleAttribute("gjoa-horizontal", (!((_truthy) => _truthy !== false && _truthy != null)(vertical)));
  }
  document.documentElement.toggleAttribute("gjoa-horizontal-tabs", (!((_truthy) => _truthy !== false && _truthy != null)(vertical)));
  if (((_truthy) => _truthy !== false && _truthy != null)(priv.toolboxResizeObs)) {
    priv.toolboxResizeObs.disconnect();
    (priv.toolboxResizeObs = null);
  }
  const toolbox = document.getElementById("navigator-toolbox");
  const toolbox_in_sidebar = ((_logical) => (_logical !== false && _logical != null ? same_node_p(toolbox.parentNode, sidebar_main) : _logical))(toolbox);
  const launcher_expanded = sidebar_main.hasAttribute("sidebar-launcher-expanded");
  if (((_truthy) => _truthy !== false && _truthy != null)(vertical)) {
    const flags = collapse_flags(launcher_expanded, sidebar_main.hasAttribute("data-gjoa-compact"), sidebar_main.hasAttribute("gjoa-has-hover"));
    const sidebar_collapsed = flags.sidebarCollapsed;
    const icons_only = flags.iconsOnly;
    state.panel.toggleAttribute("gjoa-icons-only", icons_only);
    if (((_truthy) => _truthy !== false && _truthy != null)(state.pinnedContainer)) {
      state.pinnedContainer.toggleAttribute("gjoa-icons-only", icons_only);
    }
    if (((_truthy) => _truthy !== false && _truthy != null)(state.spaceHeader)) {
      state.spaceHeader.toggleAttribute("gjoa-icons-only", icons_only);
    }
    document.documentElement.toggleAttribute("gjoa-sidebar-collapsed", sidebar_collapsed);
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? state.pinnedContainer : _logical))(toolbox) : _logical))(toolbox_in_sidebar))) {
      if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(same_node_p(toolbox.nextElementSibling, state.spaceHeader))) : _logical))(state.spaceHeader))) {
        toolbox.after(state.spaceHeader);
      }
      const header_anchor = ((_logical) => (_logical !== false && _logical != null ? _logical : toolbox))(state.spaceHeader);
      if ((!((_truthy) => _truthy !== false && _truthy != null)(same_node_p(header_anchor.nextElementSibling, state.pinnedContainer)))) {
        header_anchor.after(state.pinnedContainer);
      }
      if ((!((_truthy) => _truthy !== false && _truthy != null)(same_node_p(state.pinnedContainer.nextElementSibling, state.panel)))) {
        state.pinnedContainer.after(state.panel);
      }
    } else {
      if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(same_node_p(state.panel.parentNode, sidebar_main))) || (!((_truthy) => _truthy !== false && _truthy != null)(same_node_p(sidebar_main.firstElementChild, ((_logical) => (_logical !== false && _logical != null ? _logical : state.pinnedContainer))(state.spaceHeader))))) : _logical))(state.pinnedContainer))) {
        sidebar_main.prepend(state.panel);
        sidebar_main.prepend(state.pinnedContainer);
        if (((_truthy) => _truthy !== false && _truthy != null)(state.spaceHeader)) {
          sidebar_main.prepend(state.spaceHeader);
        }
      }
    }
    teardown_horizontal_align_spacer();
    set_urlbar_top_layer(true);
  } else {
    state.panel.removeAttribute("gjoa-icons-only");
    if (((_truthy) => _truthy !== false && _truthy != null)(state.pinnedContainer)) {
      state.pinnedContainer.removeAttribute("gjoa-icons-only");
    }
    document.documentElement.removeAttribute("gjoa-sidebar-collapsed");
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? state.spaceHeader.parentNode : _logical))(state.spaceHeader))) {
      state.spaceHeader.remove();
    }
    const tabbrowser_tabs = document.getElementById("tabbrowser-tabs");
    if (((_truthy) => _truthy !== false && _truthy != null)(tabbrowser_tabs)) {
      if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(same_node_p(tabbrowser_tabs.nextElementSibling, state.pinnedContainer))) : _logical))(state.pinnedContainer))) {
        tabbrowser_tabs.after(state.pinnedContainer);
      }
      const anchor = ((_logical) => (_logical !== false && _logical != null ? _logical : tabbrowser_tabs))(state.pinnedContainer);
      if ((!((_truthy) => _truthy !== false && _truthy != null)(same_node_p(anchor.nextElementSibling, state.panel)))) {
        anchor.after(state.panel);
      }
    }
    setup_horizontal_align_spacer();
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(toolbox_in_sidebar)) && toolbox))) {
    const update_height = () => { const h = toolbox.getBoundingClientRect().height;
return document.documentElement.style.setProperty("--gjoa-toolbox-height", ("".concat(h, "px"))); };
    update_height();
    (priv.toolboxResizeObs = new ResizeObserver(update_height));
    priv.toolboxResizeObs.observe(toolbox);
  } else {
    document.documentElement.style.removeProperty("--gjoa-toolbox-height");
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(vertical)) {
    rows.clearHorizontalGrid();
  }
  all_rows().forEach((_pct1) => rows.syncAnyRow(_pct1));
  rows.updateVisibility();
  const mode_changed = ((!($$bc$equiv(priv.lastVertical, null))) && (!($$bc$equiv(priv.lastVertical, vertical))));
  const initial_horizontal = (($$bc$equiv(priv.lastVertical, null)) && (!((_truthy) => _truthy !== false && _truthy != null)(vertical)));
  log("positionPanel:transitionCheck", {lastVertical: priv.lastVertical, vertical: vertical, modeChanged: mode_changed, initialHorizontal: initial_horizontal, willTrigger: ((_logical) => (_logical !== false && _logical != null ? _logical : initial_horizontal))(mode_changed)});
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : initial_horizontal))(mode_changed))) {
    apply_layout_tree_collapse();
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(deps.reconcileSelection)) {
    deps.reconcileSelection();
  }
  return (priv.lastVertical = vertical);
} };
  const request_position_panel = () => { if (($$bc$equiv(priv.posPanelRaf, 0))) {
  return (priv.posPanelRaf = requestAnimationFrame(() => { (priv.posPanelRaf = 0);
return position_panel(); }));
} };
  return {positionPanel: position_panel, requestPositionPanel: request_position_panel, isVertical: is_vertical, setUrlbarTopLayer: set_urlbar_top_layer};
}

}

{
const $$bc$equiv = $$bc.equivV, $$bc$get = $$bc.get;

function reset_style_bang(el) {
  (el.style.gridColumn = "");
  (el.style.gridRow = "");
  (el.style.position = "");
  (el.style.left = "");
  (el.style.top = "");
  (el.style.width = "");
  return (el.style.zIndex = "");
}

make_rows_bang = function(deps) {
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

}

{
const $$bc$equiv = $$bc.equivV;

function find_sib_bang(start, pred, dir) {
  return (() => { let node = start; while (true) {
    if ((!((_truthy) => _truthy !== false && _truthy != null)(node))) { return null; } else if (((_truthy) => _truthy !== false && _truthy != null)(pred(node))) { return node; } else { const _recur_0 = dir(node); node = _recur_0; continue; }
  } })();
}

function set_idx_bang(r, idx, branch) {
  (r.targetIdx = idx);
  return (r.idxBranch = branch);
}

function tabs_of(rows) {
  return rows.filter((_pct1) => _pct1._tab).map((_pct1) => _pct1._tab);
}

function row_pinned_p(row) {
  return ((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? row._tab.pinned : _logical))(row._tab));
}

function in_pinned_section_p(row) {
  return ((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? same_node_p(row.parentNode, state.pinnedContainer) : _logical))(row));
}

function row_desc_bang(row) {
  return (((!((_truthy) => _truthy !== false && _truthy != null)(row))) ? {row: "null"} : (((_truthy) => _truthy !== false && _truthy != null)(row._tab)) ? {kind: "tab", id: tree_data_bang(row._tab).id, label: row._tab.label, level: level_of_bang(row._tab), pinned: ((_truthy) => _truthy !== false && _truthy != null)(row._tab.pinned), parentId: tree_data_bang(row._tab).parentId} : (((_truthy) => _truthy !== false && _truthy != null)(row._group)) ? {kind: "group", id: row._group.id, name: row._group.name, level: row._group.level} : {kind: "?"});
}

function find_group_context_parent(group, log_fn) {
  const id = (() => { const some_thread____0 = group; if ((some_thread____0 == null)) {
  return null;
} else {
  const some_thread____1 = some_thread____0._group;
  return ((some_thread____1 == null) ? null : some_thread____1.id);
} })();
  log_fn("findGroupContextParent", {groupId: id, groupLevel: ((_logical) => (_logical !== false && _logical != null ? _logical : 0))((() => { const some_thread____2 = group; if ((some_thread____2 == null)) {
  return null;
} else {
  const some_thread____3 = some_thread____2._group;
  return ((some_thread____3 == null) ? null : some_thread____3.level);
} })())});
  return id;
}

function find_closest_tab_before_bang(row) {
  const hit = find_sib_bang(row.previousElementSibling, (_pct1) => _pct1._tab, (_pct1) => _pct1.previousElementSibling);
  return ((_logical) => (_logical !== false && _logical != null ? hit._tab : _logical))(hit);
}

function cell_under_bang(container, client_x, client_y) {
  const rows = (((_truthy) => _truthy !== false && _truthy != null)(container) ? (() => { return container.querySelectorAll(".gjoa-tab-row:not([hidden]), .gjoa-group-row:not([hidden])"); })() : null);
  const found = {v: null};
  if (((_truthy) => _truthy !== false && _truthy != null)(rows)) {
    rows.forEach((r) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(found.v))) {
  const rect = r.getBoundingClientRect();
  if (((_truthy) => _truthy !== false && _truthy != null)(((client_x >= rect.left) && ((client_x < rect.right) && ((client_y >= rect.top) && (client_y < rect.bottom)))))) {
    return (found.v = r);
  }
} });
  }
  return found.v;
}

function find_last_tab_in_group_or_before_bang(group) {
  const subtree_tabs = tabs_of(subtree_rows_bang(group).slice(1));
  if (((_truthy) => _truthy !== false && _truthy != null)(subtree_tabs.length)) {
    const __a____scope__12__4__2__2__1__0 = subtree_tabs;
    const __n____scope__12__4__2__2__1__3 = __a____scope__12__4__2__2__1__0.length;
    return __a____scope__12__4__2__2__1__0[(__n____scope__12__4__2__2__1__3 - 1)];
  } else {
    return find_closest_tab_before_bang(group);
  }
}

make_drag_bang = function(deps) {
  const clear_selection = deps.clearSelection;
  const schedule_tree_resync = deps.scheduleTreeResync;
  const schedule_save = deps.scheduleSave;
  const log = create_logger_bang("tabs/drag");
  const ds = {dragSource: null, dropIndicator: null, dropTarget: null, dropPosition: null};
  const clear_drop_indicator = () => { if (((_truthy) => _truthy !== false && _truthy != null)(ds.dropIndicator)) {
  ds.dropIndicator.remove();
}
(ds.dropTarget = null);
return (ds.dropPosition = null); };
  const clear_drop_strip = () => { const pc = state.pinnedContainer;
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? pc.hasAttribute("gjoa-drop-strip") : _logical))(pc))) {
  pc.removeAttribute("gjoa-drop-strip");
  return (pc.hidden = (!((_truthy) => _truthy !== false && _truthy != null)(pc.querySelector(".gjoa-tab-row"))));
} };
  const show_drop_indicator = (target_row, position) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(ds.dropIndicator))) {
  const el = document.createXULElement("box");
  (el.id = "gjoa-drop-indicator");
  (ds.dropIndicator = el);
}
const ind = ds.dropIndicator;
ind.removeAttribute("gjoa-drop-child");
ind.removeAttribute("gjoa-fixed");
(ind.style.cssText = "");
log("showDropIndicator", {target: row_desc_bang(target_row), position: position, horizontal: is_horizontal()});
if (is_horizontal()) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(same_node_p(ind.parentNode, document.documentElement)))) {
    document.documentElement.appendChild(ind);
  }
  const rect = target_row.getBoundingClientRect();
  const s = ind.style;
  ind.setAttribute("gjoa-fixed", "true");
  (s.position = "fixed");
  if (($$bc$equiv(position, "child"))) {
    ind.setAttribute("gjoa-drop-child", "true");
    (s.left = ("".concat(rect.left, "px")));
    (s.top = (() => { const rect_bottom = rect.bottom; return ("".concat((rect_bottom - 1), "px")); })());
    (s.width = ("".concat(rect.width, "px")));
    return (s.height = "2px");
  } else {
    const rect_left = rect.left;
    const rect_right = rect.right;
    const x_edge = (($$bc$equiv(position, "before")) ? (rect_left - 1) : (rect_right - 1));
    (s.left = ("".concat(x_edge, "px")));
    (s.top = ("".concat(rect.top, "px")));
    (s.width = "2px");
    return (s.height = ("".concat(rect.height, "px")));
  }
} else {
  const lvl = level_of_row_bang(target_row);
  if (($$bc$equiv(position, "child"))) {
    ind.setAttribute("gjoa-drop-child", "true");
    target_row.after(ind);
  } else if (($$bc$equiv(position, "before"))) {
    target_row.before(ind);
  } else {
    const st = subtree_rows_bang(target_row);
    ((() => { const __a____scope__13__1__4__1__23__4__6__3__2__6__2__1__1__0 = st; const __n____scope__13__1__4__1__23__4__6__3__2__6__2__1__1__3 = __a____scope__13__1__4__1__23__4__6__3__2__6__2__1__1__0.length; return __a____scope__13__1__4__1__23__4__6__3__2__6__2__1__1__0[(__n____scope__13__1__4__1__23__4__6__3__2__6__2__1__1__3 - 1)]; })()).after(ind);
  }
  return (ind.style.marginInlineStart = ("".concat((((($$bc$equiv(position, "child")) ? (lvl + 1) : lvl) * INDENT) + 8), "px")));
} };
  const execute_drop = (src_row, tgt_row, position) => { clear_drop_indicator();
const tgt_level = level_of_row_bang(tgt_row);
if ((!((_truthy) => _truthy !== false && _truthy != null)(data_of_bang(tgt_row)))) {
  return log("executeDrop:abort", {reason: "no-tgt-data", target: row_desc_bang(tgt_row)});
} else {
  const src_pinned = ((_logical) => (_logical !== false && _logical != null ? _logical : in_pinned_section_p(src_row)))(row_pinned_p(src_row));
  const tgt_pinned = ((_logical) => (_logical !== false && _logical != null ? _logical : in_pinned_section_p(tgt_row)))(row_pinned_p(tgt_row));
  const is_cross_container = (!(src_pinned === tgt_pinned));
  log("executeDrop:enter", {source: row_desc_bang(src_row), target: row_desc_bang(tgt_row), position: position, srcPinned: src_pinned, tgtPinned: tgt_pinned, isCrossContainer: is_cross_container, tgtLevel: tgt_level});
  const moved_rows = ((((_truthy) => _truthy !== false && _truthy != null)((is_cross_container && src_row._tab))) ? [src_row] : (((_truthy) => _truthy !== false && _truthy != null)((is_cross_container && src_row._group))) ? subtree_rows_bang(src_row) : (is_cross_container) ? [] : (((_truthy) => _truthy !== false && _truthy != null)(((selection.size > 1) && selection.has(src_row)))) ? all_rows().filter((_pct1) => selection.has(_pct1)) : subtree_rows_bang(src_row));
  if (($$bc$equiv(moved_rows.length, 0))) {
    return log("executeDrop:abort", {reason: "no-movedRows"});
  } else {
    const src_level = level_of_row_bang(moved_rows[0]);
    const new_src_level = (($$bc$equiv(position, "child")) ? (tgt_level + 1) : tgt_level);
    const delta = (new_src_level - src_level);
    log("executeDrop:plan", {movedRowsCount: moved_rows.length, srcLevel: src_level, newSrcLevel: new_src_level, delta: delta});
    const parent_result = {value: null, branch: "no-tab-no-group->null"};
    if (((_truthy) => _truthy !== false && _truthy != null)(tgt_row._tab)) {
      (parent_result.branch = (($$bc$equiv(position, "child")) ? "tab/child->tgtId" : "tab/sibling->tgtParentId"));
      (parent_result.value = (($$bc$equiv(position, "child")) ? tree_data_bang(tgt_row._tab).id : tree_data_bang(tgt_row._tab).parentId));
    } else if (((_truthy) => _truthy !== false && _truthy != null)(tgt_row._group)) {
      if (($$bc$equiv(position, "child"))) {
        (parent_result.branch = "group/child->groupId");
        (parent_result.value = find_group_context_parent(tgt_row, log));
      } else {
        const group_level = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))((() => { const some_thread____4 = tgt_row; if ((some_thread____4 == null)) {
  return null;
} else {
  const some_thread____5 = some_thread____4._group;
  return ((some_thread____5 == null) ? null : some_thread____5.level);
} })());
        (parent_result.branch = ("".concat("group/", position, "->siblingOfGroup(level=", group_level, ")")));
        if ((group_level <= 0)) {
          (parent_result.value = null);
        } else {
          const enc = find_sib_bang(tgt_row.previousElementSibling, (prev) => ((_logical) => (_logical !== false && _logical != null ? (((_logical) => (_logical !== false && _logical != null ? _logical : 0))(prev._group.level) < group_level) : _logical))(prev._group), (_pct1) => _pct1.previousElementSibling);
          (parent_result.value = ((_logical) => (_logical !== false && _logical != null ? enc._group.id : _logical))(enc));
        }
      }
    } else {
      null;
    }
    log("executeDrop:newParent", {branch: parent_result.branch, newParentForSource: parent_result.value});
    const moved_set = new Set(moved_rows);
    const mutation_count = {v: 0};
    moved_rows.forEach((r) => ((((_truthy) => _truthy !== false && _truthy != null)(r._tab)) ? (() => { const td = tree_data_bang(r._tab); const parent = tab_by_id(((!($$bc$equiv(td.parentId, undefined))) ? td.parentId : 0)); if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(parent)) || (!((_truthy) => _truthy !== false && _truthy != null)(moved_set.has(row_of.get(parent))))))) {
  const old_pid = td.parentId;
  (td.parentId = parent_result.value);
  const mutations = mutation_count.v;
  (mutation_count.v = (mutations + 1));
  return log("executeDrop:mutate", {tab: r._tab.label, tabId: td.id, oldParentId: old_pid, newParentId: parent_result.value});
} })() : (((_truthy) => _truthy !== false && _truthy != null)(r._group)) ? (() => { const group_level = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(r._group.level); return (r._group.level = Math.max(0, (group_level + delta))); })() : null), log("executeDrop:mutations", {parentIdMutations: mutation_count.v}));
    const moved_tabs = tabs_of(moved_rows);
    if (is_cross_container) {
      moved_tabs.forEach((_pct1) => ((((_truthy) => _truthy !== false && _truthy != null)((tgt_pinned && (!((_truthy) => _truthy !== false && _truthy != null)(_pct1.pinned))))) ? gBrowser.pinTab(_pct1) : (((_truthy) => _truthy !== false && _truthy != null)(((!tgt_pinned) && _pct1.pinned))) ? gBrowser.unpinTab(_pct1) : null));
    }
    const tabs_arr = Array.from(gBrowser.tabs);
    const idx_result = {targetIdx: 0, idxBranch: ""};
    if (((_truthy) => _truthy !== false && _truthy != null)(tgt_row._group)) {
      if (($$bc$equiv(position, "child"))) {
        const sub_tabs = tabs_of(subtree_rows_bang(tgt_row).slice(1));
        if (((_truthy) => _truthy !== false && _truthy != null)(sub_tabs.length)) {
          const sub_count = sub_tabs.length;
          const last_sub_idx = tabs_arr.indexOf(sub_tabs[(sub_count - 1)]);
          const idx = (last_sub_idx + 1);
          set_idx_bang(idx_result, idx, ("".concat("group/child->after-lastSubtreeTab@", (idx - 1))));
        } else {
          const first_after_row = find_sib_bang(tgt_row.nextElementSibling, (_pct1) => _pct1._tab, (_pct1) => _pct1.nextElementSibling);
          const first_after = (() => { const some_thread____6 = first_after_row; return ((some_thread____6 == null) ? null : some_thread____6._tab); })();
          if (((_truthy) => _truthy !== false && _truthy != null)(first_after)) {
            const idx = tabs_arr.indexOf(first_after);
            set_idx_bang(idx_result, idx, ("".concat("group/child(empty)->before-firstAfterGroup@", idx)));
          } else {
            set_idx_bang(idx_result, tabs_arr.length, "group/child(empty,end)->tabsArr.length");
          }
        }
      } else {
        const anchor_tab = (($$bc$equiv(position, "before")) ? find_closest_tab_before_bang(tgt_row) : find_last_tab_in_group_or_before_bang(tgt_row));
        if (((_truthy) => _truthy !== false && _truthy != null)(anchor_tab)) {
          const anchor_idx = tabs_arr.indexOf(anchor_tab);
          set_idx_bang(idx_result, (anchor_idx + 1), ("".concat("group/", position, "->after-anchor")));
        } else {
          set_idx_bang(idx_result, tabs_arr.length, ("".concat("group/", position, "->no-anchor->end")));
        }
      }
    } else if (($$bc$equiv(position, "before"))) {
      const idx = tabs_arr.indexOf(tgt_row._tab);
      set_idx_bang(idx_result, idx, ("".concat("tab/before->", idx)));
    } else {
      const tgt_subtree = ((!is_horizontal()) ? (() => { return subtree_rows_bang(tgt_row).slice().reverse(); })() : null);
      const tgt_sub_row = (((_truthy) => _truthy !== false && _truthy != null)(tgt_subtree) ? (() => { return tgt_subtree.find((_pct1) => _pct1._tab); })() : null);
      const tgt_sub_tab = (() => { const some_thread____7 = tgt_sub_row; return ((some_thread____7 == null) ? null : some_thread____7._tab); })();
      const tgt_idx = (((_truthy) => _truthy !== false && _truthy != null)(tgt_sub_tab) ? tabs_arr.indexOf(tgt_sub_tab) : tabs_arr.indexOf(tgt_row._tab));
      const idx = (tgt_idx + 1);
      set_idx_bang(idx_result, idx, ("".concat("tab/", position, "->after->", idx)));
    }
    if ((idx_result.targetIdx < 0)) {
      set_idx_bang(idx_result, tabs_arr.length, ("".concat(idx_result.idxBranch, "->clamp(", tabs_arr.length, ")")));
    }
    log("executeDrop:targetIdx", {idxBranch: idx_result.idxBranch, targetIdx: idx_result.targetIdx, tabsLen: tabs_arr.length});
    moved_tabs.forEach((_pct1) => moving_tabs.add(_pct1));
    const insert_state = {idx: idx_result.targetIdx};
    const move_count = {v: 0};
    moved_tabs.forEach((t) => { const current_idx = Array.from(gBrowser.tabs).indexOf(t);
if ((current_idx >= 0)) {
  const insert_idx = insert_state.idx;
  if ((current_idx < insert_idx)) {
    (insert_state.idx = (insert_idx - 1));
  }
  if ((!($$bc$equiv(current_idx, insert_state.idx)))) {
    log("executeDrop:moveTabTo", {tab: t.label, currentIdx: current_idx, insertIdx: insert_state.idx});
    gBrowser.moveTabTo(t, {tabIndex: insert_state.idx});
    const moves = move_count.v;
    (move_count.v = (moves + 1));
  }
  const insert_idx = insert_state.idx;
  return (insert_state.idx = (insert_idx + 1));
} });
    log("executeDrop:moveSummary", {actualMoves: move_count.v, totalTabs: moved_tabs.length});
    const group_rows = moved_rows.filter((_pct1) => _pct1._group);
    if (((_truthy) => _truthy !== false && _truthy != null)(group_rows.length)) {
      if (($$bc$equiv(position, "before"))) {
        group_rows.forEach((_pct1) => tgt_row.before(_pct1));
      } else {
        const st = subtree_rows_bang(tgt_row);
        const anchor_rows = st.filter((_pct1) => (!((_truthy) => _truthy !== false && _truthy != null)(moved_rows.includes(_pct1))));
        const anchor_count = anchor_rows.length;
        const anchor = ((anchor_count > 0) ? anchor_rows[(anchor_count - 1)] : tgt_row);
        const last_ins = {v: anchor};
        group_rows.forEach((_pct1) => { last_ins.v.after(_pct1);
return (last_ins.v = _pct1); });
      }
      log("executeDrop:groupDOMMove", {groupRowsCount: group_rows.length});
    }
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(position, "child")) && src_row._tab) : _logical))(tgt_row._group))) {
      const st = subtree_rows_bang(tgt_row);
      const anchor_rows = st.filter((_pct1) => (!((_truthy) => _truthy !== false && _truthy != null)(moved_rows.includes(_pct1))));
      const anchor_count = anchor_rows.length;
      const anchor = ((anchor_count > 0) ? anchor_rows[(anchor_count - 1)] : tgt_row);
      const last_ins = {v: anchor};
      moved_rows.forEach((_pct1) => { last_ins.v.after(_pct1);
return (last_ins.v = _pct1); });
      log("executeDrop:tabIntoGroupDOMMove", {movedRows: moved_rows.length});
    }
    clear_selection();
    return requestAnimationFrame(() => { moved_tabs.forEach((_pct1) => moving_tabs.delete(_pct1));
moved_tabs.forEach((_pct1) => { const r = row_of.get(_pct1);
if (((_truthy) => _truthy !== false && _truthy != null)(r)) {
  return r.toggleAttribute("busy", _pct1.hasAttribute("busy"));
} });
log("executeDrop:settled", {sourceFinal: row_desc_bang(src_row), sourceParentInTree: (() => { const some_thread____8 = src_row; if ((some_thread____8 == null)) {
  return null;
} else {
  const some_thread____9 = some_thread____8._tab;
  if ((some_thread____9 == null)) {
    return null;
  } else {
    const some_thread____10 = tree_data_bang(some_thread____9);
    return ((some_thread____10 == null) ? null : some_thread____10.parentId);
  }
} })()});
schedule_tree_resync();
return schedule_save(); });
  }
} };
  const handle_container_drop = (e, container_ref, container_action) => { e.preventDefault();
const tab = ds.dragSource._tab;
const client_x = e.clientX;
const client_y = e.clientY;
const start_x = ds.dragStartX;
const start_y = ds.dragStartY;
const dx = (client_x - ((typeof start_x === 'number') ? start_x : client_x));
const dy = (client_y - ((typeof start_y === 'number') ? start_y : client_y));
const moved_px2 = ((dx * dx) + (dy * dy));
if ((moved_px2 < 36)) {
  log("drop/container:abort", {reason: "below-drag-threshold (click, not drag)", movedPx2: moved_px2});
} else if (((_truthy) => _truthy !== false && _truthy != null)(tab)) {
  if (((_truthy) => _truthy !== false && _truthy != null)(same_node_p(ds.dropTarget, container_ref))) {
    container_action(tab);
  } else {
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ds.dropPosition : _logical))(((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const some_thread____13 = ds; if ((some_thread____13 == null)) {
  return null;
} else {
  const some_thread____14 = some_thread____13.dropTarget;
  return ((some_thread____14 == null) ? null : some_thread____14._group);
} })()))((() => { const some_thread____11 = ds; if ((some_thread____11 == null)) {
  return null;
} else {
  const some_thread____12 = some_thread____11.dropTarget;
  return ((some_thread____12 == null) ? null : some_thread____12._tab);
} })())) : _logical))(ds.dropTarget))) {
      execute_drop(ds.dragSource, ds.dropTarget, ds.dropPosition);
    }
  }
} else {
  null;
}
clear_drop_indicator();
return clear_drop_strip(); };
  const __ = document.addEventListener("mousedown", () => { if (($$bc$equiv(ds.dragSource, null))) {
  return document.querySelectorAll("[gjoa-dragging]").forEach((_pct1) => _pct1.removeAttribute("gjoa-dragging"));
} }, true);
  const setup_drag = (row) => { (row.draggable = true);
row.addEventListener("dragstart", (e) => { const t = e.target;
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? t.classList.contains("gjoa-tab-close") : _logical))(t.classList))) {
  return e.preventDefault();
} else {
  (ds.dragSource = row);
  const pc = state.pinnedContainer;
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(row_pinned_p(row))) && (!((_truthy) => _truthy !== false && _truthy != null)(pc.querySelector(".gjoa-tab-row")))) : _logical))(pc))) {
    (pc.hidden = false);
    pc.setAttribute("gjoa-drop-strip", "true");
  }
  (ds.dragStartX = e.clientX);
  (ds.dragStartY = e.clientY);
  log("dragstart", {source: row_desc_bang(row)});
  const dt = e.dataTransfer;
  (dt.effectAllowed = "move");
  dt.setData("text/plain", "");
  return row.setAttribute("gjoa-dragging", "true");
} });
row.addEventListener("dragend", () => { log("dragend/row", {listenerOnRow: row_desc_bang(row), sourceWas: (((_truthy) => _truthy !== false && _truthy != null)(ds.dragSource) ? row_desc_bang(ds.dragSource) : "already-null"), dropPositionWas: ds.dropPosition});
if (((_truthy) => _truthy !== false && _truthy != null)(ds.dragSource)) {
  ds.dragSource.removeAttribute("gjoa-dragging");
}
(ds.dragSource = null);
clear_drop_indicator();
return clear_drop_strip(); });
const last_logged = {v: null};
row.addEventListener("dragover", (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(same_node_p(ds.dragSource, row))) && (!((_truthy) => _truthy !== false && _truthy != null)(subtree_rows_bang(ds.dragSource).includes(row)))) : _logical))(ds.dragSource))) {
  e.preventDefault();
  (e.dataTransfer.dropEffect = "move");
  const horizontal = is_horizontal();
  const target = (horizontal ? (() => { const c = cell_under_bang(row.parentNode, e.clientX, e.clientY); return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(same_node_p(c, ds.dragSource))) && (!((_truthy) => _truthy !== false && _truthy != null)(subtree_rows_bang(ds.dragSource).includes(c)))) : _logical))(c)) ? c : row); })() : row);
  const rect = target.getBoundingClientRect();
  const rect_left = rect.left;
  const rect_top = rect.top;
  const rect_w = rect.width;
  const rect_h = rect.height;
  const ptr_x = e.clientX;
  const ptr_y = e.clientY;
  const x = (ptr_x - rect_left);
  const y = (ptr_y - rect_top);
  const pos_info = {branch: ""};
  if (horizontal) {
    if ((y > (rect_h * 0.75))) {
      (ds.dropPosition = "child");
      (pos_info.branch = "hz/y>3/4->child");
    } else if ((x < (rect_w / 2))) {
      (ds.dropPosition = "before");
      (pos_info.branch = "hz/x<w/2->before");
    } else {
      (ds.dropPosition = "after");
      (pos_info.branch = "hz/x>=w/2->after");
    }
  } else {
    const zone = (rect_h / 3);
    if ((y < zone)) {
      (ds.dropPosition = "before");
      (pos_info.branch = "vt/y<1/3->before");
    } else if ((y > (zone * 2))) {
      (ds.dropPosition = "after");
      (pos_info.branch = "vt/y>2/3->after");
    } else {
      (ds.dropPosition = "child");
      (pos_info.branch = "vt/middle->child");
    }
  }
  (ds.dropTarget = target);
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : (!($$bc$equiv(last_logged.v, ds.dropPosition)))))(target._group))) {
    log("dragover", {target: row_desc_bang(target), source: row_desc_bang(ds.dragSource), position: ds.dropPosition, posBranch: pos_info.branch, rect: {w: Math.round(rect.width), h: Math.round(rect.height)}, mouse: {x: Math.round(x), y: Math.round(y)}, horizontal: horizontal});
    (last_logged.v = ds.dropPosition);
  }
  return show_drop_indicator(target, ds.dropPosition);
} });
row.addEventListener("dragleave", (e) => { const related = e.relatedTarget;
if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(row.contains(related))) && same_node_p(ds.dropTarget, row)))) {
  return clear_drop_indicator();
} });
return row.addEventListener("drop", (e) => { e.preventDefault();
const tgt = ((_logical) => (_logical !== false && _logical != null ? _logical : row))(ds.dropTarget);
const client_x = e.clientX;
const client_y = e.clientY;
const start_x = ds.dragStartX;
const start_y = ds.dragStartY;
const dx = (client_x - ((typeof start_x === 'number') ? start_x : client_x));
const dy = (client_y - ((typeof start_y === 'number') ? start_y : client_y));
const moved_px2 = ((dx * dx) + (dy * dy));
log("drop/row:fired", {listenerOnRow: row_desc_bang(row), resolvedTarget: row_desc_bang(tgt), movedPx2: moved_px2, hasDragSource: ((_truthy) => _truthy !== false && _truthy != null)(ds.dragSource)});
if ((!((_truthy) => _truthy !== false && _truthy != null)(ds.dragSource))) {
  log("drop/row:abort", {reason: "no-dragSource"});
} else if ((moved_px2 < 36)) {
  log("drop/row:abort", {reason: "below-drag-threshold (click, not drag)"});
} else if (((_truthy) => _truthy !== false && _truthy != null)(same_node_p(ds.dragSource, tgt))) {
  log("drop/row:abort", {reason: "source-equals-target"});
} else if (((_truthy) => _truthy !== false && _truthy != null)(subtree_rows_bang(ds.dragSource).includes(tgt))) {
  log("drop/row:abort", {reason: "target-in-source-subtree"});
} else {
  log("drop/row:proceeding", {target: row_desc_bang(tgt), source: row_desc_bang(ds.dragSource), position: ds.dropPosition});
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!($$bc$equiv(ds.dropPosition, "into-empty-pinned"))) && (!($$bc$equiv(ds.dropPosition, "into-empty-panel")))) : _logical))(ds.dropPosition))) {
    execute_drop(ds.dragSource, tgt, ds.dropPosition);
  } else {
    log("drop/row:abort", {reason: "no-or-empty-zone-position", dropPosition: ds.dropPosition});
  }
}
return clear_drop_indicator(); }); };
  const setup_pinned_container_drop = (container) => { container.addEventListener("dragover", (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(row_pinned_p(ds.dragSource))) && same_node_p(e.target, container)) : _logical))(ds.dragSource))) {
  const last_row = (() => { const __a____scope__13__1__4__1__38__3__4__3__2__1__2__1__0 = Array.from(container.querySelectorAll(".gjoa-tab-row:not([hidden])")); const __n____scope__13__1__4__1__38__3__4__3__2__1__2__1__3 = __a____scope__13__1__4__1__38__3__4__3__2__1__2__1__0.length; return __a____scope__13__1__4__1__38__3__4__3__2__1__2__1__0[(__n____scope__13__1__4__1__38__3__4__3__2__1__2__1__3 - 1)]; })();
  e.preventDefault();
  (e.dataTransfer.dropEffect = "move");
  if (((_truthy) => _truthy !== false && _truthy != null)(last_row)) {
    (ds.dropTarget = last_row);
    (ds.dropPosition = "after");
    return show_drop_indicator(last_row, "after");
  } else {
    (ds.dropTarget = container);
    return (ds.dropPosition = "into-empty-pinned");
  }
} });
return container.addEventListener("drop", (e) => { log("drop/pinnedContainer:fired", {hasDragSource: ((_truthy) => _truthy !== false && _truthy != null)(ds.dragSource), srcPinned: row_pinned_p(ds.dragSource)});
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(row_pinned_p(ds.dragSource))) && ((_logical) => (_logical !== false && _logical != null ? _logical : same_node_p(ds.dropTarget, container)))(same_node_p(e.target, container))) : _logical))(ds.dragSource))) {
  return handle_container_drop(e, container, (_pct1) => gBrowser.pinTab(_pct1));
} }); };
  const setup_panel_drop = (p) => { p.addEventListener("dragover", (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? _logical : same_node_p(e.target, state.spacer)))(same_node_p(e.target, p)) : _logical))(ds.dragSource))) {
  const src_pinned = row_pinned_p(ds.dragSource);
  const anchor = {v: null};
  if (((_truthy) => _truthy !== false && _truthy != null)(src_pinned)) {
    (anchor.v = p.querySelector(("".concat(".gjoa-tab-row:last-of-type, ", ".gjoa-group-row:last-of-type"))));
  } else {
    const src_subtree = new Set(subtree_rows_bang(ds.dragSource));
    const panel_rows = Array.from(p.querySelectorAll(".gjoa-tab-row, .gjoa-group-row"));
    (() => { let i = (() => { const panel_count = panel_rows.length; return (panel_count - 1); })(); while (true) {
    if ((i >= 0)) {  const candidate = panel_rows[i]; if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(level_of_row_bang(candidate), 0)) && (!((_truthy) => _truthy !== false && _truthy != null)(src_subtree.has(candidate)))))) { return (anchor.v = candidate); } else { const _recur_0 = (i - 1); i = _recur_0; continue; } } else { return null; }
  } })();
  }
  e.preventDefault();
  (e.dataTransfer.dropEffect = "move");
  if (((_truthy) => _truthy !== false && _truthy != null)(anchor.v)) {
    (ds.dropTarget = anchor.v);
    (ds.dropPosition = "after");
    return show_drop_indicator(anchor.v, "after");
  } else {
    (ds.dropTarget = ((_logical) => (_logical !== false && _logical != null ? p : _logical))(src_pinned));
    return (ds.dropPosition = "into-empty-panel");
  }
} });
return p.addEventListener("drop", (e) => { log("drop/panel:fired", {eventTargetIsPanel: same_node_p(e.target, p), eventTargetIsSpacer: same_node_p(e.target, state.spacer), hasDragSource: ((_truthy) => _truthy !== false && _truthy != null)(ds.dragSource)});
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : same_node_p(ds.dropTarget, p)))(same_node_p(e.target, state.spacer))))(same_node_p(e.target, p)) : _logical))(ds.dragSource))) {
  return handle_container_drop(e, p, (_pct1) => { if (((_truthy) => _truthy !== false && _truthy != null)(_pct1.pinned)) {
  return gBrowser.unpinTab(_pct1);
} });
} }); };
  return {setupDrag: setup_drag, setupPinnedContainerDrop: setup_pinned_container_drop, setupPanelDrop: setup_panel_drop};
}

}

{
const $$bc$equiv = $$bc.equivV;

build_context_menu_bang = function(deps) {
  const $beagle$binding$0 = deps;
  let startRename = $beagle$binding$0["startRename"];
  let toggleCollapse = $beagle$binding$0["toggleCollapse"];
  let createGroupRow = $beagle$binding$0["createGroupRow"];
  let setCursor = $beagle$binding$0["setCursor"];
  let updateVisibility = $beagle$binding$0["updateVisibility"];
  let scheduleTreeResync = $beagle$binding$0["scheduleTreeResync"];
  let scheduleSave = $beagle$binding$0["scheduleSave"];
  const menu = (() => { const __e____scope__3__1__4__1__5__1__0 = document.createXULElement("menupopup"); (__e____scope__3__1__4__1__5__1__0.id = "gjoa-tab-menu");
return __e____scope__3__1__4__1__5__1__0; })();
  const rename_item = (() => { const __item____scope__3__1__4__2__1__2__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__1__2__1__0.setAttribute("label", "Rename Tab");
__item____scope__3__1__4__2__1__2__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab)) {
  const row = row_of.get(state.contextTab);
  if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
    return startRename(row);
  }
} });
return __item____scope__3__1__4__2__1__2__1__0; })();
  const collapse_item = (() => { const __item____scope__3__1__4__2__1__5__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__1__5__1__0.setAttribute("label", "Collapse");
__item____scope__3__1__4__2__1__5__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab)) {
  const row = row_of.get(state.contextTab);
  if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
    return toggleCollapse(row);
  }
} });
return __item____scope__3__1__4__2__1__5__1__0; })();
  const create_group_item = (() => { const __item____scope__3__1__4__2__1__8__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__1__8__1__0.setAttribute("label", "Create Group");
__item____scope__3__1__4__2__1__8__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab)) {
  const row = row_of.get(state.contextTab);
  if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
    const tab_level = level_of_row_bang(row);
    const grp = createGroupRow("New Group", tab_level);
    row.before(grp);
    const ctx = state.contextTab;
    const sel = ((_logical) => (_logical !== false && _logical != null ? _logical : []))(gBrowser.selectedTabs);
    const adoptees = (((_truthy) => _truthy !== false && _truthy != null)(((sel.length > 1) && sel.includes(ctx))) ? sel : [ctx]);
    const gid = grp._group.id;
    adoptees.forEach((t) => (tree_data_bang(t).parentId = gid));
    scheduleTreeResync();
    setCursor(grp);
    updateVisibility();
    scheduleSave();
    return startRename(grp);
  }
} });
return __item____scope__3__1__4__2__1__8__1__0; })();
  const close_kids_item = (() => { const __item____scope__3__1__4__2__1__11__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__1__11__1__0.setAttribute("label", "Close Children");
__item____scope__3__1__4__2__1__11__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab)) {
  const row = row_of.get(state.contextTab);
  if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
    const kids = subtree_rows_bang(row).slice(1);
    const kid_count = kids.length;
    return (() => { let i = (kid_count - 1); while (true) {
    if ((i >= 0)) { (() => { const k = kids[i]; return (((_truthy) => _truthy !== false && _truthy != null)(k._tab) ? gBrowser.removeTab(k._tab) : k.remove()); })(); const _recur_0 = (i - 1); i = _recur_0; continue; } else { return null; }
  } })();
  }
} });
return __item____scope__3__1__4__2__1__11__1__0; })();
  const split_view_item = (() => { const __item____scope__3__1__4__2__1__14__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__1__14__1__0.setAttribute("label", "Add Split View");
__item____scope__3__1__4__2__1__14__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab)) {
  (TabContextMenu.contextTab = state.contextTab);
  (TabContextMenu.contextTabs = [state.contextTab]);
  if (((_truthy) => _truthy !== false && _truthy != null)(TabContextMenu.moveTabsToSplitView)) {
    return TabContextMenu.moveTabsToSplitView();
  }
} });
return __item____scope__3__1__4__2__1__14__1__0; })();
  const reload_item = (() => { const __item____scope__3__1__4__2__1__17__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__1__17__1__0.setAttribute("label", "Reload Tab");
__item____scope__3__1__4__2__1__17__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab)) {
  return gBrowser.reloadTab(state.contextTab);
} });
return __item____scope__3__1__4__2__1__17__1__0; })();
  const mute_item = (() => { const __item____scope__3__1__4__2__1__20__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__1__20__1__0.setAttribute("label", "Mute Tab");
__item____scope__3__1__4__2__1__20__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab)) {
  return state.contextTab.toggleMuteAudio();
} });
return __item____scope__3__1__4__2__1__20__1__0; })();
  const pin_item = (() => { const __item____scope__3__1__4__2__1__23__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__1__23__1__0.setAttribute("label", "Pin Tab");
__item____scope__3__1__4__2__1__23__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab)) {
  const t = state.contextTab;
  return (((_truthy) => _truthy !== false && _truthy != null)(t.pinned) ? gBrowser.unpinTab(t) : gBrowser.pinTab(t));
} });
return __item____scope__3__1__4__2__1__23__1__0; })();
  const duplicate_item = (() => { const __item____scope__3__1__4__2__1__26__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__1__26__1__0.setAttribute("label", "Duplicate Tab");
__item____scope__3__1__4__2__1__26__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab)) {
  return gBrowser.duplicateTab(state.contextTab);
} });
return __item____scope__3__1__4__2__1__26__1__0; })();
  const bookmark_item = (() => { const __item____scope__3__1__4__2__1__29__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__1__29__1__0.setAttribute("label", "Bookmark Tab");
__item____scope__3__1__4__2__1__29__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab)) {
  if (((_truthy) => _truthy !== false && _truthy != null)(PlacesCommandHook.bookmarkTabs)) {
    return PlacesCommandHook.bookmarkTabs([state.contextTab]);
  }
} });
return __item____scope__3__1__4__2__1__29__1__0; })();
  const move_to_window_item = (() => { const __item____scope__3__1__4__2__1__32__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__1__32__1__0.setAttribute("label", "Move to New Window");
__item____scope__3__1__4__2__1__32__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab)) {
  return gBrowser.replaceTabWithWindow(state.contextTab);
} });
return __item____scope__3__1__4__2__1__32__1__0; })();
  const copy_link_item = (() => { const __item____scope__3__1__4__2__1__35__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__1__35__1__0.setAttribute("label", "Copy Link");
__item____scope__3__1__4__2__1__35__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab)) {
  const url = (() => { const some_thread____0 = state.contextTab; if ((some_thread____0 == null)) {
  return null;
} else {
  const some_thread____1 = some_thread____0.linkedBrowser;
  if ((some_thread____1 == null)) {
    return null;
  } else {
    const some_thread____2 = some_thread____1.currentURI;
    return ((some_thread____2 == null) ? null : some_thread____2.spec);
  }
} })();
  if (((_truthy) => _truthy !== false && _truthy != null)(url)) {
    const cid = "@mozilla.org/widget/clipboardhelper;1";
    const helper = Reflect.get(Cc, cid).getService(Ci.nsIClipboardHelper);
    return helper.copyString(url);
  }
} });
return __item____scope__3__1__4__2__1__35__1__0; })();
  const close_item = (() => { const __item____scope__3__1__4__2__1__38__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__1__38__1__0.setAttribute("label", "Close Tab");
__item____scope__3__1__4__2__1__38__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab)) {
  return gBrowser.removeTab(state.contextTab);
} });
return __item____scope__3__1__4__2__1__38__1__0; })();
  const reopen_item = (() => { const __item____scope__3__1__4__2__1__41__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__1__41__1__0.setAttribute("label", "Reopen Closed Tab");
__item____scope__3__1__4__2__1__41__1__0.addEventListener("command", () => undoCloseTab());
return __item____scope__3__1__4__2__1__41__1__0; })();
  menu.append(rename_item, collapse_item, create_group_item, close_kids_item, document.createXULElement("menuseparator"), split_view_item, reload_item, mute_item, pin_item, duplicate_item, document.createXULElement("menuseparator"), bookmark_item, copy_link_item, move_to_window_item, document.createXULElement("menuseparator"), close_item, reopen_item);
  menu.addEventListener("popupshowing", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab)) {
  const row = row_of.get(state.contextTab);
  const has = ((_logical) => (_logical !== false && _logical != null ? has_children_bang(row) : _logical))(row);
  (collapse_item.hidden = (!((_truthy) => _truthy !== false && _truthy != null)(has)));
  (close_kids_item.hidden = (!((_truthy) => _truthy !== false && _truthy != null)(has)));
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? row : _logical))(has))) {
    const d = data_of_bang(row);
    if (((_truthy) => _truthy !== false && _truthy != null)(d)) {
      collapse_item.setAttribute("label", (((_truthy) => _truthy !== false && _truthy != null)(d.collapsed) ? "Expand" : "Collapse"));
    }
  }
  mute_item.setAttribute("label", (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab.hasAttribute("muted")) ? "Unmute Tab" : "Mute Tab"));
  pin_item.setAttribute("label", (((_truthy) => _truthy !== false && _truthy != null)(state.contextTab.pinned) ? "Unpin Tab" : "Pin Tab"));
  return (split_view_item.hidden = ((_truthy) => _truthy !== false && _truthy != null)(state.contextTab.splitview));
} });
  document.getElementById("mainPopupSet").appendChild(menu);
  return menu;
}

build_group_context_menu_bang = function(deps) {
  const $beagle$binding$0 = deps;
  let startRename = $beagle$binding$0["startRename"];
  let toggleCollapse = $beagle$binding$0["toggleCollapse"];
  let syncGroupRow = $beagle$binding$0["syncGroupRow"];
  let updateVisibility = $beagle$binding$0["updateVisibility"];
  let scheduleSave = $beagle$binding$0["scheduleSave"];
  const menu = (() => { const __e____scope__4__1__4__1__5__1__0 = document.createXULElement("menupopup"); (__e____scope__4__1__4__1__5__1__0.id = "gjoa-group-menu");
return __e____scope__4__1__4__1__5__1__0; })();
  const rename_item = (() => { const __item____scope__4__1__4__2__1__2__1__0 = document.createXULElement("menuitem"); __item____scope__4__1__4__2__1__2__1__0.setAttribute("label", "Rename Group");
__item____scope__4__1__4__2__1__2__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextGroupRow)) {
  return startRename(state.contextGroupRow);
} });
return __item____scope__4__1__4__2__1__2__1__0; })();
  const collapse_item = (() => { const __item____scope__4__1__4__2__1__5__1__0 = document.createXULElement("menuitem"); __item____scope__4__1__4__2__1__5__1__0.setAttribute("label", "Collapse");
__item____scope__4__1__4__2__1__5__1__0.addEventListener("command", () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.contextGroupRow)) {
  return toggleCollapse(state.contextGroupRow);
} });
return __item____scope__4__1__4__2__1__5__1__0; })();
  const close_group_item = (() => { const __item____scope__4__1__4__2__1__8__1__0 = document.createXULElement("menuitem"); __item____scope__4__1__4__2__1__8__1__0.setAttribute("label", "Close Group");
__item____scope__4__1__4__2__1__8__1__0.addEventListener("command", () => { const row = state.contextGroupRow;
if (((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____3 = row; return ((some_thread____3 == null) ? null : some_thread____3._group); })())) {
  const my_level = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(row._group.level);
  const group_id = row._group.id;
  Array.from(gBrowser.tabs).forEach((_pct1) => { const td = tree_data_bang(_pct1);
if (($$bc$equiv(td.parentId, group_id))) {
  return (td.parentId = null);
} });
  (() => { function walk(nxt) { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(nxt, state.spacer))) : _logical))(nxt))) {
  const lv = level_of_row_bang(nxt);
  if ((lv > my_level)) {
    if (((_truthy) => _truthy !== false && _truthy != null)(nxt._group)) {
      (nxt._group.level = (() => { const nxt_level = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(nxt._group.level); return Math.max(0, (nxt_level - 1)); })());
      syncGroupRow(nxt);
    }
    return walk(nxt.nextElementSibling);
  }
} } return walk(row.nextElementSibling); })();
  row.remove();
  updateVisibility();
  return scheduleSave();
} });
return __item____scope__4__1__4__2__1__8__1__0; })();
  const close_tabs_item = (() => { const __item____scope__4__1__4__2__1__11__1__0 = document.createXULElement("menuitem"); __item____scope__4__1__4__2__1__11__1__0.setAttribute("label", "Close Tabs in Group");
__item____scope__4__1__4__2__1__11__1__0.addEventListener("command", () => { const row = state.contextGroupRow;
if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
  const tabs_in_group = subtree_rows_bang(row).slice(1).filter((_pct1) => _pct1._tab).map((_pct1) => _pct1._tab);
  return (() => { let i = (() => { const group_tab_count = tabs_in_group.length; return (group_tab_count - 1); })(); while (true) {
    if ((i >= 0)) { gBrowser.removeTab(tabs_in_group[i]); const _recur_0 = (i - 1); i = _recur_0; continue; } else { return null; }
  } })();
} });
return __item____scope__4__1__4__2__1__11__1__0; })();
  const move_to_window_item = (() => { const __item____scope__4__1__4__2__1__14__1__0 = document.createXULElement("menuitem"); __item____scope__4__1__4__2__1__14__1__0.setAttribute("label", "Move Tabs to New Window");
__item____scope__4__1__4__2__1__14__1__0.addEventListener("command", () => { const row = state.contextGroupRow;
if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
  const tabs_in_group = subtree_rows_bang(row).slice(1).filter((_pct1) => _pct1._tab).map((_pct1) => _pct1._tab);
  if (((_truthy) => _truthy !== false && _truthy != null)(tabs_in_group.length)) {
    return (($$bc$equiv(typeof gBrowser.replaceTabsWithWindow, "function")) ? gBrowser.replaceTabsWithWindow(tabs_in_group) : gBrowser.replaceTabWithWindow(tabs_in_group[0]));
  }
} });
return __item____scope__4__1__4__2__1__14__1__0; })();
  menu.append(rename_item, collapse_item, close_tabs_item, document.createXULElement("menuseparator"), close_group_item, move_to_window_item);
  menu.addEventListener("popupshowing", () => { const row = state.contextGroupRow;
if (((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____4 = row; return ((some_thread____4 == null) ? null : some_thread____4._group); })())) {
  const has = has_children_bang(row);
  (collapse_item.hidden = (!has));
  if (has) {
    collapse_item.setAttribute("label", (((_truthy) => _truthy !== false && _truthy != null)(row._group.collapsed) ? "Expand" : "Collapse"));
  }
  (close_tabs_item.hidden = (!has));
  return (move_to_window_item.hidden = (!has));
} });
  document.getElementById("mainPopupSet").appendChild(menu);
  return menu;
}

build_panel_context_menu_bang = function(deps) {
  const $beagle$binding$0 = deps;
  let createGroupRow = $beagle$binding$0["createGroupRow"];
  let startRename = $beagle$binding$0["startRename"];
  let setCursor = $beagle$binding$0["setCursor"];
  let updateVisibility = $beagle$binding$0["updateVisibility"];
  let scheduleSave = $beagle$binding$0["scheduleSave"];
  const menu = (() => { const __e____scope__5__1__4__1__5__1__0 = document.createXULElement("menupopup"); (__e____scope__5__1__4__1__5__1__0.id = "gjoa-panel-menu");
return __e____scope__5__1__4__1__5__1__0; })();
  const new_group_item = (() => { const __item____scope__5__1__4__2__1__2__1__0 = document.createXULElement("menuitem"); __item____scope__5__1__4__2__1__2__1__0.setAttribute("label", "New Tab Group");
__item____scope__5__1__4__2__1__2__1__0.addEventListener("command", () => { const grp = createGroupRow("New Group", 0);
state.panel.insertBefore(grp, state.spacer);
setCursor(grp);
updateVisibility();
scheduleSave();
return startRename(grp); });
return __item____scope__5__1__4__2__1__2__1__0; })();
  const new_tab_item = (() => { const __item____scope__5__1__4__2__1__5__1__0 = document.createXULElement("menuitem"); __item____scope__5__1__4__2__1__5__1__0.setAttribute("label", "New Tab");
__item____scope__5__1__4__2__1__5__1__0.addEventListener("command", () => (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(typeof BrowserCommands.openTab, "function")) : _logical))(BrowserCommands.openTab) : _logical))(BrowserCommands)) ? BrowserCommands.openTab() : gBrowser.addTab("about:newtab", {triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(), inBackground: false})));
return __item____scope__5__1__4__2__1__5__1__0; })();
  const undo_close_item = (() => { const __item____scope__5__1__4__2__1__8__1__0 = document.createXULElement("menuitem"); __item____scope__5__1__4__2__1__8__1__0.setAttribute("label", "Undo Close Tab");
__item____scope__5__1__4__2__1__8__1__0.addEventListener("command", () => { if (($$bc$equiv(typeof undoCloseTab, "function"))) {
  return undoCloseTab();
} });
return __item____scope__5__1__4__2__1__8__1__0; })();
  menu.append(new_tab_item, new_group_item, document.createXULElement("menuseparator"), undo_close_item);
  document.getElementById("mainPopupSet").appendChild(menu);
  return menu;
}

}

{
const $$bc$equiv = $$bc.equivV;

function maybe_focus_urlbar_bang() {
  const win = gBrowser.ownerGlobal;
  if (((_truthy) => _truthy !== false && _truthy != null)(win)) {
    return win.setTimeout(() => (() => { try {
    const spec = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____0 = gBrowser; if ((some_thread____0 == null)) {
  return null;
} else {
  const some_thread____1 = some_thread____0.selectedBrowser;
  if ((some_thread____1 == null)) {
    return null;
  } else {
    const some_thread____2 = some_thread____1.currentURI;
    return ((some_thread____2 == null) ? null : some_thread____2.spec);
  }
} })());
  const u = win.gURLBar;
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(u.value), "")) : _logical))(((_logical) => (_logical !== false && _logical != null ? _logical : (($$bc$equiv(spec, "about:newtab")) || (($$bc$equiv(spec, "about:home")) || ($$bc$equiv(spec, "about:blank"))))))(spec.startsWith("chrome://gjoa-newtab"))) : _logical))(u))) {
    u.focus();
    return u.select();
  }
  } catch (__e) {
    return null;
  } })(), 0);
  }
}

function find_prev_matching(tabs_arr, idx, pred) {
  return (() => { let i = idx; while (true) {
    if ((i < 0)) { return null; } else if (((_truthy) => _truthy !== false && _truthy != null)(pred(tabs_arr[i]))) { return tabs_arr[i]; } else { const _recur_0 = (i - 1); i = _recur_0; continue; }
  } })();
}

function renest_descendants_bang(n, expected, old_parent_id, new_id) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(n, state.spacer))) : _logical))(n))) {
    if (((_truthy) => _truthy !== false && _truthy != null)(n._tab)) {
      const ntd = tree_data_bang(n._tab);
      if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(ntd.parentId, old_parent_id)) : _logical))(expected.has(ntd.id)))) {
        (ntd.parentId = new_id);
      }
    }
    return renest_descendants_bang(n.nextElementSibling, expected, old_parent_id, new_id);
  }
}

function reparent_children_bang(next, closing_id, new_parent_id, my_level, rows) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(next, state.spacer))) : _logical))(next))) {
    return ((((_truthy) => _truthy !== false && _truthy != null)(next._tab)) ? ((level_of_bang(next._tab) > my_level) ? (() => { const ntd = tree_data_bang(next._tab);
if (($$bc$equiv(ntd.parentId, closing_id))) {
  (ntd.parentId = new_parent_id);
  rows.syncTabRow(next._tab);
}
return reparent_children_bang(next.nextElementSibling, closing_id, new_parent_id, my_level, rows); })() : null) : (((_truthy) => _truthy !== false && _truthy != null)(next._group)) ? (() => { const g_lv = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(next._group.level); if ((g_lv > my_level)) {
  (next._group.level = Math.max(0, (g_lv - 1)));
  rows.syncGroupRow(next);
  return reparent_children_bang(next.nextElementSibling, closing_id, new_parent_id, my_level, rows);
} })() : reparent_children_bang(next.nextElementSibling, closing_id, new_parent_id, my_level, rows));
  }
}

function is_fx_pinned(tab) {
  return ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const ptc = ((_logical) => (_logical !== false && _logical != null ? _logical : gBrowser.pinnedTabsContainer))((() => { const some_thread____3 = gBrowser; if ((some_thread____3 == null)) {
  return null;
} else {
  const some_thread____4 = some_thread____3.tabContainer;
  return ((some_thread____4 == null) ? null : some_thread____4.pinnedTabsContainer);
} })()); return (((_truthy) => _truthy !== false && _truthy != null)(ptc) && ($$bc$equiv(tab.parentNode, ptc))); })()))(tab.pinned);
}

function place_row_pinned_or_unpinned_bang(tab, row, tabs_arr, my_idx) {
  if (is_fx_pinned(tab)) {
    const prev_tab = find_prev_matching(tabs_arr, (my_idx - 1), (_pct1) => is_fx_pinned(_pct1));
    if (((_truthy) => _truthy !== false && _truthy != null)(prev_tab)) {
      const prev_row = row_of.get(prev_tab);
      if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!($$bc$equiv(prev_row, row))) && (!($$bc$equiv(prev_row.nextElementSibling, row)))) : _logical))(prev_row))) {
        prev_row.after(row);
        return true;
      } else {
        return false;
      }
    } else {
      if ((!($$bc$equiv(state.pinnedContainer.firstChild, row)))) {
        state.pinnedContainer.insertBefore(row, state.pinnedContainer.firstChild);
        return true;
      } else {
        return false;
      }
    }
  } else {
    const prev_tab = find_prev_matching(tabs_arr, (my_idx - 1), (_pct1) => (!is_fx_pinned(_pct1)));
    if (((_truthy) => _truthy !== false && _truthy != null)(prev_tab)) {
      const prev_row = row_of.get(prev_tab);
      if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(prev_row, row))) : _logical))(prev_row))) {
        const prev_subtree = subtree_rows_bang(prev_row);
        const subtree_count = prev_subtree.length;
        const anchor = prev_subtree[(subtree_count - 1)];
        if ((!($$bc$equiv(anchor.nextElementSibling, row)))) {
          anchor.after(row);
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      if ((!($$bc$equiv(state.panel.firstChild, row)))) {
        state.panel.insertBefore(row, state.panel.firstChild);
        return true;
      } else {
        return false;
      }
    }
  }
}

function place_row_in_firefox_order_bang(tab, row) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(row)) || (!((_truthy) => _truthy !== false && _truthy != null)(state.panel))))) {
    return false;
  } else {
    const tabs_arr = Array.from(gBrowser.tabs);
    const my_idx = tabs_arr.indexOf(tab);
    if ((my_idx < 0)) {
      return false;
    } else {
      const my_parent_id = (() => { const some_thread____5 = tree_of.get(tab); return ((some_thread____5 == null) ? null : some_thread____5.parentId); })();
      const grp_row = (($$bc$equiv(typeof my_parent_id, "string")) ? (() => { return group_by_id(my_parent_id); })() : null);
      if (((_truthy) => _truthy !== false && _truthy != null)(grp_row)) {
        const prev_sib_tab = find_prev_matching(tabs_arr, (my_idx - 1), (_pct1) => { const to = tree_of.get(_pct1);
return ((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(to.parentId, my_parent_id)) : _logical))(to); });
        if (((_truthy) => _truthy !== false && _truthy != null)(prev_sib_tab)) {
          const prev_row = row_of.get(prev_sib_tab);
          if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(prev_row, row))) : _logical))(prev_row))) {
            const st = subtree_rows_bang(prev_row);
            const anchor = (() => { const __a____scope__9__4__3__2__3__2__2__2__2__2__2__1__5__1__0 = st; const __n____scope__9__4__3__2__3__2__2__2__2__2__2__1__5__1__3 = __a____scope__9__4__3__2__3__2__2__2__2__2__2__1__5__1__0.length; return __a____scope__9__4__3__2__3__2__2__2__2__2__2__1__5__1__0[(__n____scope__9__4__3__2__3__2__2__2__2__2__2__1__5__1__3 - 1)]; })();
            if ((!($$bc$equiv(anchor.nextElementSibling, row)))) {
              anchor.after(row);
              return true;
            } else {
              return false;
            }
          } else {
            return false;
          }
        } else {
          if ((!($$bc$equiv(grp_row.nextElementSibling, row)))) {
            grp_row.after(row);
            return true;
          } else {
            return false;
          }
        }
      } else {
        return place_row_pinned_or_unpinned_bang(tab, row, tabs_arr, my_idx);
      }
    }
  }
}

function place_restored_row_bang(row, parent, prev_sibling_id) {
  const parent_row = ((_logical) => (_logical !== false && _logical != null ? row_of.get(parent) : _logical))(parent);
  const sib = ((_logical) => (_logical !== false && _logical != null ? tab_by_id(prev_sibling_id) : _logical))(prev_sibling_id);
  const sib_row = ((_logical) => (_logical !== false && _logical != null ? row_of.get(sib) : _logical))(sib);
  const sib_parent = ((_logical) => (_logical !== false && _logical != null ? parent_of_tab_bang(sib) : _logical))(sib);
  const same_parent = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(tree_data_bang(parent).id, tree_data_bang(sib_parent).id)) : _logical))(sib_parent) : _logical))(parent)))(((!((_truthy) => _truthy !== false && _truthy != null)(parent)) && (!((_truthy) => _truthy !== false && _truthy != null)(sib_parent))));
  return ((((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? same_parent : _logical))(sib_row))) ? (() => { const st = subtree_rows_bang(sib_row); return ((() => { const __a____scope__10__4__2__2__2__1__1__0 = st; const __n____scope__10__4__2__2__2__1__1__3 = __a____scope__10__4__2__2__2__1__1__0.length; return __a____scope__10__4__2__2__2__1__1__0[(__n____scope__10__4__2__2__2__1__1__3 - 1)]; })()).after(row); })() : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? parent_row : _logical))(prev_sibling_id))) ? (() => { const st = subtree_rows_bang(parent_row); return ((() => { const __a____scope__10__4__2__4__2__1__1__0 = st; const __n____scope__10__4__2__4__2__1__1__3 = __a____scope__10__4__2__4__2__1__1__0.length; return __a____scope__10__4__2__4__2__1__1__0[(__n____scope__10__4__2__4__2__1__1__3 - 1)]; })()).after(row); })() : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(parent_row)) : _logical))(prev_sibling_id))) ? state.panel.insertBefore(row, state.spacer) : (((_truthy) => _truthy !== false && _truthy != null)(parent_row)) ? parent_row.after(row) : state.panel.insertBefore(row, state.panel.firstChild));
}

make_events_bang = function(deps) {
  const $beagle$binding$0 = deps;
  let rows = $beagle$binding$0["rows"];
  let vim = $beagle$binding$0["vim"];
  let scheduleSave = $beagle$binding$0["scheduleSave"];
  let spaces = $beagle$binding$0["spaces"];
  const log = create_logger_bang("tabs");
  const pop_closed_entry = (url) => { if (((_truthy) => _truthy !== false && _truthy != null)(url)) {
  return (() => { let i = (() => { const closed_count = closed_tabs.length; return (closed_count - 1); })(); while (true) {
    if ((i < 0)) { return null; } else if (($$bc$equiv(closed_tabs[i].url, url))) { return closed_tabs.splice(i, 1)[0]; } else { const _recur_0 = (i - 1); i = _recur_0; continue; }
  } })();
} };
  const apply_saved_to_tab = (tab, prior) => { const td = tree_data_bang(tab);
if ((!((_truthy) => _truthy !== false && _truthy != null)(td.appliedSavedState))) {
  (td.appliedSavedState = true);
  (td.id = ((_logical) => (_logical !== false && _logical != null ? _logical : td.id))(prior.id));
  (td.parentId = ((!($$bc$equiv(prior.parentId, undefined))) ? prior.parentId : null));
  (td.name = prior.name);
  (td.state = prior.state);
  (td.collapsed = ((_truthy) => _truthy !== false && _truthy != null)(prior.collapsed));
  pin_tab_id(tab, td.id);
  if (((_truthy) => _truthy !== false && _truthy != null)(log)) {
    log("applySavedToTab", {id: td.id, parentId: td.parentId, priorId: prior.id, priorParentId: prior.parentId});
  }
  return rows.scheduleTreeResync();
} };
  const remember_closed_tab = (tab, td) => { const url = tab_url(tab);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(url, "about:blank"))) : _logical))(url))) {
  const row = row_of.get(tab);
  if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
    const parent = parent_of_tab_bang(tab);
    const my_level = level_of_bang(tab);
    const prev_sib_id = (() => { let r = row.previousElementSibling; while (true) {
    if ((r == null)) { return null; } else if ((!((_truthy) => _truthy !== false && _truthy != null)(r._tab))) { const _recur_0 = r.previousElementSibling; r = _recur_0; continue; } else if ((level_of_bang(r._tab) < my_level)) { return null; } else if ((level_of_bang(r._tab) === my_level)) { return tree_data_bang(r._tab).id; } else { const _recur_0 = r.previousElementSibling; r = _recur_0; continue; }
  } })();
    const descendant_ids = (() => { const out = []; return (() => { let n = row.nextElementSibling; while (true) {
    if (((_truthy) => _truthy !== false && _truthy != null)(((n == null) || ($$bc$equiv(n, state.spacer))))) { return out; } else if ((!((_truthy) => _truthy !== false && _truthy != null)(n._tab))) { const _recur_0 = n.nextElementSibling; n = _recur_0; continue; } else if ((level_of_bang(n._tab) <= my_level)) { return out; } else { out.push(tree_data_bang(n._tab).id); const _recur_0 = n.nextElementSibling; n = _recur_0; continue; }
  } })(); })();
    closed_tabs.push({url: url, id: ((_logical) => (_logical !== false && _logical != null ? _logical : 0))((() => { const some_thread____6 = td; return ((some_thread____6 == null) ? null : some_thread____6.id); })()), parentId: (((_truthy) => _truthy !== false && _truthy != null)(parent) ? (() => { return tree_data_bang(parent).id; })() : null), prevSiblingId: prev_sib_id, descendantIds: descendant_ids, name: (() => { const some_thread____7 = td; return ((some_thread____7 == null) ? null : some_thread____7.name); })(), state: (() => { const some_thread____8 = td; return ((some_thread____8 == null) ? null : some_thread____8.state); })(), collapsed: ((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____9 = td; return ((some_thread____9 == null) ? null : some_thread____9.collapsed); })())});
    if ((closed_tabs.length > CLOSED_MEMORY)) {
      return closed_tabs.shift();
    }
  }
} };
  const on_tab_open = (e) => { const tab = e.target;
const td = tree_data_bang(tab);
const spec = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____10 = tab; if ((some_thread____10 == null)) {
  return null;
} else {
  const some_thread____11 = some_thread____10.linkedBrowser;
  if ((some_thread____11 == null)) {
    return null;
  } else {
    const some_thread____12 = some_thread____11.currentURI;
    return ((some_thread____12 == null) ? null : some_thread____12.spec);
  }
} })());
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : spec.startsWith("about:sovereignty")))(spec.startsWith("about:gjoa"))))(spec.startsWith("about:home"))))(spec.startsWith("about:newtab"))))(spec.startsWith("chrome://gjoa/"))))(spec.startsWith("chrome://gjoa-newtab")))) {
  (() => { try {
    return gBrowser.setIcon(tab, "chrome://gjoa/content/gjoa.svg");
  } catch (__e) {
    return null;
  } })();
}
if (((_truthy) => _truthy !== false && _truthy != null)(spaces)) {
  const persisted = tab.getAttribute(SPACE_ATTR);
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? spaces.get(persisted) : _logical))(persisted))) {
    spaces.assignTab(tab, persisted);
  } else if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (persisted.length > 0) : _logical))(persisted))) {
    null;
  } else {
    spaces.assignTab(tab, spaces.activeId());
  }
}
const prior = pop_saved_for_tab(saved_tab_queue, {currentIdx: Array.from(gBrowser.tabs).indexOf(tab), pinnedId: read_pinned_id(tab), url: tab_url(tab), inSessionRestore: state.inSessionRestore, log: log});
if (((_truthy) => _truthy !== false && _truthy != null)(prior)) {
  const idx = Array.from(gBrowser.tabs).indexOf(tab);
  console.log(("".concat("gjoa-tabs: onTabOpen matched — tab[", idx, "] url=\"", tab_url(tab), "\" → saved id=", prior.id, " parentId=", prior.parentId, " origIdx=", prior._origIdx)));
  apply_saved_to_tab(tab, prior);
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? spaces.get(prior.spaceId) : _logical))(prior.spaceId) : _logical))(spaces))) {
    spaces.assignTab(tab, prior.spaceId);
  }
  const row = rows.createTabRow(tab);
  if (((_truthy) => _truthy !== false && _truthy != null)(tab.pinned)) {
    state.pinnedContainer.appendChild(row);
    (state.pinnedContainer.hidden = false);
  } else {
    state.panel.insertBefore(row, state.spacer);
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(vim.consumePendingCursorMove())) {
    vim.setCursor(row);
  }
  rows.updateVisibility();
  return scheduleSave();
} else {
  const position = Services.prefs.getCharPref("gjoa.tabs.newTabPosition", "sibling");
  const anchor = ((_logical) => (_logical !== false && _logical != null ? _logical : ((!($$bc$equiv(gBrowser.selectedTab, tab))) ? (() => { return gBrowser.selectedTab; })() : null)))(tab.owner);
  if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(position, "child")) && anchor))) {
    (td.parentId = tree_data_bang(anchor).id);
  }
  if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(position, "sibling")) && anchor))) {
    (td.parentId = tree_data_bang(anchor).parentId);
  }
  const row = rows.createTabRow(tab);
  if (((_truthy) => _truthy !== false && _truthy != null)(tab.pinned)) {
    state.pinnedContainer.appendChild(row);
    (state.pinnedContainer.hidden = false);
  } else {
    state.panel.insertBefore(row, state.spacer);
    place_row_in_firefox_order_bang(tab, row);
  }
  if (($$bc$equiv(position, "root"))) {
    const tabs_arr = Array.from(gBrowser.tabs);
    const tab_count = tabs_arr.length;
    const last_idx = (tab_count - 1);
    if ((!(tabs_arr.indexOf(tab) === last_idx))) {
      (() => { try {
    return gBrowser.moveTabTo(tab, {tabIndex: last_idx});
  } catch (__e) {
    return null;
  } })();
    }
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(vim.consumePendingCursorMove())) {
    vim.setCursor(row);
  }
  rows.scheduleTreeResync();
  return scheduleSave();
} };
  const on_tab_close = (e) => { const tab = e.target;
const row = row_of.get(tab);
if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
  const td = tree_data_bang(tab);
  remember_closed_tab(tab, td);
  const closing_id = td.id;
  const new_parent_id = ((!($$bc$equiv(td.parentId, undefined))) ? td.parentId : null);
  const my_level = level_of_bang(tab);
  reparent_children_bang(row.nextElementSibling, closing_id, new_parent_id, my_level, rows);
  if (($$bc$equiv(state.cursor, row))) {
    ((_logical) => (_logical !== false && _logical != null ? _logical : vim.moveCursor(-1)))(vim.moveCursor(1));
  }
  row.remove();
}
row_of.delete(tab);
if ((!((_truthy) => _truthy !== false && _truthy != null)(state.pinnedContainer.querySelector(".gjoa-tab-row")))) {
  (state.pinnedContainer.hidden = true);
}
rows.updateVisibility();
return scheduleSave(); };
  const cascade_pin_change = (e, drop_parent_p, kid_pred, kid_action, prep_row, move_row, post_move) => { const tab = e.target;
const row = row_of.get(tab);
if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
  const td = tree_data_bang(tab);
  if (((_truthy) => _truthy !== false && _truthy != null)(drop_parent_p(td))) {
    (td.parentId = null);
  }
  const kids = [];
  Array.from(gBrowser.tabs).forEach((_pct1) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(tree_data_bang(_pct1).parentId, td.id)) : _logical))(kid_pred(_pct1)))) {
  return kids.push(_pct1);
} });
  kids.forEach(kid_action);
  prep_row(row);
  move_row(tab, row);
  rows.syncTabRow(tab);
  post_move();
  rows.updateVisibility();
  return scheduleSave();
} };
  const on_tab_pinned = (e) => cascade_pin_change(e, (_pct1) => ((!($$bc$equiv(_pct1.parentId, null))) && (($$bc$equiv(typeof _pct1.parentId, "string")) || (() => { const parent = tab_by_id(_pct1.parentId); return ((!((_truthy) => _truthy !== false && _truthy != null)(parent)) || (!((_truthy) => _truthy !== false && _truthy != null)(parent.pinned))); })())), (_pct1) => (!((_truthy) => _truthy !== false && _truthy != null)(_pct1.pinned)), (_pct1) => gBrowser.pinTab(_pct1), (_pct1) => _pct1.removeAttribute("style"), (tab, row) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(same_node_p(row.parentNode, state.pinnedContainer)))) {
  state.pinnedContainer.appendChild(row);
  return place_row_in_firefox_order_bang(tab, row);
} }, () => { (state.pinnedContainer.hidden = false);
return all_rows().forEach((_pct1) => rows.syncAnyRow(_pct1)); });
  const on_tab_unpinned = (e) => cascade_pin_change(e, (_pct1) => ((!($$bc$equiv(_pct1.parentId, null))) && (($$bc$equiv(typeof _pct1.parentId, "number")) && (() => { const parent = tab_by_id(_pct1.parentId); return ((_logical) => (_logical !== false && _logical != null ? parent.pinned : _logical))(parent); })())), (_pct1) => _pct1.pinned, (_pct1) => gBrowser.unpinTab(_pct1), (_pct1) => (_pct1.draggable = true), (tab, row) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(same_node_p(row.parentNode, state.panel)))) {
  state.panel.insertBefore(row, state.spacer);
  return place_row_in_firefox_order_bang(tab, row);
} }, () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(state.pinnedContainer.querySelector(".gjoa-tab-row")))) {
  return (state.pinnedContainer.hidden = true);
} });
  const on_tab_restoring = (e) => { const tab = e.target;
const url = tab_url(tab);
const idx = Array.from(gBrowser.tabs).indexOf(tab);
if (((_truthy) => _truthy !== false && _truthy != null)(log)) {
  log("onTabRestoring", {idx: idx, url: url, currentId: (() => { const some_thread____13 = tree_of.get(tab); return ((some_thread____13 == null) ? null : some_thread____13.id); })(), currentParentId: (() => { const some_thread____14 = tree_of.get(tab); return ((some_thread____14 == null) ? null : some_thread____14.parentId); })(), queueLen: saved_tab_queue.length});
}
const entry = pop_closed_entry(url);
if (((_truthy) => _truthy !== false && _truthy != null)(entry)) {
  const td = tree_data_bang(tab);
  (td.id = entry.id);
  (td.name = ((!($$bc$equiv(entry.name, undefined))) ? entry.name : null));
  (td.state = ((!($$bc$equiv(entry.state, undefined))) ? entry.state : null));
  (td.collapsed = ((!($$bc$equiv(entry.collapsed, undefined))) ? entry.collapsed : false));
  pin_tab_id(tab, td.id);
  (td.parentId = ((!($$bc$equiv(entry.parentId, undefined))) ? entry.parentId : null));
  const parent = tab_by_id(entry.parentId);
  const row = row_of.get(tab);
  if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
    place_restored_row_bang(row, parent, entry.prevSiblingId);
    if (((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____15 = entry; if ((some_thread____15 == null)) {
  return null;
} else {
  const some_thread____16 = some_thread____15.descendantIds;
  return ((some_thread____16 == null) ? null : some_thread____16.length);
} })())) {
      const expected = (() => { const s = new Set(); entry.descendantIds.forEach((_pct1) => s.add(_pct1));
return s; })();
      renest_descendants_bang(row.nextElementSibling, expected, ((!($$bc$equiv(entry.parentId, undefined))) ? entry.parentId : null), td.id);
    }
    rows.scheduleTreeResync();
  }
  rows.updateVisibility();
  return scheduleSave();
} else {
  const td = tree_data_bang(tab);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(td.appliedSavedState))) {
    const correction = pop_saved_by_url(saved_tab_queue, url);
    if (((_truthy) => _truthy !== false && _truthy != null)(correction)) {
      if (((_truthy) => _truthy !== false && _truthy != null)(log)) {
        log("onTabRestoring:correction", {idx: idx, url: url, savedId: correction.id, savedParentId: correction.parentId});
      }
      (td.id = ((_logical) => (_logical !== false && _logical != null ? _logical : td.id))(correction.id));
      (td.parentId = ((!($$bc$equiv(correction.parentId, undefined))) ? correction.parentId : null));
      (td.name = correction.name);
      (td.state = correction.state);
      (td.collapsed = ((_truthy) => _truthy !== false && _truthy != null)(correction.collapsed));
      (td.appliedSavedState = true);
      pin_tab_id(tab, td.id);
      rows.scheduleTreeResync();
      return scheduleSave();
    }
  }
} };
  const on_tab_select = () => { const sel = gBrowser.selectedTab;
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? sel : _logical))(spaces))) {
  const tab_space = spaces.spaceOf(sel);
  if ((!($$bc$equiv(tab_space, spaces.activeId())))) {
    spaces.setActive(tab_space);
  }
}
Array.from(gBrowser.tabs).forEach((_pct1) => { const row = row_of.get(_pct1);
if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
  return row.toggleAttribute("selected", _pct1.selected);
} });
const row = row_of.get(gBrowser.selectedTab);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(state.cursor)) : _logical))(row))) {
  row.scrollIntoView({block: "nearest", inline: "nearest"});
}
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(state.cursor, row))) : _logical))(row))) {
  vim.setCursor(row);
}
if (is_horizontal()) {
  rows.updateHorizontalGrid();
}
return maybe_focus_urlbar_bang(); };
  const on_tab_attr_modified = (_pct1) => rows.syncTabRow(_pct1.target);
  const on_tab_move = (e) => { const tab = e.target;
const row = row_of.get(tab);
if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
  const moved = place_row_in_firefox_order_bang(tab, row);
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(moving_tabs.has(tab))) : _logical))(moved))) {
    rows.scheduleTreeResync();
    return scheduleSave();
  }
} };
  const install = () => { const tc = gBrowser.tabContainer;
const orig = gBrowser.setDefaultIcon;
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(gBrowser.gjoaIconPatched)) : _logical))(orig))) {
  (gBrowser.gjoaIconPatched = true);
  (gBrowser.setDefaultIcon = (tab, uri) => { const spec = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____17 = uri; return ((some_thread____17 == null) ? null : some_thread____17.spec); })());
return (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(spec, "about:newtab")) || (($$bc$equiv(spec, "about:home")) || ($$bc$equiv(spec, "about:welcome"))))) ? (() => { try {
    return gBrowser.setIcon(tab, "chrome://gjoa/content/gjoa.svg");
  } catch (__e) {
    return null;
  } })() : orig.call(gBrowser, tab, uri)); });
}
tc.addEventListener("TabOpen", on_tab_open);
tc.addEventListener("TabClose", on_tab_close);
tc.addEventListener("TabSelect", on_tab_select);
tc.addEventListener("TabAttrModified", on_tab_attr_modified);
tc.addEventListener("TabMove", on_tab_move);
tc.addEventListener("SSTabRestoring", on_tab_restoring);
tc.addEventListener("TabPinned", on_tab_pinned);
tc.addEventListener("TabUnpinned", on_tab_unpinned);
const on_session_restored = () => { console.log("gjoa-tabs: sessionstore-windows-restored — final tree resync");
if (((_truthy) => _truthy !== false && _truthy != null)(log)) {
  log("sessionstore-windows-restored", {queueLen: saved_tab_queue.length, inSessionRestore: state.inSessionRestore});
}
(saved_tab_queue.length = 0);
(state.inSessionRestore = false);
rows.scheduleTreeResync();
return maybe_focus_urlbar_bang(); };
const on_manual_restore = () => { const alive_urls = (() => { const s = new Set(); Array.from(gBrowser.tabs).forEach((_pct1) => { const u = tab_url(_pct1);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(u, "about:blank"))) : _logical))(u))) {
  return s.add(u);
} });
return s; })();
(saved_tab_queue.length = 0);
state.lastLoadedNodes.forEach((_pct1, _pct2) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? alive_urls.has(_pct1.url) : _logical))(_pct1.url)))) {
  const entry = Object.assign({}, _pct1);
  (entry._origIdx = _pct2);
  return saved_tab_queue.push(entry);
} });
(state.inSessionRestore = true);
if (((_truthy) => _truthy !== false && _truthy != null)(log)) {
  return log("manualRestoreArmed", {queueLen: saved_tab_queue.length, queueIds: saved_tab_queue.map((_pct1) => _pct1.id)});
} };
Services.obs.addObserver(on_session_restored, "sessionstore-windows-restored");
Services.obs.addObserver(on_manual_restore, "sessionstore-initiating-manual-restore");
return () => { (() => { try {
    return Services.obs.removeObserver(on_session_restored, "sessionstore-windows-restored");
  } catch (__e) {
    return null;
  } })();
return (() => { try {
    return Services.obs.removeObserver(on_manual_restore, "sessionstore-initiating-manual-restore");
  } catch (__e) {
    return null;
  } })(); }; };
  return {install: install};
}

}

{
const $$bc$equiv = $$bc.equivV;

function compute_filtered(all_items, query, preserve, filter_fn) {
  if (($$bc$equiv(query, ""))) {
    return all_items.slice();
  } else {
    const matched_set = new Set();
    all_items.forEach((_pct1) => { if (((_truthy) => _truthy !== false && _truthy != null)((((_truthy) => _truthy !== false && _truthy != null)(filter_fn) ? filter_fn(_pct1, query) : (() => { const hay = ("".concat(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(_pct1.display), " ", ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(_pct1.secondary))).toLowerCase(); return hay.includes(query); })()))) {
  return matched_set.add(_pct1);
} });
    if ((!preserve)) {
      const qfirst = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(query.trim().toLowerCase().split(new RegExp("\\s+"))[0]);
      const title_rank = (it) => (((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(qfirst, ""))) && ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(it.display).toLowerCase().includes(qfirst))) ? 0 : 1);
      return all_items.filter((_pct1) => matched_set.has(_pct1)).sort((a, b) => (title_rank(a) - title_rank(b)));
    } else {
      const by_id = new Map();
      all_items.forEach((_pct1) => { if (((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(_pct1.id, null))) && (!($$bc$equiv(_pct1.id, undefined)))))) {
  return by_id.set(_pct1.id, _pct1);
} });
      const visible = new Set(matched_set);
      matched_set.forEach((_pct1) => (() => { let cur = _pct1; while (true) {
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!($$bc$equiv(cur.parentId, null))) && (!($$bc$equiv(cur.parentId, undefined)))) : _logical))(cur))) {  const p = by_id.get(cur.parentId); if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(visible.has(p))) : _logical))(p))) { visible.add(p); const _recur_0 = p; cur = _recur_0; continue; } else { return null; } } else { return null; }
  } })());
      return all_items.filter((_pct1) => visible.has(_pct1));
    }
  }
}

function is_direct_match(item, query) {
  if (($$bc$equiv(query, ""))) {
    return true;
  } else {
    const hay = ("".concat(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(item.display), " ", ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(item.secondary))).toLowerCase();
    return hay.includes(query);
  }
}

function clear_children(el) {
  if (((_truthy) => _truthy !== false && _truthy != null)(el.firstChild)) {
    el.firstChild.remove();
    return clear_children(el);
  }
}

make_picker_bang = function(deps) {
  const st = {pickerEl: null, pickerInput: null, pickerList: null, active: false, items: [], filtered: [], selectedIdx: 0, onSelect: null, actions: [], preserveTree: false, filterItem: null};
  const show_ref = {fn: null};
  const reset_st_bang = () => { (st.active = false);
(st.onSelect = null);
(st.actions = []);
(st.preserveTree = false);
if (((_truthy) => _truthy !== false && _truthy != null)(st.pickerEl)) {
  return (st.pickerEl.hidden = true);
} };
  const dismiss = () => { if (((_truthy) => _truthy !== false && _truthy != null)(st.active)) {
  reset_st_bang();
  return deps.restoreFocus();
} };
  const commit = () => { if (((_truthy) => _truthy !== false && _truthy != null)(st.active)) {
  const item = st.filtered[st.selectedIdx];
  const cb = st.onSelect;
  const query = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____0 = st.pickerInput; return ((some_thread____0 == null) ? null : some_thread____0.value); })());
  reset_st_bang();
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? cb : _logical))(item))) {
    return cb(item, query);
  }
} };
  const render_list = () => { if (((_truthy) => _truthy !== false && _truthy != null)(st.pickerList)) {
  clear_children(st.pickerList);
  if (($$bc$equiv(st.filtered.length, 0))) {
    const empty = (() => { const __e____scope__6__1__4__1__17__3__3__2__1__2__1__0 = document.createXULElement("label"); (__e____scope__6__1__4__1__17__3__3__2__1__2__1__0.className = "gjoa-picker-empty");
return __e____scope__6__1__4__1__17__3__3__2__1__2__1__0; })();
    empty.setAttribute("value", "(no matches)");
    return st.pickerList.appendChild(empty);
  } else {
    const query = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____1 = st.pickerInput; if ((some_thread____1 == null)) {
  return null;
} else {
  const some_thread____2 = some_thread____1.value;
  if ((some_thread____2 == null)) {
    return null;
  } else {
    const some_thread____3 = some_thread____2.trim();
    return ((some_thread____3 == null) ? null : some_thread____3.toLowerCase());
  }
} })());
    st.filtered.forEach((item, idx) => { const row = (() => { const __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__1__2__1__0 = document.createXULElement("hbox"); (__e____scope__6__1__4__1__17__3__3__3__1__2__3__3__1__2__1__0.className = "gjoa-picker-row");
return __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__1__2__1__0; })();
if (($$bc$equiv(idx, st.selectedIdx))) {
  row.setAttribute("gjoa-picker-selected", "true");
}
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? (!is_direct_match(item, query)) : _logical))(query) : _logical))(st.preserveTree))) {
  row.setAttribute("gjoa-picker-context", "true");
}
const depth = item.depth;
if (((_truthy) => _truthy !== false && _truthy != null)(((typeof depth === 'number') && ((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(depth, 0))) : _logical))(Number.isFinite(depth))))) {
  row.style.setProperty("padding-left", ("".concat((14 + (depth * 14.0)), "px")), "important");
}
if (((_truthy) => _truthy !== false && _truthy != null)(item.icon)) {
  if (((_truthy) => _truthy !== false && _truthy != null)(new RegExp("^page-icon:|^data:|^chrome:|^moz-").test(item.icon))) {
    const img = (() => { const __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__5__2__2__1__2__1__0 = document.createElement("img"); (__e____scope__6__1__4__1__17__3__3__3__1__2__3__3__5__2__2__1__2__1__0.className = "gjoa-picker-icon");
return __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__5__2__2__1__2__1__0; })();
    (img.src = item.icon);
    (img.alt = "");
    row.appendChild(img);
  } else {
    const ic = (() => { const __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__5__2__3__1__2__1__0 = document.createXULElement("label"); (__e____scope__6__1__4__1__17__3__3__3__1__2__3__3__5__2__3__1__2__1__0.className = "gjoa-picker-icon-text");
return __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__5__2__3__1__2__1__0; })();
    ic.setAttribute("value", item.icon);
    row.appendChild(ic);
  }
}
const text = (() => { const __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__1__2__1__0 = document.createXULElement("hbox"); (__e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__1__2__1__0.className = "gjoa-picker-text");
return __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__1__2__1__0; })();
text.setAttribute("flex", "1");
const primary = (() => { const __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__3__1__2__1__0 = document.createXULElement("label"); (__e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__3__1__2__1__0.className = "gjoa-picker-label");
return __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__3__1__2__1__0; })();
primary.setAttribute("value", item.display);
primary.setAttribute("crop", "end");
text.appendChild(primary);
if (((_truthy) => _truthy !== false && _truthy != null)(item.secondary)) {
  const sec = (() => { const __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__4__2__1__2__1__0 = document.createXULElement("label"); (__e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__4__2__1__2__1__0.className = "gjoa-picker-secondary");
return __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__4__2__1__2__1__0; })();
  sec.setAttribute("value", item.secondary);
  sec.setAttribute("crop", "end");
  text.appendChild(sec);
}
row.appendChild(text);
row.addEventListener("click", () => { (st.selectedIdx = idx);
return commit(); });
return st.pickerList.appendChild(row); });
    return (() => { const some_thread____4 = st.pickerList.querySelector("[gjoa-picker-selected='true']"); return ((some_thread____4 == null) ? null : some_thread____4.scrollIntoView({block: "nearest"})); })();
  }
} };
  const move_selection = (delta) => { const match_count = st.filtered.length;
const selected_idx = st.selectedIdx;
if ((match_count > 0)) {
  (st.selectedIdx = ((selected_idx + delta + match_count) % match_count));
  return render_list();
} };
  const open_action_menu = () => { const target = st.filtered[st.selectedIdx];
const local_actions = st.actions;
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? local_actions.length : _logical))(target))) {
  dismiss();
  const show_fn = show_ref.fn;
  return show_fn({prompt: "actions >", items: local_actions.map((_pct1) => { const label = ("".concat(_pct1.label, (((_truthy) => _truthy !== false && _truthy != null)(_pct1.key) ? ("".concat("   (", _pct1.key, ")")) : "")));
return {display: label, data: _pct1}; }), onSelect: (_pct1) => { const action = _pct1.data;
return (() => { try {
    return action.run(target);
  } catch (e) {
    return deps.modelineMsg(("".concat("action failed: ", e.message)), 4000);
  } })(); }});
} };
  const ensure_built = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(st.pickerEl))) {
  const root = document.createXULElement("vbox");
  const input_box = (() => { const __e____scope__6__1__4__1__26__3__2__1__5__1__0 = document.createXULElement("hbox"); (__e____scope__6__1__4__1__26__3__2__1__5__1__0.className = "gjoa-picker-input-box");
return __e____scope__6__1__4__1__26__3__2__1__5__1__0; })();
  const prompt = (() => { const __e____scope__6__1__4__1__26__3__2__1__8__1__0 = document.createXULElement("label"); (__e____scope__6__1__4__1__26__3__2__1__8__1__0.className = "gjoa-picker-prompt");
return __e____scope__6__1__4__1__26__3__2__1__8__1__0; })();
  const input = (() => { const __e____scope__6__1__4__1__26__3__2__1__11__1__0 = document.createElement("input"); (__e____scope__6__1__4__1__26__3__2__1__11__1__0.className = "gjoa-picker-input");
return __e____scope__6__1__4__1__26__3__2__1__11__1__0; })();
  const list = (() => { const __e____scope__6__1__4__1__26__3__2__1__14__1__0 = document.createXULElement("vbox"); (__e____scope__6__1__4__1__26__3__2__1__14__1__0.className = "gjoa-picker-list");
return __e____scope__6__1__4__1__26__3__2__1__14__1__0; })();
  (root.id = "gjoa-picker");
  (root.hidden = true);
  root.setAttribute("aria-modal", "true");
  prompt.setAttribute("value", ">");
  (input.placeholder = "Filter...");
  input_box.append(prompt, input);
  root.append(input_box, list);
  document.documentElement.appendChild(root);
  (st.pickerEl = root);
  (st.pickerInput = input);
  (st.pickerList = list);
  input.addEventListener("input", () => { const query = input.value.trim().toLowerCase();
(st.filtered = compute_filtered(st.items, query, st.preserveTree, st.filterItem));
(st.selectedIdx = 0);
return render_list(); });
  return input.addEventListener("keydown", (_pct1) => { if (((_truthy) => _truthy !== false && _truthy != null)(st.active)) {
  const key = _pct1.key;
  return ((($$bc$equiv(key, "Escape"))) ? (() => { _pct1.preventDefault();
_pct1.stopImmediatePropagation();
return dismiss(); })() : (($$bc$equiv(key, "Enter"))) ? (() => { _pct1.preventDefault();
_pct1.stopImmediatePropagation();
return commit(); })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(key, "Tab")) && (st.actions.length > 0)))) ? (() => { _pct1.preventDefault();
_pct1.stopImmediatePropagation();
return open_action_menu(); })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(key, "ArrowDown")) || ((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(key, "j")) || ($$bc$equiv(key, "n"))) : _logical))(_pct1.ctrlKey)))) ? (() => { _pct1.preventDefault();
_pct1.stopImmediatePropagation();
return move_selection(1); })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(key, "ArrowUp")) || ((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(key, "k")) || ($$bc$equiv(key, "p"))) : _logical))(_pct1.ctrlKey)))) ? (() => { _pct1.preventDefault();
_pct1.stopImmediatePropagation();
return move_selection(-1); })() : null);
} }, true);
} };
  const show = (opts) => { ensure_built();
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? st.pickerList : _logical))(st.pickerInput) : _logical))(st.pickerEl))) {
  (st.items = opts.items);
  (st.selectedIdx = 0);
  (st.onSelect = opts.onSelect);
  (st.actions = ((_logical) => (_logical !== false && _logical != null ? _logical : []))(opts.actions));
  (st.preserveTree = ((_truthy) => _truthy !== false && _truthy != null)(opts.preserveTree));
  (st.filterItem = opts.filterItem);
  (st.filtered = opts.items.slice());
  (st.active = true);
  const prompt_el = st.pickerEl.querySelector(".gjoa-picker-prompt");
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? opts.prompt : _logical))(prompt_el))) {
    prompt_el.setAttribute("value", opts.prompt);
  } else if (((_truthy) => _truthy !== false && _truthy != null)(prompt_el)) {
    prompt_el.setAttribute("value", ">");
  } else {
    null;
  }
  (st.pickerInput.value = "");
  render_list();
  (st.pickerEl.hidden = false);
  return st.pickerInput.focus();
} };
  const destroy = () => { document.removeEventListener("keydown", on_doc_keydown, true);
document.removeEventListener("mousedown", on_doc_mousedown, true);
dismiss();
(() => { const some_thread____5 = st.pickerEl; return ((some_thread____5 == null) ? null : some_thread____5.remove()); })();
(st.pickerEl = null);
(st.pickerInput = null);
return (st.pickerList = null); };
  const on_doc_keydown = (_pct1) => { if (((_truthy) => _truthy !== false && _truthy != null)(st.active)) {
  if (($$bc$equiv(_pct1.key, "Escape"))) {
    _pct1.preventDefault();
    _pct1.stopImmediatePropagation();
    return dismiss();
  }
} };
  const on_doc_mousedown = (_pct1) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? st.pickerEl : _logical))(st.active))) {
  const t = _pct1.target;
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(t)) || (!((_truthy) => _truthy !== false && _truthy != null)(st.pickerEl.contains(t)))))) {
    return dismiss();
  }
} };
  (show_ref.fn = show);
  document.addEventListener("keydown", on_doc_keydown, true);
  document.addEventListener("mousedown", on_doc_mousedown, true);
  return {show: show, isActive: () => st.active, dismiss: dismiss, destroy: destroy};
}

}

{
const $$bc$equiv = $$bc.equivV;

const UNSELECTABLE_INPUT_TYPES = ["button", "checkbox", "color", "file", "hidden", "image", "radio", "reset", "submit"];

function editable_element_p(el) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(el)) || (!($$bc$equiv(typeof el.nodeName, "string")))))) {
    return false;
  } else {
    if (($$bc$equiv(el.readOnly, true))) {
      return false;
    } else {
      const tag = el.nodeName.toLowerCase();
      return ((($$bc$equiv(tag, "input"))) ? (!((_truthy) => _truthy !== false && _truthy != null)(UNSELECTABLE_INPUT_TYPES.includes(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(el.type).toLowerCase()))) : (($$bc$equiv(tag, "textarea"))) ? true : (($$bc$equiv(tag, "select"))) ? true : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(typeof el.isContentEditable, "boolean")) && el.isContentEditable))) ? true : (() => { const role = (($$bc$equiv(typeof el.getAttribute, "function")) ? ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(el.getAttribute("role")).toLowerCase() : ""); return (($$bc$equiv(role, "textbox")) || (($$bc$equiv(role, "searchbox")) || (($$bc$equiv(role, "combobox")) || ($$bc$equiv(role, "application"))))); })());
    }
  }
}

function deep_active(doc) {
  return ((!((_truthy) => _truthy !== false && _truthy != null)(doc)) ? null : (() => { let a = doc.activeElement; while (true) {
    if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(a)) || editable_element_p(a)))) { return a; } else { const root = (() => { try {
    return ((_logical) => (_logical !== false && _logical != null ? _logical : a.shadowRoot))(a.openOrClosedShadowRoot);
  } catch (__e) {
    return null;
  } })(); if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? root.activeElement : _logical))(root))) { const _recur_0 = root.activeElement; a = _recur_0; continue; } else { return a; } }
  } })());
}

function same_process_editable_p(browser) {
  return (() => { try {
    const doc = browser.contentDocument;
  return ((!((_truthy) => _truthy !== false && _truthy != null)(doc)) ? false : (($$bc$equiv(doc.designMode, "on")) ? true : editable_element_p(deep_active(doc))));
  } catch (__e) {
    return false;
  } })();
}

make_content_focus_bang = function() {
  const log = create_logger_bang("contentFocus");
  log("init", {transport: "GjoaInput actor + same-process read"});
  return {contentInputFocused: () => (() => { try {
    const browser = gBrowser.selectedBrowser;
  return (((!((_truthy) => _truthy !== false && _truthy != null)(browser))) ? false : (((_truthy) => _truthy !== false && _truthy != null)(browser.contentDocument)) ? same_process_editable_p(browser) : ($$bc$equiv(browser._gjoaEditable, true)));
  } catch (__e) {
    return false;
  } })(), diag: () => { const holder = {sameProcess: null, actorCache: null};
(() => { try {
    const browser = gBrowser.selectedBrowser;
  if (((_truthy) => _truthy !== false && _truthy != null)(browser)) {
    (holder.sameProcess = same_process_editable_p(browser));
    return (holder.actorCache = browser._gjoaEditable);
  }
  } catch (__e) {
    return null;
  } })();
return holder; }, destroy: () => null};
}

}

{
const $$bc$equiv = $$bc.equivV, $$bc$get = $$bc.get;

function insert_after_each_bang(anchor, rows_arr) {
  const cur = {ref: anchor};
  return rows_arr.forEach((r) => { cur.ref.after(r);
return (cur.ref = r); });
}

function hide_children_bang(el) {
  return Array.from(el.children).forEach((_pct1) => (_pct1.hidden = true));
}

function show_children_bang(el) {
  return Array.from(el.children).forEach((_pct1) => (_pct1.hidden = false));
}

const VIM_COMMANDS = [{id: "tabsPicker", key: "t", desc: "tabs (this window)", cat: "Tabs"}, {id: "tabsPickerAll", key: "T", desc: "tabs (all windows)", cat: "Tabs"}, {id: "urlbar", key: "o", desc: "urlbar", cat: "Navigation"}, {id: "urlbarNewTab", key: "O", desc: "urlbar (new tab)", cat: "Navigation"}, {id: "closeTab", key: "x", desc: "close tab", cat: "Tabs"}, {id: "lastTab", key: "`", desc: "last tab", cat: "Tabs"}, {id: "back", key: "h", desc: "history back", cat: "Navigation"}, {id: "forward", key: "l", desc: "history forward", cat: "Navigation"}, {id: "linkHints", key: "f", desc: "link hints (follow link)", cat: "Navigation"}, {id: "linkHintsNewTab", key: "F", desc: "link hints (new tab)", cat: "Navigation"}, {id: "find", key: "/", desc: "find in page", cat: "Navigation"}, {id: "findNext", key: "n", desc: "find next", cat: "Navigation"}, {id: "findPrev", key: "N", desc: "find previous", cat: "Navigation"}, {id: "visualMode", key: "v", desc: "visual select (hjkl/w/b extend, y yank)", cat: "Navigation"}, {id: "scrollDown", key: "j", desc: "scroll down", cat: "Scrolling"}, {id: "scrollUp", key: "k", desc: "scroll up", cat: "Scrolling"}, {id: "summonSidebar", key: "e", desc: "summon sidebar (brief; self-dismisses)", cat: "Layout"}, {id: "anchorSidebar", key: "E", desc: "anchor / float sidebar (persistent)", cat: "Layout"}, {id: "toggleStrip", key: "b", desc: "toggle sidebar strip (horizontal)", cat: "Layout"}, {id: "exCommand", key: ":", desc: "command palette", cat: "Command"}, {id: "help", key: "?", desc: "show this help", cat: "Help"}];

const DEFAULT_KEYMAP = (() => { const m = new Map(); VIM_COMMANDS.forEach((c) => m.set(c.key, c.id));
return m; })();

const COMMAND_IDS = (() => { const s = new Set(); VIM_COMMANDS.forEach((c) => s.add(c.id));
return s; })();

(() => { try {
    return Services.prefs.getDefaultBranch("").setCharPref("gjoa.keys.commands", JSON.stringify(VIM_COMMANDS));
  } catch (__e) {
    return null;
  } })();

function effective_command_id(key, overrides_raw) {
  return (($$bc$equiv(overrides_raw, "")) ? DEFAULT_KEYMAP.get(key) : (() => { try {
    const ov = JSON.parse(overrides_raw);
  const v = $$bc$get(ov, key);
  return (($$bc$equiv(typeof v, "undefined")) ? DEFAULT_KEYMAP.get(key) : v);
  } catch (__e) {
    return DEFAULT_KEYMAP.get(key);
  } })());
}

function set_key_binding_bang(key, cmd) {
  const raw = (() => { try {
    return Services.prefs.getStringPref("gjoa.keys.bindings", "");
  } catch (__e____scope__11__4__1__2__2__1__0) {
    return (() => { try {
    return Services.prefs.getCharPref("gjoa.keys.bindings", "");
  } catch (__e2____scope__11__4__1__2__2__2__2__1__0) {
    return "";
  } })();
  } })();
  const ov = (($$bc$equiv(raw, "")) ? new Object() : (() => { try {
    return JSON.parse(raw);
  } catch (__e) {
    return new Object();
  } })());
  Reflect.set(ov, key, cmd);
  return (() => { try {
    return Services.prefs.setStringPref("gjoa.keys.bindings", JSON.stringify(ov));
  } catch (__e____scope__11__4__3__2__1__0) {
    return null;
  } })();
}

const EX_COMMANDS = [{name: "group", description: "Create a named folder at cursor", takesArgs: true}, {name: "refile", description: "Move cursor tab into a different group", takesArgs: false}, {name: "pin", description: "Pin the cursor's tab", takesArgs: false}, {name: "unpin", description: "Unpin the cursor's tab", takesArgs: false}, {name: "tabs", description: "Fuzzy-find open tabs (`:tabs all` = every window)", takesArgs: true}, {name: "checkpoint", description: "Snapshot tab tree with a name (like a git tag)", takesArgs: true}, {name: "restore", description: "Restore a saved session or checkpoint", takesArgs: true}, {name: "history", description: "Browse auto-save timeline (`:history space` = current workspace)", takesArgs: true}, {name: "blacklist", description: "Disable gjoa keys on a site (`list` / `remove`)", takesArgs: true}, {name: "space", description: "Workspaces: new / rename / delete / switch", takesArgs: true}, {name: "tabpos", description: "Where new tabs open: sibling | root | child", takesArgs: true}, {name: "sidebar-strip", description: "Toggle Firefox's sidebar launcher strip (horizontal mode)", takesArgs: false}, {name: "bind", description: "Rebind a key: :bind <key> <command>  (about:vim)", takesArgs: true}, {name: "unbind", description: "Unbind a key: :unbind <key>", takesArgs: true}, {name: "bindreset", description: "Reset all keybindings to defaults", takesArgs: false}, {name: "help", description: "Show the keymap cheatsheet", takesArgs: false}];

make_vim_bang = function(deps) {
  const rows = $$bc$get(deps, "rows");
  const layout = $$bc$get(deps, "layout");
  const scheduleSave = $$bc$get(deps, "scheduleSave");
  const clearSelection = $$bc$get(deps, "clearSelection");
  const selectRange = $$bc$get(deps, "selectRange");
  const sidebarMain = $$bc$get(deps, "sidebarMain");
  const history = $$bc$get(deps, "history");
  const contentFocus = $$bc$get(deps, "contentFocus");
  const spaces = $$bc$get(deps, "spaces");
  const log = create_logger_bang("tabs/vim");
  const vs = {chord: null, chord_timer: 0, pending_ctrl_w: false, pending_cursor_move: false, hz_expanded_root: null, modeline: null, modeline_timer: 0, panel_active: false, refile_source: null, selection_anchor: null, search_input: null, search_active: false, search_matches: [], search_idx: -1, last_tab: null, current_selected_tab: null, leader_armed: false, leader_timer: null, which_key_el: null, leader_prev_focus: null, leader_focus_stash: null, link_hints_active: false, visual_active: false};
  const commit_tree = (targets) => { targets.forEach((_pct1) => rows.syncAnyRow(_pct1));
rows.updateVisibility();
return scheduleSave(); };
  const tab_spec = (tab) => ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____0 = tab; if ((some_thread____0 == null)) {
  return null;
} else {
  const some_thread____1 = some_thread____0.linkedBrowser;
  if ((some_thread____1 == null)) {
    return null;
  } else {
    const some_thread____2 = some_thread____1.currentURI;
    return ((some_thread____2 == null) ? null : some_thread____2.spec);
  }
} })());
  const current_spec = () => ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____3 = gBrowser; if ((some_thread____3 == null)) {
  return null;
} else {
  const some_thread____4 = some_thread____3.selectedBrowser;
  if ((some_thread____4 == null)) {
    return null;
  } else {
    const some_thread____5 = some_thread____4.currentURI;
    return ((some_thread____5 == null) ? null : some_thread____5.spec);
  }
} })());
  const tree_root = (row) => { const all_r = all_rows();
const idx = all_r.indexOf(row);
return ((_logical) => (_logical !== false && _logical != null ? _logical : row))((() => { let i = idx; while (true) {
    if ((i < 0)) { return null; } else if (($$bc$equiv(level_of_row_bang(all_r[i]), 0))) { return all_r[i]; } else { const _recur_0 = (i - 1); i = _recur_0; continue; }
  } })()); };
  const collapse_hz_tree = (root) => { const d = data_of_bang(root);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? has_children_bang(root) : _logical))(d))) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(state.cursor, root))) : _logical))((() => { const some_thread____6 = state; if ((some_thread____6 == null)) {
  return null;
} else {
  const some_thread____7 = some_thread____6.cursor;
  return ((some_thread____7 == null) ? null : some_thread____7._tab);
} })()))) {
    const cur_root = tree_root(state.cursor);
    if (($$bc$equiv(cur_root, root))) {
      hz_display.set(root, state.cursor._tab);
    }
  }
  (d.collapsed = true);
  rows.syncAnyRow(root);
  if (is_horizontal()) {
    return layout.setUrlbarTopLayer(true);
  }
} };
  const expand_hz_tree = (root) => { const d = data_of_bang(root);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? has_children_bang(root) : _logical))(d))) {
  hz_display.delete(root);
  (d.collapsed = false);
  rows.syncAnyRow(root);
  if (is_horizontal()) {
    return layout.setUrlbarTopLayer(false);
  }
} };
  const update_horizontal_expansion = () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.cursor)) {
  const root = tree_root(state.cursor);
  if ((!($$bc$equiv(root, vs["hz-expanded-root"])))) {
    if (((_truthy) => _truthy !== false && _truthy != null)(vs["hz-expanded-root"])) {
      collapse_hz_tree(vs["hz-expanded-root"]);
    }
    expand_hz_tree(root);
    (vs["hz-expanded-root"] = root);
    return rows.updateVisibility();
  }
} };
  const set_cursor = (row) => { if (((_truthy) => _truthy !== false && _truthy != null)(state.cursor)) {
  state.cursor.removeAttribute("gjoa-cursor");
}
(state.cursor = row);
if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
  row.setAttribute("gjoa-cursor", "true");
  row.scrollIntoView({block: "nearest", inline: "nearest"});
  if (is_horizontal()) {
    return update_horizontal_expansion();
  }
} };
  const move_to_level0 = (delta) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(state.cursor))) {
  return false;
} else {
  const all_r = all_rows();
  const cur_idx = all_r.indexOf(state.cursor);
  if ((cur_idx < 0)) {
    return false;
  } else {
    const step = ((delta > 0) ? 1 : -1);
    const candidate = (() => { let i = (cur_idx + step); while (true) {
    if (((_truthy) => _truthy !== false && _truthy != null)(((i < 0) || (i >= all_r.length)))) { return null; } else if (($$bc$equiv(level_of_row_bang(all_r[i]), 0))) { return all_r[i]; } else { const _recur_0 = (i + step); i = _recur_0; continue; }
  } })();
    if (((_truthy) => _truthy !== false && _truthy != null)(candidate)) {
      set_cursor(candidate);
      if (((_truthy) => _truthy !== false && _truthy != null)(candidate._tab)) {
        (gBrowser.selectedTab = candidate._tab);
      }
      return true;
    } else {
      return false;
    }
  }
} };
  const move_cursor = (delta) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(state.cursor))) {
  log("moveCursor:noCursor", {delta: delta});
  return false;
} else {
  const all_arr = all_rows();
  const idx = all_arr.indexOf(state.cursor);
  if ((idx < 0)) {
    log("moveCursor:cursorNotInAllRows", {delta: delta, allLen: all_arr.length});
    return false;
  } else {
    const step = ((delta > 0) ? 1 : -1);
    const target = (() => { let i = (idx + step); while (true) {
    if (((_truthy) => _truthy !== false && _truthy != null)(((i < 0) || (i >= all_arr.length)))) { return null; } else if ((!((_truthy) => _truthy !== false && _truthy != null)(all_arr[i].hidden))) { return all_arr[i]; } else { const _recur_0 = (i + step); i = _recur_0; continue; }
  } })();
    if (((_truthy) => _truthy !== false && _truthy != null)(target)) {
      log("moveCursor:landed", {delta: delta, fromIdx: idx});
      set_cursor(target);
      if (((_truthy) => _truthy !== false && _truthy != null)(target._tab)) {
        (gBrowser.selectedTab = target._tab);
      }
      return true;
    } else {
      log("moveCursor:noTarget", {delta: delta, fromIdx: idx, allLen: all_arr.length});
      return false;
    }
  }
} };
  const prev_sibling_tab = (row) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? row._tab : _logical))(row))) {
  const my_td = tree_data_bang(row._tab);
  const my_level = level_of_bang(row._tab);
  const my_parent_id = my_td.parentId;
  return (() => { let r = row.previousElementSibling; while (true) {
    if ((r == null)) { return null; } else if ((!((_truthy) => _truthy !== false && _truthy != null)(r._tab))) { const _recur_0 = r.previousElementSibling; r = _recur_0; continue; } else if ((level_of_bang(r._tab) < my_level)) { return null; } else if (((_truthy) => _truthy !== false && _truthy != null)(((level_of_bang(r._tab) === my_level) && ($$bc$equiv(tree_data_bang(r._tab).parentId, my_parent_id))))) { return r._tab; } else { const _recur_0 = r.previousElementSibling; r = _recur_0; continue; }
  } })();
} };
  const indent_row = (row) => { if (((_truthy) => _truthy !== false && _truthy != null)(row._group)) {
  const all_r = all_rows();
  const i = all_r.indexOf(row);
  if ((i > 0)) {
    const d = row._group;
    const d_level = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(d.level);
    const prev_lv = level_of_row_bang(all_r[(i - 1)]);
    if ((!(d_level > prev_lv))) {
      (d.level = (d_level + 1));
      rows.syncAnyRow(row);
    }
  }
} else {
  if (((_truthy) => _truthy !== false && _truthy != null)(row._tab)) {
    const prev = row.previousElementSibling;
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? prev._group : _logical))(prev))) {
      (tree_data_bang(row._tab).parentId = prev._group.id);
      subtree_rows_bang(row).forEach((_pct1) => rows.syncAnyRow(_pct1));
    } else {
      const sibling = prev_sibling_tab(row);
      if (((_truthy) => _truthy !== false && _truthy != null)(sibling)) {
        (tree_data_bang(row._tab).parentId = tree_data_bang(sibling).id);
        subtree_rows_bang(row).forEach((_pct1) => rows.syncAnyRow(_pct1));
      }
    }
  }
}
rows.updateVisibility();
return scheduleSave(); };
  const outdent_row = (row) => { if (((_truthy) => _truthy !== false && _truthy != null)(row._group)) {
  const d = row._group;
  const d_level = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(d.level);
  if ((d_level > 0)) {
    (d.level = Math.max(0, (d_level - 1)));
    rows.syncAnyRow(row);
  }
} else {
  if (((_truthy) => _truthy !== false && _truthy != null)(row._tab)) {
    const td = tree_data_bang(row._tab);
    if ((!($$bc$equiv(td.parentId, null)))) {
      if (($$bc$equiv(typeof td.parentId, "string"))) {
        (td.parentId = null);
      } else {
        const parent = tab_by_id(td.parentId);
        (td.parentId = ((_logical) => (_logical !== false && _logical != null ? tree_data_bang(parent).parentId : _logical))(parent));
      }
      subtree_rows_bang(row).forEach((_pct1) => rows.syncAnyRow(_pct1));
    }
  }
}
rows.updateVisibility();
return scheduleSave(); };
  const move_to_root = (row) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? row._tab : _logical))(row))) {
  const td = tree_data_bang(row._tab);
  if (((_truthy) => _truthy !== false && _truthy != null)(td.parentId)) {
    (td.parentId = null);
    return commit_tree(subtree_rows_bang(row));
  }
} };
  const make_child_of_above = (row) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? row._tab : _logical))(row))) {
  const prev = row.previousElementSibling;
  if (((_truthy) => _truthy !== false && _truthy != null)(prev)) {
    if (((_truthy) => _truthy !== false && _truthy != null)(prev._group)) {
      (tree_data_bang(row._tab).parentId = prev._group.id);
    } else {
      if (((_truthy) => _truthy !== false && _truthy != null)(prev._tab)) {
        (tree_data_bang(row._tab).parentId = tree_data_bang(prev._tab).id);
      }
    }
    return commit_tree(subtree_rows_bang(row));
  }
} };
  const swap_down = (row) => { if (((_truthy) => _truthy !== false && _truthy != null)(data_of_bang(row))) {
  const my_level = level_of_row_bang(row);
  const sub = subtree_rows_bang(row);
  const sub_count = sub.length;
  const last_row = sub[(sub_count - 1)];
  const next_row = last_row.nextElementSibling;
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!($$bc$equiv(next_row, state.spacer))) && (level_of_row_bang(next_row) === my_level)) : _logical))(next_row))) {
    const next_sub = subtree_rows_bang(next_row);
    const next_sub_count = next_sub.length;
    const anchor = next_sub[(next_sub_count - 1)];
    insert_after_each_bang(anchor, sub);
    rows.updateVisibility();
    return scheduleSave();
  }
} };
  const swap_up = (row) => { if (((_truthy) => _truthy !== false && _truthy != null)(data_of_bang(row))) {
  const my_level = level_of_row_bang(row);
  const prev = (() => { let el = row.previousElementSibling; while (true) {
    if ((el == null)) { return null; } else if ((level_of_row_bang(el) > my_level)) { const _recur_0 = el.previousElementSibling; el = _recur_0; continue; } else { return el; }
  } })();
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (level_of_row_bang(prev) === my_level) : _logical))(prev))) {
    subtree_rows_bang(row).forEach((_pct1) => prev.before(_pct1));
    rows.updateVisibility();
    return scheduleSave();
  }
} };
  const make_child_of_next = (row) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? row._tab : _logical))(row))) {
  const my_level = level_of_row_bang(row);
  const sub = subtree_rows_bang(row);
  const sub_count = sub.length;
  const last_row = sub[(sub_count - 1)];
  const next_row = last_row.nextElementSibling;
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!($$bc$equiv(next_row, state.spacer))) && (level_of_row_bang(next_row) === my_level)) : _logical))(next_row))) {
    if (((_truthy) => _truthy !== false && _truthy != null)(next_row._group)) {
      (tree_data_bang(row._tab).parentId = next_row._group.id);
    } else {
      if (((_truthy) => _truthy !== false && _truthy != null)(next_row._tab)) {
        (tree_data_bang(row._tab).parentId = tree_data_bang(next_row._tab).id);
      }
    }
    const next_sub = subtree_rows_bang(next_row);
    const next_sub_count = next_sub.length;
    const anchor = next_sub[(next_sub_count - 1)];
    insert_after_each_bang(anchor, sub);
    return commit_tree(subtree_rows_bang(row));
  }
} };
  const parent_row_of = (row) => { const my_level = level_of_row_bang(row);
return (() => { let el = row.previousElementSibling; while (true) {
    if ((el == null)) { return null; } else if ((level_of_row_bang(el) < my_level)) { return el; } else { const _recur_0 = el.previousElementSibling; el = _recur_0; continue; }
  } })(); };
  const unfold_right = (row) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? tree_data_bang(row._tab).parentId : _logical))(row._tab) : _logical))(row))) {
  const sub = subtree_rows_bang(row);
  const p = parent_row_of(row);
  const p_sub = (((_truthy) => _truthy !== false && _truthy != null)(p) ? (() => { return subtree_rows_bang(p); })() : null);
  const p_sub_count = (((_truthy) => _truthy !== false && _truthy != null)(p_sub) ? p_sub.length : 0);
  const anchor = ((p_sub_count > 0) ? (() => { return p_sub[(p_sub_count - 1)]; })() : null);
  (tree_data_bang(row._tab).parentId = null);
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(sub.includes(anchor))) : _logical))(anchor))) {
    insert_after_each_bang(anchor, sub);
  }
  return commit_tree(subtree_rows_bang(row));
} };
  const unfold_left = (row) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? tree_data_bang(row._tab).parentId : _logical))(row._tab) : _logical))(row))) {
  const sub = subtree_rows_bang(row);
  const p = parent_row_of(row);
  (tree_data_bang(row._tab).parentId = null);
  if (((_truthy) => _truthy !== false && _truthy != null)(p)) {
    sub.forEach((_pct1) => p.before(_pct1));
  }
  return commit_tree(subtree_rows_bang(row));
} };
  const create_modeline = () => { const ml = (() => { const __e____scope__13__1__4__1__98__3__1__2__1__0 = document.createXULElement("hbox"); (__e____scope__13__1__4__1__98__3__1__2__1__0.id = "gjoa-modeline");
return __e____scope__13__1__4__1__98__3__1__2__1__0; })();
const mode_label = (() => { const __e____scope__13__1__4__1__98__3__1__5__1__0 = document.createXULElement("label"); (__e____scope__13__1__4__1__98__3__1__5__1__0.id = "gjoa-modeline-mode");
return __e____scope__13__1__4__1__98__3__1__5__1__0; })();
const chord_label = (() => { const __e____scope__13__1__4__1__98__3__1__8__1__0 = document.createXULElement("label"); (__e____scope__13__1__4__1__98__3__1__8__1__0.id = "gjoa-modeline-chord");
return __e____scope__13__1__4__1__98__3__1__8__1__0; })();
const msg_label = (() => { const __e____scope__13__1__4__1__98__3__1__11__1__0 = document.createXULElement("label"); (__e____scope__13__1__4__1__98__3__1__11__1__0.id = "gjoa-modeline-msg");
return __e____scope__13__1__4__1__98__3__1__11__1__0; })();
ml.setAttribute("align", "center");
mode_label.setAttribute("value", "-- INSERT --");
chord_label.setAttribute("value", "");
chord_label.setAttribute("flex", "1");
msg_label.setAttribute("value", "");
msg_label.setAttribute("crop", "end");
ml.appendChild(mode_label);
ml.appendChild(chord_label);
ml.appendChild(msg_label);
const anchor = ((_logical) => (_logical !== false && _logical != null ? _logical : document.documentElement))(document.getElementById("appcontent"));
anchor.appendChild(ml);
return (vs.modeline = ml); };
  const update_modeline = () => { if (((_truthy) => _truthy !== false && _truthy != null)(vs.modeline)) {
  const mode_label = document.getElementById("gjoa-modeline-mode");
  const chord_label = document.getElementById("gjoa-modeline-chord");
  const msg_label = document.getElementById("gjoa-modeline-msg");
  const pending = (((_truthy) => _truthy !== false && _truthy != null)(vs["pending-ctrl-w"]) ? "C-w-" : (($$bc$equiv(vs.chord, "g")) ? "g-" : ""));
  if (((_truthy) => _truthy !== false && _truthy != null)(mode_label)) {
    mode_label.setAttribute("value", "");
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(chord_label)) {
    chord_label.setAttribute("value", pending);
  }
  const has_content = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : vs.modeline.querySelector(".gjoa-search-input")))(vs["search-active"])))((() => { const some_thread____8 = msg_label; return ((some_thread____8 == null) ? null : some_thread____8.getAttribute("value")); })())))(pending);
  return vs.modeline.toggleAttribute("gjoa-visible", has_content);
} };
  const modeline_msg = (text, duration) => { const dur = (($$bc$equiv(duration, undefined)) ? 3000 : duration);
if (((_truthy) => _truthy !== false && _truthy != null)(vs.modeline)) {
  const msg = document.getElementById("gjoa-modeline-msg");
  if (((_truthy) => _truthy !== false && _truthy != null)(msg)) {
    msg.setAttribute("value", text);
    vs.modeline.setAttribute("gjoa-visible", "true");
    clearTimeout(vs["modeline-timer"]);
    return (vs["modeline-timer"] = setTimeout(() => { msg.setAttribute("value", "");
return update_modeline(); }, dur));
  }
} };
  const picker = make_picker_bang({restoreFocus: () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.panel)) {
  return state.panel.focus();
} }, modelineMsg: (_pct1, _pct2) => modeline_msg(_pct1, _pct2)});
  const focus_panel = () => { (vs["panel-active"] = true);
state.panel.focus();
if ((!((_truthy) => _truthy !== false && _truthy != null)(state.cursor))) {
  const row = row_of.get(gBrowser.selectedTab);
  if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
    set_cursor(row);
  }
}
return update_modeline(); };
  const activate_vim = (row) => { focus_panel();
return set_cursor(row); };
  const focus_panel_unless_urlbar = () => { const u = document.getElementById("urlbar");
const a = document.activeElement;
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ((a === u) || u.contains(a)) : _logical))(a) : _logical))(u))) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(state.cursor))) {
    const row = row_of.get(gBrowser.selectedTab);
    if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
      set_cursor(row);
    }
  }
  return update_modeline();
} else {
  return focus_panel();
} };
  const blur_panel = () => { (vs["panel-active"] = false);
(vs.chord = null);
(vs["pending-ctrl-w"] = false);
clearTimeout(vs["chord-timer"]);
if (((_truthy) => _truthy !== false && _truthy != null)((is_horizontal() && vs["hz-expanded-root"]))) {
  collapse_hz_tree(vs["hz-expanded-root"]);
  (vs["hz-expanded-root"] = null);
  rows.updateVisibility();
}
return update_modeline(); };
  const activate_urlbar = (intent) => { (() => { try {
    const u = window.gURLBar;
  if (((_truthy) => _truthy !== false && _truthy != null)(u)) {
    if (((_truthy) => _truthy !== false && _truthy != null)(u.focus)) {
      u.focus();
    }
    if (((_truthy) => _truthy !== false && _truthy != null)(u.select)) {
      u.select();
    }
    if (((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____9 = u; if ((some_thread____9 == null)) {
  return null;
} else {
  const some_thread____10 = some_thread____9.view;
  return ((some_thread____10 == null) ? null : some_thread____10.autoOpen);
} })())) {
      return u.view.autoOpen({event: new Event("command")});
    }
  }
  } catch (__e) {
    return null;
  } })();
return document.dispatchEvent(new CustomEvent("gjoa-urlbar-activate", {detail: {intent: intent}})); };
  const toggle_last_tab = () => { const target = vs["last-tab"];
if (((_truthy) => _truthy !== false && _truthy != null)(target)) {
  return (() => { try {
    if (((_truthy) => _truthy !== false && _truthy != null)(target.isOpen)) {
    return (gBrowser.selectedTab = target);
  }
  } catch (e) {
    return console.error("gjoa-tabs: toggleLastTab failed", e);
  } })();
} };
  const toggle_h_sidebar_strip = () => { const cur = (() => { try {
    return Services.prefs.getBoolPref("gjoa.layout.horizontalSidebarStrip", false);
  } catch (__e____scope__13__1__4__1__128__3__1__2__2__1__0) {
    return false;
  } })();
const next = (!cur);
(() => { try {
    return Services.prefs.setBoolPref("gjoa.layout.horizontalSidebarStrip", next);
  } catch (__e____scope__13__1__4__1__128__3__2__2__1__0) {
    return null;
  } })();
return modeline_msg(("".concat("Sidebar strip ", (next ? "shown" : "hidden"))), 2000); };
  const key_enabled = (name) => (() => { try {
    return Services.prefs.getBoolPref(("".concat("gjoa.keys.", name, ".enabled")), true);
  } catch (__e____scope__13__1__4__1__131__3__2__1__0) {
    return true;
  } })();
  const blacklisted_hosts = () => { const raw = (() => { try {
    return Services.prefs.getStringPref("gjoa.keys.blacklist", "");
  } catch (__e____scope__13__1__4__1__134__3__1__2__2__1__0) {
    return (() => { try {
    return Services.prefs.getCharPref("gjoa.keys.blacklist", "");
  } catch (__e2____scope__13__1__4__1__134__3__1__2__2__2__2__1__0) {
    return "";
  } })();
  } })();
return raw.split(",").map((_pct1) => _pct1.trim().toLowerCase()).filter((_pct1) => ((_truthy) => _truthy !== false && _truthy != null)(_pct1)); };
  const current_host = () => (() => { try {
    const uri = current_spec();
  return ((!((_truthy) => _truthy !== false && _truthy != null)(uri)) ? "" : new URL(uri).hostname.toLowerCase());
  } catch (__e) {
    return "";
  } })();
  const current_host_blacklisted = () => { const host = current_host();
return (((_truthy) => _truthy !== false && _truthy != null)(host) && blacklisted_hosts().some((_pct1) => (($$bc$equiv(host, _pct1)) || host.endsWith(("".concat(".", _pct1)))))); };
  const blacklist_add = (host) => { const list = blacklisted_hosts();
const h = host.trim().toLowerCase();
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(list.includes(h))) : _logical))(h))) {
  list.push(h);
  return (() => { try {
    return Services.prefs.setStringPref("gjoa.keys.blacklist", list.join(","));
  } catch (__e____scope__13__1__4__1__143__3__2__3__2__1__0) {
    return null;
  } })();
} };
  const blacklist_remove = (host) => { const list = blacklisted_hosts();
const h = host.trim().toLowerCase();
const next = list.filter((_pct1) => (!($$bc$equiv(_pct1, h))));
if ((next.length === list.length)) {
  return false;
} else {
  (() => { try {
    return Services.prefs.setStringPref("gjoa.keys.blacklist", next.join(","));
  } catch (__e____scope__13__1__4__1__146__3__2__3__1__2__1__0) {
    return null;
  } })();
  return true;
} };
  const leader_key = () => { if (((_truthy) => _truthy !== false && _truthy != null)((() => { try {
    return Services.prefs.getBoolPref("gjoa.keys.useLeader", false);
  } catch (__e____scope__13__1__4__1__149__3__1__2__1__0) {
    return false;
  } })())) {
  const v = (() => { try {
    return Services.prefs.getStringPref("gjoa.keys.leader", " ");
  } catch (__e____scope__13__1__4__1__149__3__2__1__2__2__1__0) {
    return (() => { try {
    return Services.prefs.getCharPref("gjoa.keys.leader", " ");
  } catch (__e2____scope__13__1__4__1__149__3__2__1__2__2__2__2__1__0) {
    return " ";
  } })();
  } })();
  return (($$bc$equiv(v.length, 0)) ? null : v);
} else {
  return null;
} };
  const leader_timeout_ms = () => (() => { try {
    return Services.prefs.getIntPref("gjoa.keys.leader_timeout", 1500);
  } catch (__e____scope__13__1__4__1__152__3__2__1__0) {
    return 1500;
  } })();
  const which_key_ensure = () => { if (((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____11 = vs; if ((some_thread____11 == null)) {
  return null;
} else {
  const some_thread____12 = some_thread____11["which-key-el"];
  return ((some_thread____12 == null) ? null : some_thread____12.isConnected);
} })())) {
  return vs["which-key-el"];
} else {
  const el = document.createElement("div");
  const header = (() => { const __e____scope__13__1__4__1__155__3__3__1__5__1__0 = document.createElement("div"); (__e____scope__13__1__4__1__155__3__3__1__5__1__0.className = "gjoa-wk-header");
return __e____scope__13__1__4__1__155__3__3__1__5__1__0; })();
  (el.id = "gjoa-which-key");
  (el.hidden = true);
  (header.textContent = "leader");
  el.appendChild(header);
  VIM_COMMANDS.forEach((b) => { if (((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(b.id, "exCommand"))) && key_enabled(b.id)))) {
  const row = (() => { const __e____scope__13__1__4__1__155__3__3__6__3__3__2__1__2__1__0 = document.createElement("div"); (__e____scope__13__1__4__1__155__3__3__6__3__3__2__1__2__1__0.className = "gjoa-wk-row");
return __e____scope__13__1__4__1__155__3__3__6__3__3__2__1__2__1__0; })();
  const k = (() => { const __e____scope__13__1__4__1__155__3__3__6__3__3__2__1__5__1__0 = document.createElement("span"); (__e____scope__13__1__4__1__155__3__3__6__3__3__2__1__5__1__0.className = "gjoa-wk-key");
return __e____scope__13__1__4__1__155__3__3__6__3__3__2__1__5__1__0; })();
  const d = (() => { const __e____scope__13__1__4__1__155__3__3__6__3__3__2__1__8__1__0 = document.createElement("span"); (__e____scope__13__1__4__1__155__3__3__6__3__3__2__1__8__1__0.className = "gjoa-wk-desc");
return __e____scope__13__1__4__1__155__3__3__6__3__3__2__1__8__1__0; })();
  (k.textContent = (($$bc$equiv(b.key, " ")) ? "Space" : b.key));
  (d.textContent = b.desc);
  row.appendChild(k);
  row.appendChild(d);
  return el.appendChild(row);
} });
  const exHeader = (() => { const __e____scope__13__1__4__1__155__3__3__7__1__2__1__0 = document.createElement("div"); (__e____scope__13__1__4__1__155__3__3__7__1__2__1__0.className = "gjoa-wk-header gjoa-wk-section");
return __e____scope__13__1__4__1__155__3__3__7__1__2__1__0; })();
  (exHeader.textContent = ": commands");
  el.appendChild(exHeader);
  EX_COMMANDS.forEach((c) => { const row = (() => { const __e____scope__13__1__4__1__155__3__3__8__3__3__1__2__1__0 = document.createElement("div"); (__e____scope__13__1__4__1__155__3__3__8__3__3__1__2__1__0.className = "gjoa-wk-row");
return __e____scope__13__1__4__1__155__3__3__8__3__3__1__2__1__0; })();
const k = (() => { const __e____scope__13__1__4__1__155__3__3__8__3__3__1__5__1__0 = document.createElement("span"); (__e____scope__13__1__4__1__155__3__3__8__3__3__1__5__1__0.className = "gjoa-wk-cmd");
return __e____scope__13__1__4__1__155__3__3__8__3__3__1__5__1__0; })();
const d = (() => { const __e____scope__13__1__4__1__155__3__3__8__3__3__1__8__1__0 = document.createElement("span"); (__e____scope__13__1__4__1__155__3__3__8__3__3__1__8__1__0.className = "gjoa-wk-desc");
return __e____scope__13__1__4__1__155__3__3__8__3__3__1__8__1__0; })();
(k.textContent = ("".concat(":", c.name, (((_truthy) => _truthy !== false && _truthy != null)(c.takesArgs) ? " …" : ""))));
(d.textContent = c.description);
row.appendChild(k);
row.appendChild(d);
return el.appendChild(row); });
  document.documentElement.appendChild(el);
  (vs["which-key-el"] = el);
  return el;
} };
  const ensure_leader_focus_stash = () => { if (((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____13 = vs; if ((some_thread____13 == null)) {
  return null;
} else {
  const some_thread____14 = some_thread____13["leader-focus-stash"];
  return ((some_thread____14 == null) ? null : some_thread____14.isConnected);
} })())) {
  return vs["leader-focus-stash"];
} else {
  const el = document.createElement("div");
  (el.id = "gjoa-leader-focus-stash");
  el.setAttribute("aria-hidden", "true");
  el.setAttribute("tabindex", "-1");
  (el.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none");
  document.documentElement.appendChild(el);
  (vs["leader-focus-stash"] = el);
  return el;
} };
  const disarm_leader = () => { (vs["leader-armed"] = false);
if ((!($$bc$equiv(vs["leader-timer"], null)))) {
  clearTimeout(vs["leader-timer"]);
  (vs["leader-timer"] = null);
}
(() => { try {
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(document.activeElement, vs["leader-focus-stash"])) : _logical))(vs["leader-prev-focus"]))) {
    if (((_truthy) => _truthy !== false && _truthy != null)(vs["leader-prev-focus"].focus)) {
      return vs["leader-prev-focus"].focus();
    }
  }
  } catch (__e) {
    return null;
  } })();
return (vs["leader-prev-focus"] = null); };
  const arm_leader = () => { (vs["leader-armed"] = true);
if ((!($$bc$equiv(vs["leader-timer"], null)))) {
  clearTimeout(vs["leader-timer"]);
}
(vs["leader-timer"] = setTimeout(() => disarm_leader(), leader_timeout_ms()));
const a = document.activeElement;
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(a, vs["leader-focus-stash"]))) : _logical))(a))) {
  (vs["leader-prev-focus"] = a);
}
return (() => { try {
    return ensure_leader_focus_stash().focus();
  } catch (__e) {
    return null;
  } })(); };
  const toggle_which_key = () => { const el = which_key_ensure();
return (el.hidden = (!((_truthy) => _truthy !== false && _truthy != null)(el.hidden))); };
  const hide_which_key = () => { if (((_truthy) => _truthy !== false && _truthy != null)(vs["which-key-el"])) {
  return (vs["which-key-el"].hidden = true);
} };
  const link_hints_actor = () => (() => { const some_thread____15 = gBrowser; if ((some_thread____15 == null)) {
  return null;
} else {
  const some_thread____16 = some_thread____15.selectedBrowser;
  if ((some_thread____16 == null)) {
    return null;
  } else {
    const some_thread____17 = some_thread____16.browsingContext;
    if ((some_thread____17 == null)) {
      return null;
    } else {
      const some_thread____18 = some_thread____17.currentWindowGlobal;
      return ((some_thread____18 == null) ? null : some_thread____18.getActor("GjoaInput"));
    }
  }
} })();
  const end_link_hints = (send_cancel_p) => { (vs["link-hints-active"] = false);
if (send_cancel_p) {
  const a = link_hints_actor();
  if (((_truthy) => _truthy !== false && _truthy != null)(a)) {
    return (() => { try {
    return a.sendQuery("LinkHints:Cancel");
  } catch (__e) {
    return null;
  } })();
  }
} };
  const start_link_hints = (new_tab) => { const a = link_hints_actor();
if (((_truthy) => _truthy !== false && _truthy != null)(a)) {
  (vs["link-hints-active"] = true);
  return (() => { try {
    return a.sendQuery("LinkHints:Show", {newTab: new_tab}).then((r) => { if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(r)) || ($$bc$equiv(r.count, 0))))) {
  return (vs["link-hints-active"] = false);
} }, (__e) => (vs["link-hints-active"] = false));
  } catch (__e) {
    return (vs["link-hints-active"] = false);
  } })();
} };
  const handle_link_hints_key = (e) => { if (($$bc$equiv(e.key, "Escape"))) {
  return end_link_hints(true);
} else {
  const k = e.key;
  if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(k.length, 1)) || ($$bc$equiv(e.key, "Backspace"))))) {
    const a = link_hints_actor();
    if (((_truthy) => _truthy !== false && _truthy != null)(a)) {
      return (() => { try {
    return a.sendQuery("LinkHints:Key", {key: k}).then((r) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(r.state, "active"))) : _logical))(r))) {
  (vs["link-hints-active"] = false);
}
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? r.newTab : _logical))(r.url) : _logical))(r))) {
  return (() => { try {
    return window.openTrustedLinkIn(r.url, "tab");
  } catch (__e) {
    return null;
  } })();
} }, (__e) => (vs["link-hints-active"] = false));
  } catch (__e) {
    return (vs["link-hints-active"] = false);
  } })();
    }
  }
} };
  const start_visual = () => { const a = link_hints_actor();
if (((_truthy) => _truthy !== false && _truthy != null)(a)) {
  (vs["visual-active"] = true);
  return (() => { try {
    return a.sendQuery("Visual:Start", {}).then((r) => { if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(r)) || (!((_truthy) => _truthy !== false && _truthy != null)(r.ok))))) {
  return (vs["visual-active"] = false);
} }, (__e) => (vs["visual-active"] = false));
  } catch (__e) {
    return (vs["visual-active"] = false);
  } })();
} };
  const end_visual = (yank_p) => { (vs["visual-active"] = false);
const a = link_hints_actor();
if (((_truthy) => _truthy !== false && _truthy != null)(a)) {
  return (yank_p ? (() => { try {
    return a.sendQuery("Visual:Yank").then((r) => { if (((_truthy) => _truthy !== false && _truthy != null)(r)) {
  return modeline_msg(("".concat("yanked ", r.len, " chars")), 2000);
} });
  } catch (__e) {
    return null;
  } })() : (() => { try {
    return a.sendQuery("Visual:Cancel");
  } catch (__e) {
    return null;
  } })());
} };
  const visual_move_of = (k) => ((($$bc$equiv(k, "h"))) ? {dir: "left", unit: "character"} : (($$bc$equiv(k, "l"))) ? {dir: "right", unit: "character"} : (($$bc$equiv(k, "j"))) ? {dir: "forward", unit: "line"} : (($$bc$equiv(k, "k"))) ? {dir: "backward", unit: "line"} : (($$bc$equiv(k, "w"))) ? {dir: "forward", unit: "word"} : (($$bc$equiv(k, "b"))) ? {dir: "backward", unit: "word"} : (($$bc$equiv(k, "0"))) ? {dir: "backward", unit: "lineboundary"} : (($$bc$equiv(k, "$"))) ? {dir: "forward", unit: "lineboundary"} : null);
  const handle_visual_key = (e) => { const k = e.key;
return ((($$bc$equiv(e.key, "Escape"))) ? end_visual(false) : (($$bc$equiv(k, "y"))) ? end_visual(true) : (() => { const mv = visual_move_of(k); if (((_truthy) => _truthy !== false && _truthy != null)(mv)) {
  const a = link_hints_actor();
  if (((_truthy) => _truthy !== false && _truthy != null)(a)) {
    return (() => { try {
    return a.sendQuery("Visual:Move", mv);
  } catch (__e) {
    return null;
  } })();
  }
} })()); };
  const focus_content = () => gBrowser.selectedBrowser.focus();
  const pane_switch = (key) => { const k = key.toLowerCase();
return ((($$bc$equiv(k, "h"))) ? focus_panel() : (($$bc$equiv(k, "l"))) ? focus_content() : (($$bc$equiv(k, "w"))) ? (($$bc$equiv(document.activeElement, state.panel)) ? focus_content() : focus_panel()) : null); };
  const go_to_end = (idx) => { const visible = all_rows().filter((_pct1) => (!((_truthy) => _truthy !== false && _truthy != null)(_pct1.hidden)));
const visible_count = visible.length;
if ((visible_count > 0)) {
  const r = visible[((idx < 0) ? (visible_count + idx) : idx)];
  set_cursor(r);
  if (((_truthy) => _truthy !== false && _truthy != null)(r._tab)) {
    return (gBrowser.selectedTab = r._tab);
  }
} };
  const go_to_top = () => go_to_end(0);
  const go_to_bottom = () => go_to_end(-1);
  const close_focused = () => { if ((selection.size > 1)) {
  const sel = Array.from(selection);
  const sel_count = sel.length;
  clearSelection();
  const last_r = sel[(sel_count - 1)];
  return (() => { function find_valid(n) { if (((_truthy) => _truthy !== false && _truthy != null)(n)) {
  return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : (($$bc$equiv(n, state.spacer)) || sel.includes(n))))(n.hidden)) ? find_valid(n.nextElementSibling) : n);
} } const next = find_valid(last_r.nextElementSibling);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(next, state.spacer))) : _logical))(next))) {
  set_cursor(next);
}
(() => { let i = (sel_count - 1); while (true) {
    if ((i >= 0)) { (() => { const row = sel[i]; if (((_truthy) => _truthy !== false && _truthy != null)(row._tab)) {
  return gBrowser.removeTab(row._tab);
} else {
  if (((_truthy) => _truthy !== false && _truthy != null)(row._group)) {
    return row.remove();
  }
} })(); const _recur_0 = (i - 1); i = _recur_0; continue; } else { return null; }
  } })();
rows.updateVisibility();
return scheduleSave(); })();
} else {
  if (((_truthy) => _truthy !== false && _truthy != null)(state.cursor)) {
    if (((_truthy) => _truthy !== false && _truthy != null)(state.cursor._tab)) {
      return gBrowser.removeTab(state.cursor._tab);
    } else {
      if (((_truthy) => _truthy !== false && _truthy != null)(state.cursor._group)) {
        const d = state.cursor._group;
        const my_level = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(d.level);
        const group_id = d.id;
        Array.from(gBrowser.tabs).forEach((tab) => { const td = tree_data_bang(tab);
if (($$bc$equiv(td.parentId, group_id))) {
  return (td.parentId = null);
} });
        (() => { function dec_groups(nxt) { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(nxt, state.spacer))) : _logical))(nxt))) {
  const lv = level_of_row_bang(nxt);
  if ((lv > my_level)) {
    if (((_truthy) => _truthy !== false && _truthy != null)(nxt._group)) {
      (nxt._group.level = (() => { const nxt_level = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(nxt._group.level); return Math.max(0, (nxt_level - 1)); })());
      rows.syncGroupRow(nxt);
    }
    return dec_groups(nxt.nextElementSibling);
  }
} } return dec_groups(state.cursor.nextElementSibling); })();
        const dying = state.cursor;
        if ((!move_cursor(1))) {
          move_cursor(-1);
        }
        dying.remove();
        rows.updateVisibility();
        return scheduleSave();
      }
    }
  }
} };
  const clone_as_sibling = (tab) => { const source_row = row_of.get(tab);
if (((_truthy) => _truthy !== false && _truthy != null)(source_row)) {
  const sibling_parent_id = tree_data_bang(tab).parentId;
  (vs["pending-cursor-move"] = true);
  const clone = gBrowser.duplicateTab(tab);
  const obs = new MutationObserver(() => { const clone_row = row_of.get(clone);
if (((_truthy) => _truthy !== false && _truthy != null)(clone_row)) {
  obs.disconnect();
  (tree_data_bang(clone).parentId = sibling_parent_id);
  const st = subtree_rows_bang(source_row);
  const st_count = st.length;
  st[(st_count - 1)].after(clone_row);
  rows.syncTabRow(clone);
  rows.updateVisibility();
  return scheduleSave();
} });
  return obs.observe(state.panel, {childList: true});
} };
  const build_window_items = (filter_fn) => { const items = [];
Array.from(gBrowser.tabs).forEach((tab) => { if (filter_fn(tab)) {
  const td = tree_of.get(tab);
  if (((_truthy) => _truthy !== false && _truthy != null)(td)) {
    const url = tab_spec(tab);
    const host = (() => { try {
    return new URL(url).hostname;
  } catch (__e) {
    return "";
  } })();
    const icon = (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(url, ""))) : _logical))(url)) ? ("".concat("page-icon:", url)) : undefined);
    return items.push({display: ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : "(untitled)"))(tab.label)))(td.name), secondary: ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(url)))(host), icon: icon, id: td.id, parentId: (($$bc$equiv(typeof td.parentId, "number")) ? td.parentId : null), depth: level_of_bang(tab), data: tab});
  }
} });
return items; };
  const open_tabs_picker = (scope) => { const gjoa_api = window.Gjoa;
if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(scope, "all")) && gjoa_api))) {
  const all_tabs = gjoa_api.tabs.all();
  if (($$bc$equiv(all_tabs.length, 0))) {
    return modeline_msg("No tabs", 3000);
  } else {
    const window_labels = new Map();
    all_tabs.forEach((t) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(window_labels.has(t.windowId)))) {
  return window_labels.set(t.windowId, ("".concat("Window ", (window_labels.size + 1))));
} });
    const items = all_tabs.map((t) => { const w_label = ((_logical) => (_logical !== false && _logical != null ? _logical : "Window ?"))(window_labels.get(t.windowId));
const host = (() => { try {
    return new URL(t.url).hostname;
  } catch (__e) {
    return "";
  } })();
return {display: ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : "(untitled)"))(t.label)))(t.customName), secondary: (((_truthy) => _truthy !== false && _truthy != null)(host) ? ("".concat(host, "  ·  ", w_label)) : w_label), data: {id: t.id, windowId: t.windowId}}; });
    return picker.show({prompt: "tabs (all windows) >", items: items, preserveTree: false, onSelect: (item) => { const d = item.data;
return (() => { try {
    return gjoa_api.tabs.activate(d.id, d.windowId);
  } catch (__e) {
    return null;
  } })(); }});
  }
} else {
  const filter_fn = (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(scope, "space")) && spaces)) ? (_pct1) => spaces.isVisible(_pct1) : (_pct1) => { _pct1;
return true; });
  const prompt_label = (($$bc$equiv(scope, "space")) ? ("".concat("tabs (", spaces.active().name, ") >")) : "tabs (window) >");
  const items = build_window_items(filter_fn);
  return (($$bc$equiv(items.length, 0)) ? modeline_msg("No tabs", 3000) : picker.show({prompt: prompt_label, items: items, preserveTree: true, onSelect: (_pct1) => (() => { try {
    return (gBrowser.selectedTab = _pct1.data);
  } catch (__e) {
    return null;
  } })(), actions: [{label: "Close", key: "x", run: (_pct1) => (() => { try {
    return gBrowser.removeTab(_pct1.data);
  } catch (__e) {
    return null;
  } })()}, {label: "Duplicate", key: "d", run: (_pct1) => (() => { try {
    return gBrowser.duplicateTab(_pct1.data);
  } catch (__e) {
    return null;
  } })()}, {label: "Pin / Unpin", key: "p", run: (_pct1) => (() => { try {
    return (((_truthy) => _truthy !== false && _truthy != null)(_pct1.data.pinned) ? gBrowser.unpinTab(_pct1.data) : gBrowser.pinTab(_pct1.data));
  } catch (__e) {
    return null;
  } })()}, {label: "Reload", key: "r", run: (_pct1) => (() => { try {
    return gBrowser.reloadTab(_pct1.data);
  } catch (__e) {
    return null;
  } })()}]}));
} };
  const label_of = (tag) => { if (((_truthy) => _truthy !== false && _truthy != null)(tag)) {
  const i = tag.indexOf(":");
  return ((i >= 0) ? tag.slice((i + 1)) : tag);
} };
  const tag_kind = (tag) => { if (((_truthy) => _truthy !== false && _truthy != null)(tag)) {
  return (((_truthy) => _truthy !== false && _truthy != null)(tag.startsWith("checkpoint:")) ? "checkpoint" : "session");
} };
  const relative_time = (ts) => { const now = Date.now();
const delta = (now - ts);
const mins = Math.floor((delta / 60000));
return (((mins < 1)) ? "just now" : ((mins < 60)) ? ("".concat(mins, "m ago")) : (() => { const hrs = Math.floor((mins / 60)); return (((hrs < 24)) ? ("".concat(hrs, "h ago")) : (() => { const days = Math.floor((hrs / 24)); return ((($$bc$equiv(days, 1))) ? "yesterday" : ((days < 7)) ? ("".concat(days, "d ago")) : (() => { const weeks = Math.floor((days / 7)); return ((weeks < 5) ? ("".concat(weeks, "w ago")) : new Date(ts).toLocaleDateString([], {month: "short", day: "numeric"})); })()); })()); })()); };
  const top_hosts = (nodes, max_count) => { const mx = (($$bc$equiv(max_count, undefined)) ? 3 : max_count);
const seen = new Set();
const hosts = [];
nodes.forEach((n) => { if (((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(n.type, "group"))) && ((_logical) => (_logical !== false && _logical != null ? (hosts.length < mx) : _logical))(n.url)))) {
  const host = (() => { try {
    return new URL(n.url).hostname.replace(new RegExp("^www\\."), "");
  } catch (__e) {
    return "";
  } })();
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!($$bc$equiv(host, "newtab"))) && (!((_truthy) => _truthy !== false && _truthy != null)(seen.has(host)))) : _logical))(host))) {
    seen.add(host);
    return hosts.push(host);
  }
} });
return hosts; };
  const tab_count = (nodes) => nodes.filter((_pct1) => (!($$bc$equiv(_pct1.type, "group")))).length;
  const event_has_space = (ev, space_id) => { const snap = ev.snapshot;
const ts = ((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? snap.spaces.tabSpaces : _logical))(snap.spaces) : _logical))(snap);
return ((ts == null) ? true : ts.some((_pct1) => ($$bc$equiv(_pct1[1], space_id)))); };
  const history_picker_item = (ev) => { const nodes = ((_logical) => (_logical !== false && _logical != null ? _logical : []))(ev.snapshot.nodes);
const count = tab_count(nodes);
const hosts = top_hosts(nodes, 3);
const tag = label_of(ev.tag);
const when_str = relative_time(ev.timestamp);
const display = (((_truthy) => _truthy !== false && _truthy != null)(tag) ? ("".concat(tag, "  --  ", ((_logical) => (_logical !== false && _logical != null ? _logical : "empty"))(hosts.join(", ")))) : ((_logical) => (_logical !== false && _logical != null ? _logical : "(empty)"))(hosts.join(", ")));
const parts = [when_str, ("".concat(count, " tab", ((!($$bc$equiv(count, 1))) ? "s" : "")))];
if (((_truthy) => _truthy !== false && _truthy != null)(tag)) {
  parts.unshift((($$bc$equiv(tag_kind(ev.tag), "checkpoint")) ? "checkpoint" : "session"));
}
return {display: display, secondary: parts.join(" . "), data: ev}; };
  const session_picker_item = (ev) => { const nodes = ((_logical) => (_logical !== false && _logical != null ? _logical : []))(ev.snapshot.nodes);
const count = tab_count(nodes);
const hosts = top_hosts(nodes, 4);
const kind = tag_kind(ev.tag);
const label = ((_logical) => (_logical !== false && _logical != null ? _logical : "untitled"))(label_of(ev.tag));
const when_str = relative_time(ev.timestamp);
const parts = [];
if (($$bc$equiv(kind, "checkpoint"))) {
  parts.push("checkpoint");
}
parts.push(when_str, ("".concat(count, " tab", ((!($$bc$equiv(count, 1))) ? "s" : ""))));
if (((_truthy) => _truthy !== false && _truthy != null)(hosts.length)) {
  parts.push(hosts.join(", "));
}
return {display: label, secondary: parts.join(" . "), data: ev}; };
  const restore_event = (event) => { const env = event.snapshot;
const tab_nodes = env.nodes.filter((_pct1) => (!($$bc$equiv(_pct1.type, "group"))));
const tab_space_map = new Map();
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? env.spaces.tabSpaces : _logical))(env.spaces))) {
  env.spaces.tabSpaces.forEach((_pct1) => tab_space_map.set(_pct1[0], _pct1[1]));
}
if (($$bc$equiv(tab_nodes.length, 0))) {
  modeline_msg("Restore: no tabs in event", 3000);
  return null;
} else {
  const max_saved_id = Math.max.apply(null, [0].concat(tab_nodes.map((_pct1) => ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(_pct1.id))));
  const offset = state.nextTabId;
  (state.nextTabId = (offset + max_saved_id + 1));
  const group_name = ((_logical) => (_logical !== false && _logical != null ? _logical : ("".concat("Restored ", new Date(event.timestamp).toLocaleString()))))(label_of(event.tag));
  const group_row = rows.createGroupRow(group_name, 0);
  state.panel.insertBefore(group_row, state.spacer);
  rows.syncAnyRow(group_row);
  tab_nodes.forEach((n) => { const saved_id = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(n.id);
const new_id = (saved_id + offset);
const saved_parent_id = n.parentId;
const new_parent_id = ((typeof saved_parent_id === 'number') ? (saved_parent_id + offset) : group_row._group.id);
const orig_space = tab_space_map.get(((_logical) => (_logical !== false && _logical != null ? _logical : 0))(n.id));
return saved_tab_queue.push({type: n.type, url: n.url, name: n.name, id: new_id, parentId: new_parent_id, state: n.state, collapsed: n.collapsed, spaceId: orig_space, _origIdx: saved_tab_queue.length}); });
  tab_nodes.forEach((n) => { const url = ((_logical) => (_logical !== false && _logical != null ? _logical : "about:blank"))(n.url);
return (() => { try {
    return gBrowser.addTab(url, {triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()});
  } catch (e) {
    return log("restore:addTab-failed", {url: url, err: ("".concat(e))});
  } })(); });
  return scheduleSave();
} };
  const execute_refile = (target) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(target, vs["refile-source"]))) : _logical))(target) : _logical))(vs["refile-source"]))) {
  const src_rows = subtree_rows_bang(vs["refile-source"]);
  if (((_truthy) => _truthy !== false && _truthy != null)(src_rows.includes(target))) {
    return modeline_msg("Can't refile under own subtree", 3000);
  } else {
    const src_data = data_of_bang(vs["refile-source"]);
    const tgt_data = data_of_bang(target);
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? tgt_data : _logical))(src_data))) {
      if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? target._tab : _logical))(vs["refile-source"]._tab))) {
        (tree_data_bang(vs["refile-source"]._tab).parentId = tree_data_bang(target._tab).id);
      } else {
        const tgt_level = level_of_row_bang(target);
        const src_level = level_of_row_bang(vs["refile-source"]);
        const delta = ((tgt_level + 1) - src_level);
        src_rows.forEach((r) => { if (((_truthy) => _truthy !== false && _truthy != null)(r._group)) {
  const group_level = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(r._group.level);
  return (r._group.level = Math.max(0, (group_level + delta)));
} });
      }
      const tgt_sub = subtree_rows_bang(target);
      const tgt_sub_count = tgt_sub.length;
      insert_after_each_bang(tgt_sub[(tgt_sub_count - 1)], src_rows);
      src_rows.forEach((_pct1) => rows.syncAnyRow(_pct1));
      rows.updateVisibility();
      scheduleSave();
      const label = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : "tab"))((() => { const some_thread____19 = vs; if ((some_thread____19 == null)) {
  return null;
} else {
  const some_thread____20 = some_thread____19["refile-source"];
  if ((some_thread____20 == null)) {
    return null;
  } else {
    const some_thread____21 = some_thread____20._tab;
    return ((some_thread____21 == null) ? null : some_thread____21.label);
  }
} })())))(src_data.name);
      const tgt_label = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : "tab"))((() => { const some_thread____22 = target; if ((some_thread____22 == null)) {
  return null;
} else {
  const some_thread____23 = some_thread____22._tab;
  return ((some_thread____23 == null) ? null : some_thread____23.label);
} })())))(tgt_data.name);
      modeline_msg(("".concat("Refiled \"", label, "\" -> \"", tgt_label, "\"")), 3000);
      (vs["refile-source"] = null);
      (vs["search-matches"] = []);
      return (vs["search-idx"] = -1);
    }
  }
} };
  const cancel_refile = () => { if (((_truthy) => _truthy !== false && _truthy != null)(vs["refile-source"])) {
  (vs["refile-source"] = null);
  (vs["search-matches"] = []);
  (vs["search-idx"] = -1);
  return modeline_msg("Refile cancelled", 3000);
} };
  const clear_filter = () => { all_rows().forEach((_pct1) => (_pct1.hidden = false));
return rows.updateVisibility(); };
  const apply_filter = (query) => { const q = query.trim().toLowerCase();
if ((!((_truthy) => _truthy !== false && _truthy != null)(q))) {
  return clear_filter();
} else {
  const all_r = all_rows();
  const matched = new Set();
  all_r.forEach((row) => { const d = data_of_bang(row);
if (((_truthy) => _truthy !== false && _truthy != null)(d)) {
  const label = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((((_truthy) => _truthy !== false && _truthy != null)(row._tab) ? row._tab.label : ""))))(d.name).toLowerCase();
  const url = tab_spec(row._tab).toLowerCase();
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : url.includes(q)))(label.includes(q)))) {
    return matched.add(row);
  }
} });
  (() => { function walk_anc(prev, lv_ref) { if (((_truthy) => _truthy !== false && _truthy != null)(prev)) {
  const plv = level_of_row_bang(prev);
  if ((plv < lv_ref.v)) {
    matched.add(prev);
    (lv_ref.v = plv);
  }
  if ((!($$bc$equiv(plv, 0)))) {
    return walk_anc(prev.previousElementSibling, lv_ref);
  }
} } return Array.from(matched).forEach((row) => walk_anc(row.previousElementSibling, {v: level_of_row_bang(row)})); })();
  return all_r.forEach((_pct1) => (_pct1.hidden = (!((_truthy) => _truthy !== false && _truthy != null)(matched.has(_pct1)))));
} };
  const teardown_search_ui = () => { if (((_truthy) => _truthy !== false && _truthy != null)(vs["search-input"])) {
  vs["search-input"].remove();
}
(vs["search-input"] = null);
const pfx = (() => { const some_thread____24 = vs; if ((some_thread____24 == null)) {
  return null;
} else {
  const some_thread____25 = some_thread____24.modeline;
  return ((some_thread____25 == null) ? null : some_thread____25.querySelector(".gjoa-search-prefix"));
} })();
if (((_truthy) => _truthy !== false && _truthy != null)(pfx)) {
  pfx.remove();
}
show_children_bang(vs.modeline);
return update_modeline(); };
  const end_search = (accept) => { (vs["search-active"] = false);
if (accept) {
  const q = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____26 = vs; if ((some_thread____26 == null)) {
  return null;
} else {
  const some_thread____27 = some_thread____26["search-input"];
  if ((some_thread____27 == null)) {
    return null;
  } else {
    const some_thread____28 = some_thread____27.value;
    if ((some_thread____28 == null)) {
      return null;
    } else {
      const some_thread____29 = some_thread____28.trim();
      return ((some_thread____29 == null) ? null : some_thread____29.toLowerCase());
    }
  }
} })());
  (vs["search-matches"] = []);
  (vs["search-idx"] = -1);
  const excluded = (((_truthy) => _truthy !== false && _truthy != null)(vs["refile-source"]) ? new Set(subtree_rows_bang(vs["refile-source"])) : null);
  if (((_truthy) => _truthy !== false && _truthy != null)(q)) {
    all_rows().forEach((row) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? excluded.has(row) : _logical))(excluded)))) {
  const d = data_of_bang(row);
  if (((_truthy) => _truthy !== false && _truthy != null)(d)) {
    const label = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((((_truthy) => _truthy !== false && _truthy != null)(row._tab) ? row._tab.label : ""))))(d.name).toLowerCase();
    const url = tab_spec(row._tab).toLowerCase();
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : url.includes(q)))(label.includes(q)))) {
      return vs["search-matches"].push(row);
    }
  }
} });
  }
  const dtc = {v: false};
  if (($$bc$equiv(vs["search-matches"].length, 1))) {
    const match = vs["search-matches"][0];
    set_cursor(match);
    if (((_truthy) => _truthy !== false && _truthy != null)(match._tab)) {
      (gBrowser.selectedTab = match._tab);
    }
    if (((_truthy) => _truthy !== false && _truthy != null)(vs["refile-source"])) {
      execute_refile(match);
    } else {
      (vs["panel-active"] = false);
      (vs["search-matches"] = []);
      (vs["search-idx"] = -1);
      sidebarMain.dispatchEvent(new Event("gjoa-dismiss"));
      (dtc.v = true);
    }
  } else {
    if ((vs["search-matches"].length > 0)) {
      (vs["search-idx"] = 0);
      const fm = vs["search-matches"][0];
      set_cursor(fm);
      if (((_truthy) => _truthy !== false && _truthy != null)(fm._tab)) {
        (gBrowser.selectedTab = fm._tab);
      }
      const hint = (((_truthy) => _truthy !== false && _truthy != null)(vs["refile-source"]) ? "  Enter=refile, n/N=cycle" : "");
      modeline_msg(("".concat("/", q, "  [1/", vs["search-matches"].length, "]", hint)), 3000);
    } else {
      if (((_truthy) => _truthy !== false && _truthy != null)(vs["refile-source"])) {
        modeline_msg("No refile targets found", 3000);
      }
    }
  }
  clear_filter();
  teardown_search_ui();
  if ((!((_truthy) => _truthy !== false && _truthy != null)(dtc.v))) {
    return focus_panel();
  }
} else {
  (vs["search-matches"] = []);
  (vs["search-idx"] = -1);
  clear_filter();
  if (((_truthy) => _truthy !== false && _truthy != null)(vs["refile-source"])) {
    cancel_refile();
  }
  teardown_search_ui();
  return focus_panel();
} };
  const start_search = () => { if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(vs["search-active"])) && vs.modeline))) {
  (vs["search-active"] = true);
  hide_children_bang(vs.modeline);
  vs.modeline.setAttribute("gjoa-visible", "true");
  const input = (() => { const __e____scope__13__1__4__1__269__3__5__1__2__1__0 = document.createElement("input"); (__e____scope__13__1__4__1__269__3__5__1__2__1__0.className = "gjoa-search-input");
return __e____scope__13__1__4__1__269__3__5__1__2__1__0; })();
  (vs["search-input"] = input);
  (input.placeholder = "");
  vs.modeline.appendChild(input);
  input.focus();
  const prefix = (() => { const __e____scope__13__1__4__1__269__3__5__6__1__2__1__0 = document.createXULElement("label"); (__e____scope__13__1__4__1__269__3__5__6__1__2__1__0.className = "gjoa-search-prefix");
return __e____scope__13__1__4__1__269__3__5__6__1__2__1__0; })();
  prefix.setAttribute("value", "/");
  vs.modeline.insertBefore(prefix, input);
  input.addEventListener("input", () => apply_filter(input.value));
  return input.addEventListener("keydown", (e) => { e.stopImmediatePropagation();
e.stopPropagation();
return ((($$bc$equiv(e.key, "Escape"))) ? end_search(false) : (($$bc$equiv(e.key, "Enter"))) ? end_search(true) : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(e.key, "Backspace")) && (!((_truthy) => _truthy !== false && _truthy != null)(input.value))))) ? end_search(false) : null); });
} };
  const start_rename = (row) => { if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
  const label = row.querySelector(".gjoa-tab-label");
  if (((_truthy) => _truthy !== false && _truthy != null)(label)) {
    const d = data_of_bang(row);
    if (((_truthy) => _truthy !== false && _truthy != null)(d)) {
      const original = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((((_truthy) => _truthy !== false && _truthy != null)(row._tab) ? row._tab.label : ""))))(d.name);
      (label.textContent = original);
      label.setAttribute("contenteditable", "plaintext-only");
      label.classList.add("gjoa-renaming");
      (vs.renaming = true);
      label.style.removeProperty("overflow");
      label.style.removeProperty("text-overflow");
      label.focus();
      const sel = ((_logical) => (_logical !== false && _logical != null ? window.getSelection() : _logical))(window.getSelection);
      if (((_truthy) => _truthy !== false && _truthy != null)(sel)) {
        const range = document.createRange();
        range.selectNodeContents(label);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      const done_flag = {v: false};
      const finish = (commit) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(done_flag.v))) {
  (done_flag.v = true);
  const value = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(label.textContent).trim();
  label.removeAttribute("contenteditable");
  label.classList.remove("gjoa-renaming");
  (vs.renaming = false);
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? window.getSelection() : _logical))(window.getSelection))) {
    window.getSelection().removeAllRanges();
  }
  if (commit) {
    if (((_truthy) => _truthy !== false && _truthy != null)(row._group)) {
      (d.name = ((_logical) => (_logical !== false && _logical != null ? _logical : "New Group"))(value));
    } else {
      (d.name = (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(value, row._tab.label))) : _logical))(value)) ? value : null));
    }
    scheduleSave();
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(row._tab)) {
    rows.syncTabRow(row._tab);
  } else {
    rows.syncAnyRow(row);
  }
  return state.panel.focus();
} };
      label.addEventListener("keydown", (e) => { if (($$bc$equiv(e.key, "Enter"))) {
  e.preventDefault();
  finish(true);
  focus_panel();
}
if (($$bc$equiv(e.key, "Escape"))) {
  e.preventDefault();
  finish(false);
  focus_panel();
}
return e.stopPropagation(); });
      const __el____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__0 = label;
      const __ev____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__3 = "blur";
      const __h____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__6 = () => finish(true);
      __el____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__0.addEventListener(__ev____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__3, __h____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__6, {once: true});
      if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(__ev____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__3, "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__0.__gjoaHR.teardowns : _logical))(__el____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__0.__gjoaHR)))) {
        __el____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__0.__gjoaHR.teardowns.push(__h____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__6);
      }
      return __h____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__6;
    }
  }
} };
  const cycle_space = (dir) => { const list = spaces.list();
const space_count = list.length;
if ((space_count < 2)) {
  return modeline_msg("Only one space -- :space new <name> to add", 2500);
} else {
  const cur = spaces.activeId();
  const idx = list.findIndex((_pct1) => ($$bc$equiv(_pct1.id, cur)));
  const next_idx = ((((idx + dir) % space_count) + space_count) % space_count);
  const next = list[next_idx];
  spaces.setActive(next.id);
  return modeline_msg(("".concat(":space -> \"", next.name, "\"")), 1500);
} };
  const end_ex_mode = (cmd) => { const sp = vs.modeline.querySelector(".gjoa-search-prefix");
if (((_truthy) => _truthy !== false && _truthy != null)(sp)) {
  sp.remove();
}
const si = vs.modeline.querySelector(".gjoa-search-input");
if (((_truthy) => _truthy !== false && _truthy != null)(si)) {
  si.remove();
}
show_children_bang(vs.modeline);
update_modeline();
if (((_truthy) => _truthy !== false && _truthy != null)(cmd)) {
  const args = cmd.split(new RegExp("\\s+"));
  const name = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(args[0]).toLowerCase();
  return ((((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(name, "group")) || (($$bc$equiv(name, "grp")) || ($$bc$equiv(name, "folder")))))) ? (() => { const label = ((_logical) => (_logical !== false && _logical != null ? _logical : "New Group"))(args.slice(1).join(" ")); const row = rows.createGroupRow(label, (((_truthy) => _truthy !== false && _truthy != null)(state.cursor) ? level_of_row_bang(state.cursor) : 0)); if (((_truthy) => _truthy !== false && _truthy != null)(state.cursor)) {
  const st = subtree_rows_bang(state.cursor);
  const st_count = st.length;
  st[(st_count - 1)].after(row);
} else {
  state.panel.insertBefore(row, state.spacer);
}
set_cursor(row);
rows.updateVisibility();
scheduleSave();
return modeline_msg(("".concat(":group ", label)), 3000); })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(name, "re")) || (($$bc$equiv(name, "refile")) || ($$bc$equiv(name, "rf")))))) ? ((!((_truthy) => _truthy !== false && _truthy != null)(state.cursor)) ? modeline_msg("No cursor -- place cursor on tab to refile", 3000) : (() => { (vs["refile-source"] = state.cursor);
const src_label = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : "tab"))((() => { const some_thread____32 = state; if ((some_thread____32 == null)) {
  return null;
} else {
  const some_thread____33 = some_thread____32.cursor;
  if ((some_thread____33 == null)) {
    return null;
  } else {
    const some_thread____34 = some_thread____33._tab;
    return ((some_thread____34 == null) ? null : some_thread____34.label);
  }
} })())))((() => { const some_thread____30 = state.cursor; if ((some_thread____30 == null)) {
  return null;
} else {
  const some_thread____31 = data_of_bang(some_thread____30);
  return ((some_thread____31 == null) ? null : some_thread____31.name);
} })());
modeline_msg(("".concat("Refile: \"", src_label, "\" -> search for target...")), 3000);
return setTimeout(() => start_search(), 0); })()) : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(name, "pin")) || ($$bc$equiv(name, "unpin"))))) ? (() => { const t = (() => { const some_thread____35 = state; if ((some_thread____35 == null)) {
  return null;
} else {
  const some_thread____36 = some_thread____35.cursor;
  return ((some_thread____36 == null) ? null : some_thread____36._tab);
} })(); const want_pin = ($$bc$equiv(name, "pin")); if ((t == null)) {
  return modeline_msg("No tab at cursor", 3000);
} else {
  if (($$bc$equiv(t.pinned, want_pin))) {
    return modeline_msg(("".concat((want_pin ? "Already pinned" : "Not pinned"), ": ", t.label)), 2000);
  } else {
    if (want_pin) {
      gBrowser.pinTab(t);
    } else {
      gBrowser.unpinTab(t);
    }
    return modeline_msg(("".concat(":", name, " ", t.label)), 3000);
  }
} })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(name, "checkpoint")) || ($$bc$equiv(name, "cp"))))) ? (() => { const label = args.slice(1).join(" ").trim(); if ((!((_truthy) => _truthy !== false && _truthy != null)(label))) {
  return modeline_msg("Usage: :checkpoint <label>", 3000);
} else {
  scheduleSave();
  return setTimeout(() => history.tagLatest("checkpoint", label).then((_pct1) => modeline_msg((((_truthy) => _truthy !== false && _truthy != null)(_pct1) ? ("".concat(":checkpoint \"", label, "\"")) : "Nothing to tag (no events yet)"), 3000)).catch((_pct1) => modeline_msg(("".concat(":checkpoint failed: ", _pct1.message)), 4000)), 100);
} })() : (($$bc$equiv(name, "restore"))) ? (() => { const arg = args.slice(1).join(" ").trim(); return history.getTagged(100).then((tagged) => { if (($$bc$equiv(tagged.length, 0))) {
  return modeline_msg("No tagged sessions yet", 4000);
} else {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(arg))) {
    return picker.show({prompt: "restore >", items: tagged.map((_pct1) => session_picker_item(_pct1)), onSelect: (item) => restore_event(item.data).then(() => modeline_msg(("".concat("Restored: ", label_of(item.data.tag))), 4000)).catch((_pct1) => modeline_msg(("".concat(":restore failed: ", _pct1.message)), 4000))});
  } else {
    const needle = arg.toLowerCase();
    const matches = tagged.filter((_pct1) => ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(label_of(_pct1.tag)).toLowerCase().includes(needle));
    return (($$bc$equiv(matches.length, 0)) ? modeline_msg(("".concat("No sessions match \"", arg, "\"")), 3000) : restore_event(matches[0]).then(() => modeline_msg(("".concat("Restored: ", label_of(matches[0].tag))), 4000)).catch((_pct1) => modeline_msg(("".concat(":restore failed: ", _pct1.message)), 4000)));
  }
} }, .catch[(_pct1) => modeline_msg(("".concat(":restore failed: ", _pct1.message)), 4000)]()); })() : (($$bc$equiv(name, "tabs"))) ? (() => { const sub = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(args[1]).toLowerCase(); const scope = ((((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(sub, "all")) || ($$bc$equiv(sub, "*"))))) ? "all" : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(sub, "window")) || ($$bc$equiv(sub, "win"))))) ? "current" : "space"); return open_tabs_picker(scope); })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(name, "blacklist")) || ($$bc$equiv(name, "bl"))))) ? (() => { const sub = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(args[1]).toLowerCase(); return ((((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(sub, "list")) || ($$bc$equiv(sub, "ls"))))) ? (() => { const list = blacklisted_hosts(); return modeline_msg((((_truthy) => _truthy !== false && _truthy != null)(list.length) ? ("".concat("Blacklist: ", list.join(", "))) : "Blacklist is empty"), 5000); })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(sub, "remove")) || (($$bc$equiv(sub, "rm")) || ($$bc$equiv(sub, "del")))))) ? (() => { const host = ((_logical) => (_logical !== false && _logical != null ? _logical : current_host()))((() => { const some_thread____37 = args[2]; return ((some_thread____37 == null) ? null : some_thread____37.trim()); })()); return ((!((_truthy) => _truthy !== false && _truthy != null)(host)) ? modeline_msg("No host to remove", 3000) : modeline_msg((blacklist_remove(host) ? ("".concat("Removed: ", host)) : ("".concat("Not in blacklist: ", host))), 3000)); })() : (() => { const host = ((_logical) => (_logical !== false && _logical != null ? _logical : current_host()))((() => { const some_thread____38 = args[1]; return ((some_thread____38 == null) ? null : some_thread____38.trim()); })()); if ((!((_truthy) => _truthy !== false && _truthy != null)(host))) {
  return modeline_msg("No host to blacklist", 3000);
} else {
  blacklist_add(host);
  return modeline_msg(("".concat("Blacklisted: ", host)), 3000);
} })()); })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(name, "unblacklist")) || ($$bc$equiv(name, "ubl"))))) ? (() => { const host = ((_logical) => (_logical !== false && _logical != null ? _logical : current_host()))((() => { const some_thread____39 = args[1]; return ((some_thread____39 == null) ? null : some_thread____39.trim()); })()); return ((!((_truthy) => _truthy !== false && _truthy != null)(host)) ? modeline_msg("No host to remove", 3000) : modeline_msg((blacklist_remove(host) ? ("".concat("Removed: ", host)) : ("".concat("Not in blacklist: ", host))), 3000)); })() : (($$bc$equiv(name, "sessions"))) ? modeline_msg("Use :restore instead", 3000) : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(name, "sidebar-strip")) || ($$bc$equiv(name, "strip"))))) ? toggle_h_sidebar_strip() : (($$bc$equiv(name, "help"))) ? toggle_which_key() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(name, "bind")) || ($$bc$equiv(name, "map"))))) ? (() => { const k = (() => { const some_thread____40 = args[1]; return ((some_thread____40 == null) ? null : some_thread____40.trim()); })(); const cmd = (() => { const some_thread____41 = args[2]; return ((some_thread____41 == null) ? null : some_thread____41.trim()); })(); if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(k)) || (!((_truthy) => _truthy !== false && _truthy != null)(cmd))))) {
  return modeline_msg("usage: :bind <key> <command>  (commands: about:vim)", 5000);
} else {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(COMMAND_IDS.has(cmd)))) {
    return modeline_msg(("".concat("Unknown command: ", cmd, "  (see about:vim)")), 4500);
  } else {
    set_key_binding_bang(k, cmd);
    return modeline_msg(("".concat("Bound ", k, " → ", cmd)), 3000);
  }
} })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(name, "unbind")) || ($$bc$equiv(name, "unmap"))))) ? (() => { const k = (() => { const some_thread____42 = args[1]; return ((some_thread____42 == null) ? null : some_thread____42.trim()); })(); if ((!((_truthy) => _truthy !== false && _truthy != null)(k))) {
  return modeline_msg("usage: :unbind <key>", 4000);
} else {
  set_key_binding_bang(k, null);
  return modeline_msg(("".concat("Unbound ", k)), 3000);
} })() : (($$bc$equiv(name, "bindreset"))) ? (() => { (() => { try {
    return Services.prefs.setStringPref("gjoa.keys.bindings", "");
  } catch (__e____scope__13__1__4__1__278__7__2__2__28__1__2__1__0) {
    return null;
  } })();
return modeline_msg("Keybindings reset to defaults", 3000); })() : (($$bc$equiv(name, "tabpos"))) ? (() => { const valid = ["sibling", "root", "child"]; const arg = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(args[1]).toLowerCase(); if ((!((_truthy) => _truthy !== false && _truthy != null)(arg))) {
  const cur = Services.prefs.getCharPref("gjoa.tabs.newTabPosition", "sibling");
  return modeline_msg(("".concat(":tabpos = ", cur, " (options: sibling | root | child)")), 4000);
} else {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(valid.includes(arg)))) {
    return modeline_msg("Usage: :tabpos <sibling|root|child>", 3500);
  } else {
    Services.prefs.setCharPref("gjoa.tabs.newTabPosition", arg);
    return modeline_msg(("".concat(":tabpos -> ", arg)), 2500);
  }
} })() : (($$bc$equiv(name, "space"))) ? (() => { const sub = ((_logical) => (_logical !== false && _logical != null ? _logical : "list"))(args[1]).toLowerCase(); const rest = args.slice(2).join(" ").trim(); return ((($$bc$equiv(sub, "new"))) ? (() => { const sn = ((_logical) => (_logical !== false && _logical != null ? _logical : "Untitled"))(rest); const s = spaces.create(sn); spaces.setActive(s.id);
return modeline_msg(("".concat(":space new \"", s.name, "\" -> switched")), 2500); })() : (($$bc$equiv(sub, "rename"))) ? ((!((_truthy) => _truthy !== false && _truthy != null)(rest)) ? modeline_msg("Usage: :space rename <name>", 3000) : (() => { spaces.rename(spaces.activeId(), rest);
return modeline_msg(("".concat(":space rename \"", rest, "\"")), 2500); })()) : (($$bc$equiv(sub, "delete"))) ? (() => { const cur = spaces.active(); const all = spaces.list(); if (((_truthy) => _truthy !== false && _truthy != null)(((all.length <= 1) || ($$bc$equiv(all[0].id, cur.id))))) {
  return modeline_msg("Can't delete the default space", 3000);
} else {
  spaces.delete(cur.id);
  return modeline_msg(("".concat(":space delete \"", cur.name, "\"")), 2500);
} })() : (($$bc$equiv(sub, "switch"))) ? ((!((_truthy) => _truthy !== false && _truthy != null)(rest)) ? modeline_msg("Usage: :space switch <name>", 3000) : (() => { const match = spaces.list().find((_pct1) => ($$bc$equiv(_pct1.name.toLowerCase(), rest.toLowerCase()))); if ((match == null)) {
  return modeline_msg(("".concat("No space named \"", rest, "\"")), 3000);
} else {
  spaces.setActive(match.id);
  return modeline_msg(("".concat(":space -> \"", match.name, "\"")), 2000);
} })()) : (() => { const items = spaces.list().map((s) => { const r = {display: s.name, secondary: (($$bc$equiv(s.id, spaces.activeId())) ? "(active)" : ""), data: s};
return r; }); return picker.show({prompt: "spaces >", items: items, onSelect: (item) => { spaces.setActive(item.data.id);
return modeline_msg(("".concat(":space -> \"", item.data.name, "\"")), 2000); }}); })()); })() : (($$bc$equiv(name, "history"))) ? (() => { const raw_args = args.slice(1); const space_scoped = ((raw_args.length > 0) && ($$bc$equiv(raw_args[0].toLowerCase(), "space"))); const q_args = (space_scoped ? raw_args.slice(1) : raw_args); const q = q_args.join(" ").trim(); const active_space = ((_logical) => (_logical !== false && _logical != null ? spaces.activeId() : _logical))(spaces); return ((((_truthy) => _truthy !== false && _truthy != null)(q) ? history.search(q, {taggedOnly: false, limit: 200}) : history.getRecent(200))).then((evs) => { const filtered = (((_truthy) => _truthy !== false && _truthy != null)((space_scoped && active_space)) ? evs.filter((_pct1) => event_has_space(_pct1, active_space)) : evs);
const display_evs = filtered.slice(0, 100);
return (($$bc$equiv(display_evs.length, 0)) ? modeline_msg((((_truthy) => _truthy !== false && _truthy != null)(q) ? ("".concat("No events match \"", q, "\"")) : "No history yet"), 3000) : picker.show({prompt: (space_scoped ? ("".concat("history (", spaces.active().name, ") >")) : "history >"), items: display_evs.map((_pct1) => history_picker_item(_pct1)), onSelect: (item) => { const ev = item.data;
return restore_event(ev).then(() => { const lbl = label_of(ev.tag);
return modeline_msg(("".concat("Restored: ", ((_logical) => (_logical !== false && _logical != null ? _logical : new Date(ev.timestamp).toLocaleString()))(lbl))), 4000); }).catch((_pct1) => modeline_msg(("".concat(":history restore failed: ", _pct1.message)), 4000)); }})); }).catch((_pct1) => modeline_msg(("".concat(":history failed: ", _pct1.message)), 4000)); })() : modeline_msg(("".concat("Unknown command: ", name)), 3000));
} };
  const open_ex_command_picker = () => { const items = EX_COMMANDS.map((cmd) => { const r = {display: ("".concat(":", cmd.name)), secondary: cmd.description, data: cmd};
return r; });
return picker.show({prompt: "ex >", items: items, filterItem: (item, q) => { const cmd = item.data;
const first_word = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(q.trim().toLowerCase().split(new RegExp("\\s+"))[0]);
if ((!((_truthy) => _truthy !== false && _truthy != null)(first_word))) {
  return true;
} else {
  const hay = ("".concat(cmd.name, " ", ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(item.secondary))).toLowerCase();
  return hay.includes(first_word);
} }, onSelect: (item, query) => { const cmd = item.data;
const q = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(query).trim();
const lower = q.toLowerCase();
const use_qa = ((_logical) => (_logical !== false && _logical != null ? _logical : ($$bc$equiv(lower, cmd.name.toLowerCase()))))(lower.startsWith(("".concat(cmd.name.toLowerCase(), " "))));
const ex_cmd = (use_qa ? q : cmd.name);
return end_ex_mode(ex_cmd); }}); };
  const command_handlers = (e, id) => ((($$bc$equiv(id, "tabsPicker"))) ? open_tabs_picker("space") : (($$bc$equiv(id, "tabsPickerAll"))) ? open_tabs_picker("all") : (($$bc$equiv(id, "exCommand"))) ? open_ex_command_picker() : (($$bc$equiv(id, "closeTab"))) ? (() => { try {
    return gBrowser.removeTab(gBrowser.selectedTab);
  } catch (__e) {
    return null;
  } })() : (($$bc$equiv(id, "urlbar"))) ? activate_urlbar("current") : (($$bc$equiv(id, "urlbarNewTab"))) ? activate_urlbar("newTab") : (($$bc$equiv(id, "lastTab"))) ? toggle_last_tab() : (($$bc$equiv(id, "back"))) ? (() => { try {
    return gBrowser.selectedBrowser.goBack();
  } catch (__e) {
    return null;
  } })() : (($$bc$equiv(id, "forward"))) ? (() => { try {
    return gBrowser.selectedBrowser.goForward();
  } catch (__e) {
    return null;
  } })() : (($$bc$equiv(id, "scrollDown"))) ? ((!((_truthy) => _truthy !== false && _truthy != null)(e.repeat)) ? (() => { return (() => { try {
    return (() => { const some_thread____43 = gBrowser; if ((some_thread____43 == null)) {
  return null;
} else {
  const some_thread____44 = some_thread____43.selectedBrowser;
  if ((some_thread____44 == null)) {
    return null;
  } else {
    const some_thread____45 = some_thread____44.browsingContext;
    if ((some_thread____45 == null)) {
      return null;
    } else {
      const some_thread____46 = some_thread____45.currentWindowGlobal;
      if ((some_thread____46 == null)) {
        return null;
      } else {
        const some_thread____47 = some_thread____46.getActor("GjoaInput");
        return ((some_thread____47 == null) ? null : some_thread____47.sendAsyncMessage("GjoaInput:ScrollStart", {dy: 1}));
      }
    }
  }
} })();
  } catch (__e) {
    return null;
  } })(); })() : null) : (($$bc$equiv(id, "scrollUp"))) ? ((!((_truthy) => _truthy !== false && _truthy != null)(e.repeat)) ? (() => { return (() => { try {
    return (() => { const some_thread____48 = gBrowser; if ((some_thread____48 == null)) {
  return null;
} else {
  const some_thread____49 = some_thread____48.selectedBrowser;
  if ((some_thread____49 == null)) {
    return null;
  } else {
    const some_thread____50 = some_thread____49.browsingContext;
    if ((some_thread____50 == null)) {
      return null;
    } else {
      const some_thread____51 = some_thread____50.currentWindowGlobal;
      if ((some_thread____51 == null)) {
        return null;
      } else {
        const some_thread____52 = some_thread____51.getActor("GjoaInput");
        return ((some_thread____52 == null) ? null : some_thread____52.sendAsyncMessage("GjoaInput:ScrollStart", {dy: -1}));
      }
    }
  }
} })();
  } catch (__e) {
    return null;
  } })(); })() : null) : (($$bc$equiv(id, "summonSidebar"))) ? (() => { const sb = document.getElementById("sidebar-container"); if (((_truthy) => _truthy !== false && _truthy != null)((() => { try {
    return Services.prefs.getBoolPref("gjoa.sidebar.compact", false);
  } catch (__e____scope__13__1__4__1__284__3__24__2__1__2__1__0) {
    return false;
  } })())) {
  if (((_truthy) => _truthy !== false && _truthy != null)(sb)) {
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : sb.hasAttribute("gjoa-has-hover")))(sb.hasAttribute("gjoa-pinned")))) {
      sb.removeAttribute("gjoa-pinned");
      return sb.removeAttribute("gjoa-has-hover");
    } else {
      return sb.setAttribute("gjoa-pinned", "true");
    }
  }
} else {
  if (((_truthy) => _truthy !== false && _truthy != null)(sb)) {
    sb.removeAttribute("gjoa-pinned");
  }
  return (() => { try {
    return Services.prefs.setBoolPref("gjoa.sidebar.compact", true);
  } catch (__e____scope__13__1__4__1__284__3__24__2__3__2__2__1__0) {
    return null;
  } })();
} })() : (($$bc$equiv(id, "anchorSidebar"))) ? (() => { const c = window.gjoaCompact; if (((_truthy) => _truthy !== false && _truthy != null)(c)) {
  return c.toggle();
} })() : (($$bc$equiv(id, "toggleStrip"))) ? toggle_h_sidebar_strip() : (($$bc$equiv(id, "help"))) ? toggle_which_key() : (($$bc$equiv(id, "linkHints"))) ? start_link_hints(false) : (($$bc$equiv(id, "linkHintsNewTab"))) ? start_link_hints(true) : (($$bc$equiv(id, "find"))) ? (() => { try {
    return gBrowser.getFindBar().then((fb) => { if (((_truthy) => _truthy !== false && _truthy != null)(fb)) {
  return fb.startFind(fb.FIND_NORMAL);
} });
  } catch (__e) {
    return null;
  } })() : (($$bc$equiv(id, "findNext"))) ? (() => { try {
    return gBrowser.getFindBar().then((fb) => { if (((_truthy) => _truthy !== false && _truthy != null)(fb)) {
  return fb.onFindAgainCommand(false);
} });
  } catch (__e) {
    return null;
  } })() : (($$bc$equiv(id, "findPrev"))) ? (() => { try {
    return gBrowser.getFindBar().then((fb) => { if (((_truthy) => _truthy !== false && _truthy != null)(fb)) {
  return fb.onFindAgainCommand(true);
} });
  } catch (__e) {
    return null;
  } })() : (($$bc$equiv(id, "visualMode"))) ? start_visual() : null);
  const try_dispatch_binding = (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : e.metaKey))(e.altKey)))(e.ctrlKey))) {
  return false;
} else {
  const id = effective_command_id(e.key, (() => { try {
    return Services.prefs.getStringPref("gjoa.keys.bindings", "");
  } catch (__e____scope__13__1__4__1__287__3__3__1__2__2__2__1__0) {
    return (() => { try {
    return Services.prefs.getCharPref("gjoa.keys.bindings", "");
  } catch (__e2____scope__13__1__4__1__287__3__3__1__2__2__2__2__2__1__0) {
    return "";
  } })();
  } })());
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? COMMAND_IDS.has(id) : _logical))(id))) {
    if ((!key_enabled(id))) {
      return false;
    } else {
      e.preventDefault();
      e.stopImmediatePropagation();
      command_handlers(e, id);
      return true;
    }
  } else {
    return false;
  }
} };
  const visual_move = (dir) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(vs["selection-anchor"]))) {
  (vs["selection-anchor"] = state.cursor);
}
if (((_truthy) => _truthy !== false && _truthy != null)((move_cursor(dir) && vs["selection-anchor"]))) {
  selectRange(vs["selection-anchor"]);
}
return true; };
  const handle_action_keys = (e) => ((($$bc$equiv(e.key, "Enter"))) ? (((_truthy) => _truthy !== false && _truthy != null)(vs["refile-source"]) ? (() => { if (((_truthy) => _truthy !== false && _truthy != null)(state.cursor)) {
  execute_refile(state.cursor);
}
return true; })() : (((_truthy) => _truthy !== false && _truthy != null)(state.cursor._tab) ? (() => { (gBrowser.selectedTab = state.cursor._tab);
blur_panel();
gBrowser.selectedBrowser.focus();
return true; })() : (() => { rows.toggleCollapse(state.cursor);
return true; })())) : (($$bc$equiv(e.key, "Tab"))) ? (() => { rows.toggleCollapse(state.cursor);
return true; })() : (($$bc$equiv(e.key, "Escape"))) ? (() => { if (((_truthy) => _truthy !== false && _truthy != null)(vs["refile-source"])) {
  cancel_refile();
}
return true; })() : (($$bc$equiv(e.key, "r"))) ? (() => { start_rename(state.cursor);
return true; })() : (($$bc$equiv(e.key, "G"))) ? (() => { go_to_bottom();
return true; })() : (($$bc$equiv(e.key, "x"))) ? (() => { close_focused();
return true; })() : (($$bc$equiv(e.key, ":"))) ? (() => { open_ex_command_picker();
return true; })() : (($$bc$equiv(e.key, "J"))) ? visual_move(1) : (($$bc$equiv(e.key, "K"))) ? visual_move(-1) : false);
  const handle_normal_key = (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(e.key, "J"))) && (!($$bc$equiv(e.key, "K")))))) {
  (vs["selection-anchor"] = null);
}
if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(state.cursor)) && "jklhG/rnNx".includes(e.key)))) {
  const row = row_of.get(gBrowser.selectedTab);
  if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
    set_cursor(row);
  }
}
return ((((_truthy) => _truthy !== false && _truthy != null)(vs["pending-ctrl-w"])) ? (() => { (vs["pending-ctrl-w"] = false);
clearTimeout(vs["chord-timer"]);
if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(e.key, "h")) || (($$bc$equiv(e.key, "H")) || (($$bc$equiv(e.key, "l")) || (($$bc$equiv(e.key, "L")) || (($$bc$equiv(e.key, "w")) || ($$bc$equiv(e.key, "W"))))))))) {
  pane_switch(e.key);
  return true;
} else {
  if (((_truthy) => _truthy !== false && _truthy != null)(gBrowser.selectedTab)) {
    gBrowser.removeTab(gBrowser.selectedTab);
  }
  return false;
} })() : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(e.key, "w")) || ($$bc$equiv(e.code, "KeyW"))) : _logical))(e.ctrlKey))) ? (() => { (vs["pending-ctrl-w"] = true);
(vs["chord-timer"] = setTimeout(() => { if (((_truthy) => _truthy !== false && _truthy != null)(vs["pending-ctrl-w"])) {
  (vs["pending-ctrl-w"] = false);
  if (((_truthy) => _truthy !== false && _truthy != null)(gBrowser.selectedTab)) {
    return gBrowser.removeTab(gBrowser.selectedTab);
  }
} }, CHORD_TIMEOUT));
return true; })() : (((_truthy) => _truthy !== false && _truthy != null)(vs.chord)) ? (() => { const combo = ("".concat(vs.chord, e.key)); (vs.chord = null);
clearTimeout(vs["chord-timer"]);
return ((($$bc$equiv(combo, "gg"))) ? (() => { go_to_top();
return true; })() : (($$bc$equiv(combo, "gC"))) ? (() => { if (((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____53 = state; if ((some_thread____53 == null)) {
  return null;
} else {
  const some_thread____54 = some_thread____53.cursor;
  return ((some_thread____54 == null) ? null : some_thread____54._tab);
} })())) {
  clone_as_sibling(state.cursor._tab);
}
return true; })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(combo, "gs")) || ($$bc$equiv(combo, "gS"))))) ? (() => { cycle_space((($$bc$equiv(combo, "gs")) ? 1 : -1));
return true; })() : true); })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(e.key, "g")) && ((!((_truthy) => _truthy !== false && _truthy != null)(e.shiftKey)) && ((!((_truthy) => _truthy !== false && _truthy != null)(e.ctrlKey)) && (!((_truthy) => _truthy !== false && _truthy != null)(e.altKey))))))) ? (() => { (vs.chord = e.key);
(vs["chord-timer"] = setTimeout(() => (vs.chord = null), CHORD_TIMEOUT));
return true; })() : (($$bc$equiv(e.key, "i"))) ? (() => { blur_panel();
gBrowser.selectedBrowser.focus();
return true; })() : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(e.key, "h")) || (($$bc$equiv(e.code, "KeyH")) || ($$bc$equiv(e.key, "ArrowLeft")))) : _logical))(e.altKey))) ? (() => { if (((_truthy) => _truthy !== false && _truthy != null)(state.cursor)) {
  const c = state.cursor;
  if (is_horizontal()) {
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? tree_data_bang(c._tab).parentId : _logical))(c._tab))) {
      unfold_left(c);
    } else {
      make_child_of_above(c);
    }
  } else {
    move_to_root(c);
  }
}
return true; })() : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(e.key, "l")) || (($$bc$equiv(e.code, "KeyL")) || ($$bc$equiv(e.key, "ArrowRight")))) : _logical))(e.altKey))) ? (() => { if (((_truthy) => _truthy !== false && _truthy != null)(state.cursor)) {
  const c = state.cursor;
  if (is_horizontal()) {
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? tree_data_bang(c._tab).parentId : _logical))(c._tab))) {
      unfold_right(c);
    } else {
      make_child_of_next(c);
    }
  } else {
    make_child_of_above(c);
  }
}
return true; })() : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(e.key, "j")) || (($$bc$equiv(e.code, "KeyJ")) || ($$bc$equiv(e.key, "ArrowDown")))) : _logical))(e.altKey))) ? (() => { if (((_truthy) => _truthy !== false && _truthy != null)(state.cursor)) {
  swap_down(state.cursor);
}
return true; })() : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(e.key, "k")) || (($$bc$equiv(e.code, "KeyK")) || ($$bc$equiv(e.key, "ArrowUp")))) : _logical))(e.altKey))) ? (() => { if (((_truthy) => _truthy !== false && _truthy != null)(state.cursor)) {
  if (is_horizontal()) {
    move_to_root(state.cursor);
  } else {
    swap_up(state.cursor);
  }
}
return true; })() : (() => { if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(state.cursor)) && "jklhG/rnNx".includes(e.key)))) {
  const row = row_of.get(gBrowser.selectedTab);
  if (((_truthy) => _truthy !== false && _truthy != null)(row)) {
    set_cursor(row);
  }
}
return ((!((_truthy) => _truthy !== false && _truthy != null)(state.cursor)) ? false : (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(e.ctrlKey)) && (!((_truthy) => _truthy !== false && _truthy != null)(e.metaKey)))) ? ((((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(e.key, "j")) || ($$bc$equiv(e.key, "ArrowDown"))))) ? (() => { move_cursor(1);
return true; })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(e.key, "k")) || ($$bc$equiv(e.key, "ArrowUp"))))) ? (() => { move_cursor(-1);
return true; })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(e.key, "h")) || ($$bc$equiv(e.key, "ArrowLeft"))))) ? (() => { if (is_horizontal()) {
  move_to_level0(-1);
} else {
  outdent_row(state.cursor);
}
return true; })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(e.key, "l")) || ($$bc$equiv(e.key, "ArrowRight"))))) ? (() => { if (is_horizontal()) {
  move_to_level0(1);
} else {
  indent_row(state.cursor);
}
return true; })() : handle_action_keys(e)) : handle_action_keys(e))); })()); };
  const setup_global_keys = () => { (vs["current-selected-tab"] = gBrowser.selectedTab);
gBrowser.tabContainer.addEventListener("TabSelect", (e) => { const new_tab = e.target;
if ((!($$bc$equiv(new_tab, vs["current-selected-tab"])))) {
  (vs["last-tab"] = vs["current-selected-tab"]);
  return (vs["current-selected-tab"] = new_tab);
} });
document.addEventListener("keydown", (e) => { const a = document.activeElement;
if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(picker.isActive())) && ((!((_truthy) => _truthy !== false && _truthy != null)(vs.renaming)) && ((!((_truthy) => _truthy !== false && _truthy != null)(contentFocus.contentInputFocused())) && ((!current_host_blacklisted()) && ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!($$bc$equiv(a, state.panel))) && (($$bc$equiv(a.tagName, "INPUT")) || (($$bc$equiv(a.tagName, "input")) || (($$bc$equiv(a.tagName, "TEXTAREA")) || (($$bc$equiv(a.tagName, "textarea")) || a.isContentEditable))))) : _logical))(a))) && ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? a.closest(".gjoa-picker") : _logical))(a.closest)))(((_logical) => (_logical !== false && _logical != null ? a.closest(".gjoa-search-input") : _logical))(a.closest))))(((_logical) => (_logical !== false && _logical != null ? a.closest("findbar") : _logical))(a.closest))))(((_logical) => (_logical !== false && _logical != null ? a.closest("#urlbar") : _logical))(a.closest)) : _logical))(a))) && (!((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(e.key, "Shift")) || (($$bc$equiv(e.key, "Control")) || (($$bc$equiv(e.key, "Alt")) || ($$bc$equiv(e.key, "Meta"))))))))))))))) {
  if (((_truthy) => _truthy !== false && _truthy != null)(vs["link-hints-active"])) {
    e.preventDefault();
    e.stopImmediatePropagation();
    return handle_link_hints_key(e);
  } else {
    if (((_truthy) => _truthy !== false && _truthy != null)(vs["visual-active"])) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return handle_visual_key(e);
    } else {
      if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(e.key, "Escape")) && ((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(vs["which-key-el"].hidden)) : _logical))(vs["which-key-el"])))) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return hide_which_key();
      } else {
        const leader = leader_key();
        if ((!($$bc$equiv(leader, null)))) {
          if ((!((_truthy) => _truthy !== false && _truthy != null)(vs["leader-armed"]))) {
            if (($$bc$equiv(e.key, leader))) {
              e.preventDefault();
              e.stopImmediatePropagation();
              return arm_leader();
            }
          } else {
            if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(e.key, leader)) || ($$bc$equiv(e.key, "Escape"))))) {
              e.preventDefault();
              e.stopImmediatePropagation();
              return disarm_leader();
            } else {
              const handled = try_dispatch_binding(e);
              disarm_leader();
              if ((!handled)) {
                e.preventDefault();
                return e.stopImmediatePropagation();
              }
            }
          }
        } else {
          return try_dispatch_binding(e);
        }
      }
    }
  }
} }, true);
return document.addEventListener("keyup", (e) => { if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(e.key, "j")) || ($$bc$equiv(e.key, "k"))))) {
  return (() => { try {
    return (() => { const some_thread____55 = gBrowser; if ((some_thread____55 == null)) {
  return null;
} else {
  const some_thread____56 = some_thread____55.selectedBrowser;
  if ((some_thread____56 == null)) {
    return null;
  } else {
    const some_thread____57 = some_thread____56.browsingContext;
    if ((some_thread____57 == null)) {
      return null;
    } else {
      const some_thread____58 = some_thread____57.currentWindowGlobal;
      if ((some_thread____58 == null)) {
        return null;
      } else {
        const some_thread____59 = some_thread____58.getActor("GjoaInput");
        return ((some_thread____59 == null) ? null : some_thread____59.sendAsyncMessage("GjoaInput:ScrollStop"));
      }
    }
  }
} })();
  } catch (__e) {
    return null;
  } })();
} }, true); };
  const setup_vim_keys = () => { state.panel.setAttribute("tabindex", "0");
document.addEventListener("keydown", (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(picker.isActive())) && ((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(vs.renaming)) : _logical))(vs["panel-active"])))) {
  const active = document.activeElement;
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!($$bc$equiv(active, state.panel))) && (($$bc$equiv(active.tagName, "INPUT")) || (($$bc$equiv(active.tagName, "input")) || (($$bc$equiv(active.tagName, "TEXTAREA")) || (($$bc$equiv(active.tagName, "textarea")) || ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? active.closest("findbar") : _logical))(active.closest)))(((_logical) => (_logical !== false && _logical != null ? active.closest("#urlbar") : _logical))(active.closest))))(active.isContentEditable)))))) : _logical))(active))) {
    return blur_panel();
  } else {
    if (($$bc$equiv(e.key, "Escape"))) {
      if (((_truthy) => _truthy !== false && _truthy != null)(vs["search-active"])) {
        end_search(false);
        e.preventDefault();
        return e.stopImmediatePropagation();
      } else {
        if (((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____60 = vs; if ((some_thread____60 == null)) {
  return null;
} else {
  const some_thread____61 = some_thread____60.modeline;
  return ((some_thread____61 == null) ? null : some_thread____61.querySelector(".gjoa-search-input"));
} })())) {
          end_ex_mode(null);
          e.preventDefault();
          return e.stopImmediatePropagation();
        }
      }
    } else {
      if (handle_normal_key(e)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return update_modeline();
      } else {
        if (($$bc$equiv(e.key.length, 1))) {
          blur_panel();
          if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(e.ctrlKey)) && ((!((_truthy) => _truthy !== false && _truthy != null)(e.altKey)) && (!((_truthy) => _truthy !== false && _truthy != null)(e.metaKey)))))) {
            return gBrowser.selectedBrowser.focus();
          }
        }
      }
    }
  }
} }, true);
return gBrowser.tabpanels.addEventListener("mousedown", () => { if (((_truthy) => _truthy !== false && _truthy != null)(vs["panel-active"])) {
  return blur_panel();
} }); };
  const consume_pending_cursor_move = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(vs["pending-cursor-move"]))) {
  return false;
} else {
  (vs["pending-cursor-move"] = false);
  return true;
} };
  return {setCursor: set_cursor, activateVim: activate_vim, moveCursor: move_cursor, focusPanel: focus_panel, focusPanelUnlessUrlbar: focus_panel_unless_urlbar, blurPanel: blur_panel, createModeline: create_modeline, setupVimKeys: setup_vim_keys, setupGlobalKeys: setup_global_keys, cloneAsSibling: clone_as_sibling, startRename: start_rename, consumePendingCursorMove: consume_pending_cursor_move, runExCommand: (_pct1) => end_ex_mode(_pct1), openExCommandPicker: open_ex_command_picker};
}

}

{
const $$bc$equiv = $$bc.equivV;

const pfx_log = create_logger_bang("tabs");

const sidebar_main = document.getElementById("sidebar-container");

function clear_selection() {
  Array.from(selection).forEach((_pct1) => _pct1.removeAttribute("gjoa-multi"));
  return selection.clear();
}

function select_range(to_row) {
  const from_row = ((_logical) => (_logical !== false && _logical != null ? _logical : row_of.get(gBrowser.selectedTab)))(state.cursor);
  if (((_truthy) => _truthy !== false && _truthy != null)(from_row)) {
    const rows = all_rows().filter((_pct1) => (!((_truthy) => _truthy !== false && _truthy != null)(_pct1.hidden)));
    const from_idx = rows.indexOf(from_row);
    const to_idx = rows.indexOf(to_row);
    if (((_truthy) => _truthy !== false && _truthy != null)(((from_idx >= 0) && (to_idx >= 0)))) {
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
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(container.firstChild, stop_el))) : _logical))(container.firstChild))) { container.firstChild.remove();  continue; } else { return null; }
  } })();
}

function clear_all_rows_bang() {
  remove_children_bang(state.panel, state.spacer);
  return remove_children_bang(state.pinnedContainer, null);
}

function build_panel_bang(rows_api) {
  clear_all_rows_bang();
  Array.from(gBrowser.tabs).forEach((tab) => { const row = rows_api.createTabRow(tab);
return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? state.pinnedContainer : _logical))(tab.pinned)) ? state.pinnedContainer.appendChild(row) : state.panel.insertBefore(row, state.spacer)); });
  if (((_truthy) => _truthy !== false && _truthy != null)(state.pinnedContainer)) {
    (state.pinnedContainer.hidden = (!((_truthy) => _truthy !== false && _truthy != null)(state.pinnedContainer.querySelector(".gjoa-tab-row"))));
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
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? label : _logical))(el))) {
    return label.setAttribute("value", spaces.active().name);
  }
}

const spaces = make_spaces_bang({onChange: () => { if (((_truthy) => _truthy !== false && _truthy != null)(rows_ref.v)) {
  rows_ref.v.scheduleTreeResync();
}
if (((_truthy) => _truthy !== false && _truthy != null)(schedule_save)) {
  schedule_save();
}
update_space_header();
if ((!((_truthy) => _truthy !== false && _truthy != null)(spaces.isApplying()))) {
  const snap = {spaces: spaces.list(), tabSpaces: Array.from(gBrowser.tabs).map((t) => [tree_data_bang(t).id, spaces.spaceOf(t)])};
  const e = Services.wm.getEnumerator("navigator:browser");
  return (() => {  while (true) {
    if (((_truthy) => _truthy !== false && _truthy != null)(e.hasMoreElements())) { (() => { const w = e.getNext(); if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(Object.is(w, window))) && w.Spaces))) {
  return w.Spaces.applyRemoteSpaces(snap);
} })();  continue; } else { return null; }
  } })();
} }, onActivated: (__prev, next) => { const current = gBrowser.selectedTab;
if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(spaces.spaceOf(current), next)) : _logical))(current)))) {
  const in_next = Array.from(gBrowser.tabs).filter((_pct1) => ($$bc$equiv(spaces.spaceOf(_pct1), next)));
  if ((in_next.length > 0)) {
    return (gBrowser.selectedTab = in_next[0]);
  }
} }, tabById: (gjoa_id) => Array.from(gBrowser.tabs).find((_pct1) => { const td = tree_data_bang(_pct1);
return ((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(td.id, gjoa_id)) : _logical))(td); })});

(window.Spaces = spaces);

const e = Services.wm.getEnumerator("navigator:browser");
(() => {  while (true) {
    if (((_truthy) => _truthy !== false && _truthy != null)(e.hasMoreElements())) {  const w = e.getNext(); if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(Object.is(w, window))) && w.Spaces))) { return spaces.applyRemoteSpaces({spaces: w.Spaces.list(), tabSpaces: []}); } else {  continue; } } else { return null; }
  } })();

make_niri_binding_bang();

should_defer_reveal_p = function(dynamic_on_p, narrow_p) {
  return (dynamic_on_p && narrow_p);
}

if (((_truthy) => _truthy !== false && _truthy != null)((() => { try {
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
  const apply_orientation = () => { if (((_truthy) => _truthy !== false && _truthy != null)((() => { try {
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
  if (((_truthy) => _truthy !== false && _truthy != null)(mq.matches)) {
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
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(spaces.spaceOf(sel), active))) : _logical))(sel))) {
    const in_active = Array.from(gBrowser.tabs).find((_pct1) => ($$bc$equiv(spaces.spaceOf(_pct1), active)));
    return (((_truthy) => _truthy !== false && _truthy != null)(in_active) ? (gBrowser.selectedTab = in_active) : spaces.setActive(spaces.spaceOf(sel)));
  }
}

const drag = make_drag_bang({clearSelection: clear_selection, scheduleTreeResync: () => rows_ref.v.scheduleTreeResync(), scheduleSave: schedule_save});

(rows_ref.v = make_rows_bang({setupDrag: drag.setupDrag, activateVim: (_pct1) => vim_ref.v.activateVim(_pct1), selectRange: select_range, clearSelection: clear_selection, cloneAsSibling: (_pct1) => vim_ref.v.cloneAsSibling(_pct1), startRename: (_pct1) => vim_ref.v.startRename(_pct1), scheduleSave: schedule_save, isTabInActiveSpace: (_pct1) => spaces.isVisible(_pct1), getActiveSpaceId: () => spaces.activeId(), isGroupInActiveSpace: (_pct1) => spaces.isSpaceActive(_pct1.spaceId)}));

const layout = make_layout_bang({sidebarMain: sidebar_main, rows: rows_ref.v, isTabInActiveSpace: (_pct1) => spaces.isVisible(_pct1), reconcileSelection: reconcile_selection_bang});

(vim_ref.v = make_vim_bang({rows: rows_ref.v, layout: layout, scheduleSave: schedule_save, clearSelection: clear_selection, selectRange: select_range, sidebarMain: sidebar_main, history: history, contentFocus: content_focus, spaces: spaces}));

const events = make_events_bang({rows: rows_ref.v, vim: vim_ref.v, scheduleSave: schedule_save, spaces: spaces});

function match_tabs_loop_bang(tab_nodes, tabs, ni, li_ref, applied, apply_fn) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((ni < tab_nodes.length) && (li_ref.v < tabs.length)))) {
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
    const pending = ($$bc$equiv(live_url, "about:blank"));
    if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(live_url, s.url)) || pending))) {
      apply_fn(live, s, ni);
      const live_idx = li_ref.v;
      (li_ref.v = (live_idx + 1));
      return match_tabs_loop_bang(tab_nodes, tabs, (ni + 1), li_ref, applied, apply_fn);
    } else {
      const live_idx = li_ref.v;
      const off = (() => { let j = 1; while (true) {
    if (((_truthy) => _truthy !== false && _truthy != null)(((j > 5) || ((live_idx + j) >= tabs.length)))) { return 0; } else if (($$bc$equiv(((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____4 = tabs[(live_idx + j)]; if ((some_thread____4 == null)) {
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
    if ((!($$bc$equiv(env.nextTabId, null)))) {
    (state.nextTabId = env.nextTabId);
  }
  (closed_tabs.length = 0);
  closed_tabs.push.apply(closed_tabs, env.closedTabs);
  const tabs = all_tabs();
  const tab_nodes = env.nodes.filter((_pct1) => (!($$bc$equiv(_pct1.type, "group")))).map((_pct1) => clone_node_fields(_pct1));
  (state.lastLoadedNodes = tab_nodes.map((_pct1) => clone_node_fields(_pct1)));
  tab_nodes.forEach((s) => { const saved_id = s.id;
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (saved_id >= state.nextTabId) : _logical))(s.id))) {
  return (state.nextTabId = (saved_id + 1));
} });
  pfx_log("loadFromHistory", {nextTabId: state.nextTabId, savedNextTabId: env.nextTabId, tabNodes: tab_nodes.length, liveTabs: tabs.length, tabNodeIds: tab_nodes.map((_pct1) => _pct1.id), liveTabPfxIds: tabs.map((_pct1) => ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(((_logical) => (_logical !== false && _logical != null ? _pct1.getAttribute("gjoa-id") : _logical))(_pct1.getAttribute)))});
  const applied = new Set();
  const apply_fn = (tab, s, i) => { const id = ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const nid = state.nextTabId; (state.nextTabId = (nid + 1));
return nid; })()))(s.id);
tree_of.set(tab, {id: id, parentId: ((_logical) => (_logical !== false && _logical != null ? _logical : null))(s.parentId), name: ((_logical) => (_logical !== false && _logical != null ? _logical : null))(s.name), state: ((_logical) => (_logical !== false && _logical != null ? _logical : null))(s.state), collapsed: ((_truthy) => _truthy !== false && _truthy != null)(s.collapsed)});
pin_tab_id(tab, id);
return applied.add(i); };
  const li_ref = {v: 0};
  match_tabs_loop_bang(tab_nodes, tabs, 0, li_ref, applied, apply_fn);
  console.log(("".concat("gjoa-tabs: loaded ", tab_nodes.length, " saved tab nodes, ", "matched ", applied.size, " to live tabs (of ", tabs.length, ").")));
  (saved_tab_queue.length = 0);
  tab_nodes.forEach((s, i) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(applied.has(i)))) {
  (s._origIdx = i);
  return saved_tab_queue.push(s);
} });
  if (((_truthy) => _truthy !== false && _truthy != null)(env.spaces)) {
    const tab_by_gjoa_id = (gjoa_id) => tabs.find((_pct1) => { const td = tree_of.get(_pct1);
return ((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(td.id, gjoa_id)) : _logical))(td); });
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
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(loaded_nodes)) || (!((_truthy) => _truthy !== false && _truthy != null)(state.panel))))) {
    return false;
  } else {
    const rows_api = rows_ref.v;
    const group_nodes = loaded_nodes.filter((_pct1) => ($$bc$equiv(_pct1.type, "group")));
    const leading_groups = [];
    const gafter = {entries: []};
    group_nodes.forEach((g) => { if (($$bc$equiv(g.afterTabId, null))) {
  return leading_groups.push(g);
} else {
  const entry = gafter.entries.find((_pct1) => ($$bc$equiv(_pct1[0], g.afterTabId)));
  if (((_truthy) => _truthy !== false && _truthy != null)(entry)) {
    return entry[1].push(g);
  } else {
    const arr = [g];
    return gafter.entries.push([g.afterTabId, arr]);
  }
} });
    const mk_group = (g) => { const row = rows_api.createGroupRow(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(g.name), ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(g.level));
(row._group.state = ((_logical) => (_logical !== false && _logical != null ? _logical : null))(g.state));
(row._group.collapsed = ((_truthy) => _truthy !== false && _truthy != null)(g.collapsed));
if (((_truthy) => _truthy !== false && _truthy != null)(g.spaceId)) {
  (row._group.spaceId = g.spaceId);
}
rows_api.syncGroupRow(row);
return row; };
    clear_all_rows_bang();
    leading_groups.forEach((_pct1) => state.panel.insertBefore(mk_group(_pct1), state.spacer));
    Array.from(gBrowser.tabs).forEach((tab) => { const row = rows_api.createTabRow(tab);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? state.pinnedContainer : _logical))(tab.pinned))) {
  return state.pinnedContainer.appendChild(row);
} else {
  state.panel.insertBefore(row, state.spacer);
  const tid = tree_data_bang(tab).id;
  const entry = gafter.entries.find((_pct1) => ($$bc$equiv(_pct1[0], tid)));
  if (((_truthy) => _truthy !== false && _truthy != null)(entry)) {
    return entry[1].forEach((_pct1) => state.panel.insertBefore(mk_group(_pct1), state.spacer));
  }
} });
    if (((_truthy) => _truthy !== false && _truthy != null)(state.pinnedContainer)) {
      (state.pinnedContainer.hidden = (!((_truthy) => _truthy !== false && _truthy != null)(state.pinnedContainer.querySelector(".gjoa-tab-row"))));
    }
    (loaded_nodes_ref.v = null);
    rows_api.scheduleTreeResync();
    rows_api.updateVisibility();
    return true;
  }
}

function describe(el) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(el))) {
    return "null";
  } else {
    const tag = ((_logical) => (_logical !== false && _logical != null ? _logical : "?"))((() => { const some_thread____7 = el; if ((some_thread____7 == null)) {
  return null;
} else {
  const some_thread____8 = some_thread____7.tagName;
  return ((some_thread____8 == null) ? null : some_thread____8.toLowerCase());
} })());
    const id_str = (((_truthy) => _truthy !== false && _truthy != null)(el.id) ? ("".concat("#", el.id)) : "");
    const raw = (($$bc$equiv(typeof el.className, "string")) ? (() => { return el.className.trim(); })() : null);
    const cls = (((_truthy) => _truthy !== false && _truthy != null)(raw) ? ("".concat(".", raw.split(new RegExp("\\s+")).slice(0, 2).join("."))) : "");
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
Array.from(gBrowser.tabs).forEach((t) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(row_of.has(t)))) {
  const row = rows_api.createTabRow(t);
  return (((_truthy) => _truthy !== false && _truthy != null)(t.pinned) ? state.pinnedContainer.appendChild(row) : state.panel.insertBefore(row, state.spacer));
} });
reconcile_selection_bang();
rows_api.updateVisibility();
state.spacer.addEventListener("click", () => { const visible = all_rows().filter((_pct1) => (!((_truthy) => _truthy !== false && _truthy != null)(_pct1.hidden)));
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
if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(__ev____scope__36__7__2__2__3__2__2__3__22__6__7__1__3, "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__36__7__2__2__3__2__2__3__22__6__7__1__0.__gjoaHR.teardowns : _logical))(__el____scope__36__7__2__2__3__2__2__3__22__6__7__1__0.__gjoaHR)))) {
  __el____scope__36__7__2__2__3__2__2__3__22__6__7__1__0.__gjoaHR.teardowns.push(__h____scope__36__7__2__2__3__2__2__3__22__6__7__1__6);
}
__h____scope__36__7__2__2__3__2__2__3__22__6__7__1__6;
const session_tagger = {observe: (__subject, topic) => { if (($$bc$equiv(topic, "quit-application"))) {
  return history.tagLatest("session").catch((_pct1) => console.error("gjoa-tabs: tagLatest on quit failed", _pct1));
} }};
Services.obs.addObserver(session_tagger, "quit-application");
const __el____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__0 = window;
const __ev____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__3 = "unload";
const __h____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__6 = () => Services.obs.removeObserver(session_tagger, "quit-application");
__el____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__0.addEventListener(__ev____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__3, __h____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__6, {once: true});
if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(__ev____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__3, "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__0.__gjoaHR.teardowns : _logical))(__el____scope__36__7__2__2__3__2__2__3__22__6__8__3__1__0.__gjoaHR)))) {
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
if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(__ev____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__3, "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__0.__gjoaHR.teardowns : _logical))(__el____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__0.__gjoaHR)))) {
  __el____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__0.__gjoaHR.teardowns.push(__h____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__6);
}
__h____scope__36__7__2__2__3__2__2__3__22__6__10__2__1__6;
if (((_truthy) => _truthy !== false && _truthy != null)((() => { try {
    return Services.prefs.getBoolPref("gjoa.test.exposeAPI", false);
  } catch (__e____scope__36__7__2__2__3__2__2__3__22__6__11__1__2__1__0) {
    return false;
  } })())) {
  (window.gjoaTest = {state: state, treeOf: tree_of, rowOf: row_of, cursorId: () => { const r = state.cursor;
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? r._tab : _logical))(r))) {
  const td = tree_of.get(r._tab);
  return ((_logical) => (_logical !== false && _logical != null ? td.id : _logical))(td);
} }, snapshotTree: () => { const out = [];
Array.from(gBrowser.tabs).forEach((t) => { const td = tree_of.get(t);
if (((_truthy) => _truthy !== false && _truthy != null)(td)) {
  return out.push({id: td.id, parentId: td.parentId, name: td.name, collapsed: td.collapsed, pinned: ((_truthy) => _truthy !== false && _truthy != null)(t.pinned), url: ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____31 = t; if ((some_thread____31 == null)) {
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
if (((_truthy) => _truthy !== false && _truthy != null)((() => { try {
    return Services.prefs.getBoolPref("gjoa.debug", false);
  } catch (__e____scope__36__7__2__2__3__2__2__3__22__6__12__1__2__1__0) {
    return false;
  } })())) {
  const pfx_ns = ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { (window.pfx = {});
return window.pfx; })()))(window.pfx);
  (pfx_ns.measure = (...els) => els.map((el, i) => { const r = (() => { const some_thread____34 = el; return ((some_thread____34 == null) ? null : some_thread____34.getBoundingClientRect()); })();
return (($$bc$equiv(r, null)) ? {i: i, tag: describe(el), error: "no rect"} : {i: i, tag: describe(el), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom)}); }));
  (pfx_ns.gaps = (...els) => els.slice(1).map((el, i) => { const a = (() => { const some_thread____35 = els[i]; return ((some_thread____35 == null) ? null : some_thread____35.getBoundingClientRect()); })();
const b = (() => { const some_thread____36 = el; return ((some_thread____36 == null) ? null : some_thread____36.getBoundingClientRect()); })();
if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(a, null)) || ($$bc$equiv(b, null))))) {
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
if (((_truthy) => _truthy !== false && _truthy != null)(u)) {
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
return ((_logical) => (_logical !== false && _logical != null ? _logical : (($$bc$equiv(spec, "about:newtab")) || (($$bc$equiv(spec, "about:home")) || ($$bc$equiv(spec, "about:blank"))))))(spec.startsWith("chrome://gjoa-newtab")); };
  const focus_it_bang = () => { if (((_truthy) => _truthy !== false && _truthy != null)((blank_p() && ($$bc$equiv(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(u.value), ""))))) {
  return (() => { try {
    u.focus();
  return u.select();
  } catch (__e) {
    return null;
  } })();
} };
  const holder = {fn: null};
  const stop_bang = () => { if (((_truthy) => _truthy !== false && _truthy != null)(holder.fn)) {
  window.removeEventListener("focusin", holder.fn, true);
  return (holder.fn = null);
} };
  (holder.fn = (e) => { if (($$bc$equiv((() => { const some_thread____48 = e; if ((some_thread____48 == null)) {
  return null;
} else {
  const some_thread____49 = some_thread____48.target;
  return ((some_thread____49 == null) ? null : some_thread____49.tagName);
} })(), "browser"))) {
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

if (((_truthy) => _truthy !== false && _truthy != null)(sidebar_main)) {
  if (((_truthy) => _truthy !== false && _truthy != null)(gBrowserInit.delayedStartupFinished)) {
    safe_init_bang();
  } else {
    const obs = (subject, topic) => { if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(topic, "browser-delayed-startup-finished")) && ($$bc$equiv(subject, window))))) {
  Services.obs.removeObserver(obs, topic);
  return safe_init_bang();
} };
    Services.obs.addObserver(obs, "browser-delayed-startup-finished");
  }
}

}
})();