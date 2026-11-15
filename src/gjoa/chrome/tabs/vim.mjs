import { CHORD_TIMEOUT } from './constants.mjs';
import { all_rows, data_of_bang, has_children_bang, is_horizontal, level_of_bang, level_of_row_bang, subtree_rows_bang, tab_by_id, tree_data_bang } from './helpers.mjs';
import { create_logger_bang } from './log.mjs';
import { hz_display, row_of, saved_tab_queue, selection, state, tree_of } from './state.mjs';
import { make_picker_bang } from './picker.mjs';

import { equiv, get, truthy } from "../lib/value.mjs";
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
  return (((overrides_raw === "")) ? DEFAULT_KEYMAP.get(key) : (() => { try {
    const ov = JSON.parse(overrides_raw);
  const v = get(ov, key);
  return (((typeof v === "undefined")) ? DEFAULT_KEYMAP.get(key) : v);
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
  const ov = (((raw === "")) ? new Object() : (() => { try {
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

export function make_vim_bang(deps) {
  const rows = get(deps, "rows");
  const layout = get(deps, "layout");
  const scheduleSave = get(deps, "scheduleSave");
  const clearSelection = get(deps, "clearSelection");
  const selectRange = get(deps, "selectRange");
  const sidebarMain = get(deps, "sidebarMain");
  const history = get(deps, "history");
  const contentFocus = get(deps, "contentFocus");
  const spaces = get(deps, "spaces");
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
    if ((i < 0)) { return null; } else if (((level_of_row_bang(all_r[i]) === 0))) { return all_r[i]; } else { const _recur_0 = (i - 1); i = _recur_0; continue; }
  } })()); };
  const collapse_hz_tree = (root) => { const d = data_of_bang(root);
if (truthy(((_logical) => (_logical !== false && _logical != null ? has_children_bang(root) : _logical))(d))) {
  if (truthy(((_logical) => (_logical !== false && _logical != null ? (!(equiv(state.cursor, root))) : _logical))((() => { const some_thread____6 = state; if ((some_thread____6 == null)) {
  return null;
} else {
  const some_thread____7 = some_thread____6.cursor;
  return ((some_thread____7 == null) ? null : some_thread____7._tab);
} })()))) {
    const cur_root = tree_root(state.cursor);
    if ((equiv(cur_root, root))) {
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
if (truthy(((_logical) => (_logical !== false && _logical != null ? has_children_bang(root) : _logical))(d))) {
  hz_display.delete(root);
  (d.collapsed = false);
  rows.syncAnyRow(root);
  if (is_horizontal()) {
    return layout.setUrlbarTopLayer(false);
  }
} };
  const update_horizontal_expansion = () => { if (truthy(state.cursor)) {
  const root = tree_root(state.cursor);
  if ((!(equiv(root, vs.hz_expanded_root)))) {
    if (truthy(vs.hz_expanded_root)) {
      collapse_hz_tree(vs.hz_expanded_root);
    }
    expand_hz_tree(root);
    (vs.hz_expanded_root = root);
    return rows.updateVisibility();
  }
} };
  const set_cursor = (row) => { if (truthy(state.cursor)) {
  state.cursor.removeAttribute("gjoa-cursor");
}
(state.cursor = row);
if (truthy(row)) {
  row.setAttribute("gjoa-cursor", "true");
  row.scrollIntoView({block: "nearest", inline: "nearest"});
  if (is_horizontal()) {
    return update_horizontal_expansion();
  }
} };
  const move_to_level0 = (delta) => { if ((!truthy(state.cursor))) {
  return false;
} else {
  const all_r = all_rows();
  const cur_idx = all_r.indexOf(state.cursor);
  if ((cur_idx < 0)) {
    return false;
  } else {
    const step = ((delta > 0) ? 1 : -1);
    const candidate = (() => { let i = (cur_idx + step); while (true) {
    if (((i < 0) || (i >= all_r.length))) { return null; } else if (((level_of_row_bang(all_r[i]) === 0))) { return all_r[i]; } else { const _recur_0 = (i + step); i = _recur_0; continue; }
  } })();
    if (truthy(candidate)) {
      set_cursor(candidate);
      if (truthy(candidate._tab)) {
        (gBrowser.selectedTab = candidate._tab);
      }
      return true;
    } else {
      return false;
    }
  }
} };
  const move_cursor = (delta) => { if ((!truthy(state.cursor))) {
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
    if (((i < 0) || (i >= all_arr.length))) { return null; } else if ((!truthy(all_arr[i].hidden))) { return all_arr[i]; } else { const _recur_0 = (i + step); i = _recur_0; continue; }
  } })();
    if (truthy(target)) {
      log("moveCursor:landed", {delta: delta, fromIdx: idx});
      set_cursor(target);
      if (truthy(target._tab)) {
        (gBrowser.selectedTab = target._tab);
      }
      return true;
    } else {
      log("moveCursor:noTarget", {delta: delta, fromIdx: idx, allLen: all_arr.length});
      return false;
    }
  }
} };
  const prev_sibling_tab = (row) => { if (truthy(((_logical) => (_logical !== false && _logical != null ? row._tab : _logical))(row))) {
  const my_td = tree_data_bang(row._tab);
  const my_level = level_of_bang(row._tab);
  const my_parent_id = my_td.parentId;
  return (() => { let r = row.previousElementSibling; while (true) {
    if ((r == null)) { return null; } else if ((!truthy(r._tab))) { const _recur_0 = r.previousElementSibling; r = _recur_0; continue; } else if ((level_of_bang(r._tab) < my_level)) { return null; } else if (truthy((level_of_bang(r._tab) === my_level) && (equiv(tree_data_bang(r._tab).parentId, my_parent_id)))) { return r._tab; } else { const _recur_0 = r.previousElementSibling; r = _recur_0; continue; }
  } })();
} };
  const indent_row = (row) => { if (truthy(row._group)) {
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
  if (truthy(row._tab)) {
    const prev = row.previousElementSibling;
    if (truthy(((_logical) => (_logical !== false && _logical != null ? prev._group : _logical))(prev))) {
      (tree_data_bang(row._tab).parentId = prev._group.id);
      subtree_rows_bang(row).forEach((_pct1) => rows.syncAnyRow(_pct1));
    } else {
      const sibling = prev_sibling_tab(row);
      if (truthy(sibling)) {
        (tree_data_bang(row._tab).parentId = tree_data_bang(sibling).id);
        subtree_rows_bang(row).forEach((_pct1) => rows.syncAnyRow(_pct1));
      }
    }
  }
}
rows.updateVisibility();
return scheduleSave(); };
  const outdent_row = (row) => { if (truthy(row._group)) {
  const d = row._group;
  const d_level = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(d.level);
  if ((d_level > 0)) {
    (d.level = Math.max(0, (d_level - 1)));
    rows.syncAnyRow(row);
  }
} else {
  if (truthy(row._tab)) {
    const td = tree_data_bang(row._tab);
    if ((!((td.parentId == null)))) {
      if (((typeof td.parentId === "string"))) {
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
  const move_to_root = (row) => { if (truthy(((_logical) => (_logical !== false && _logical != null ? row._tab : _logical))(row))) {
  const td = tree_data_bang(row._tab);
  if (truthy(td.parentId)) {
    (td.parentId = null);
    return commit_tree(subtree_rows_bang(row));
  }
} };
  const make_child_of_above = (row) => { if (truthy(((_logical) => (_logical !== false && _logical != null ? row._tab : _logical))(row))) {
  const prev = row.previousElementSibling;
  if (truthy(prev)) {
    if (truthy(prev._group)) {
      (tree_data_bang(row._tab).parentId = prev._group.id);
    } else {
      if (truthy(prev._tab)) {
        (tree_data_bang(row._tab).parentId = tree_data_bang(prev._tab).id);
      }
    }
    return commit_tree(subtree_rows_bang(row));
  }
} };
  const swap_down = (row) => { if (truthy(data_of_bang(row))) {
  const my_level = level_of_row_bang(row);
  const sub = subtree_rows_bang(row);
  const sub_count = sub.length;
  const last_row = sub[(sub_count - 1)];
  const next_row = last_row.nextElementSibling;
  if (truthy(((_logical) => (_logical !== false && _logical != null ? ((!(equiv(next_row, state.spacer))) && (level_of_row_bang(next_row) === my_level)) : _logical))(next_row))) {
    const next_sub = subtree_rows_bang(next_row);
    const next_sub_count = next_sub.length;
    const anchor = next_sub[(next_sub_count - 1)];
    insert_after_each_bang(anchor, sub);
    rows.updateVisibility();
    return scheduleSave();
  }
} };
  const swap_up = (row) => { if (truthy(data_of_bang(row))) {
  const my_level = level_of_row_bang(row);
  const prev = (() => { let el = row.previousElementSibling; while (true) {
    if ((el == null)) { return null; } else if ((level_of_row_bang(el) > my_level)) { const _recur_0 = el.previousElementSibling; el = _recur_0; continue; } else { return el; }
  } })();
  if (truthy(((_logical) => (_logical !== false && _logical != null ? (level_of_row_bang(prev) === my_level) : _logical))(prev))) {
    subtree_rows_bang(row).forEach((_pct1) => prev.before(_pct1));
    rows.updateVisibility();
    return scheduleSave();
  }
} };
  const make_child_of_next = (row) => { if (truthy(((_logical) => (_logical !== false && _logical != null ? row._tab : _logical))(row))) {
  const my_level = level_of_row_bang(row);
  const sub = subtree_rows_bang(row);
  const sub_count = sub.length;
  const last_row = sub[(sub_count - 1)];
  const next_row = last_row.nextElementSibling;
  if (truthy(((_logical) => (_logical !== false && _logical != null ? ((!(equiv(next_row, state.spacer))) && (level_of_row_bang(next_row) === my_level)) : _logical))(next_row))) {
    if (truthy(next_row._group)) {
      (tree_data_bang(row._tab).parentId = next_row._group.id);
    } else {
      if (truthy(next_row._tab)) {
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
  const unfold_right = (row) => { if (truthy(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? tree_data_bang(row._tab).parentId : _logical))(row._tab) : _logical))(row))) {
  const sub = subtree_rows_bang(row);
  const p = parent_row_of(row);
  const p_sub = (truthy(p) ? (() => { return subtree_rows_bang(p); })() : null);
  const p_sub_count = (truthy(p_sub) ? p_sub.length : 0);
  const anchor = ((p_sub_count > 0) ? (() => { return p_sub[(p_sub_count - 1)]; })() : null);
  (tree_data_bang(row._tab).parentId = null);
  if (truthy(((_logical) => (_logical !== false && _logical != null ? (!truthy(sub.includes(anchor))) : _logical))(anchor))) {
    insert_after_each_bang(anchor, sub);
  }
  return commit_tree(subtree_rows_bang(row));
} };
  const unfold_left = (row) => { if (truthy(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? tree_data_bang(row._tab).parentId : _logical))(row._tab) : _logical))(row))) {
  const sub = subtree_rows_bang(row);
  const p = parent_row_of(row);
  (tree_data_bang(row._tab).parentId = null);
  if (truthy(p)) {
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
  const update_modeline = () => { if (truthy(vs.modeline)) {
  const mode_label = document.getElementById("gjoa-modeline-mode");
  const chord_label = document.getElementById("gjoa-modeline-chord");
  const msg_label = document.getElementById("gjoa-modeline-msg");
  const pending = (truthy(vs.pending_ctrl_w) ? "C-w-" : (((vs.chord === "g")) ? "g-" : ""));
  if (truthy(mode_label)) {
    mode_label.setAttribute("value", "");
  }
  if (truthy(chord_label)) {
    chord_label.setAttribute("value", pending);
  }
  const has_content = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : vs.modeline.querySelector(".gjoa-search-input")))(vs.search_active)))((() => { const some_thread____8 = msg_label; return ((some_thread____8 == null) ? null : some_thread____8.getAttribute("value")); })())))(pending);
  return vs.modeline.toggleAttribute("gjoa-visible", has_content);
} };
  const modeline_msg = (text, duration) => { const dur = ((equiv(duration, undefined)) ? 3000 : duration);
if (truthy(vs.modeline)) {
  const msg = document.getElementById("gjoa-modeline-msg");
  if (truthy(msg)) {
    msg.setAttribute("value", text);
    vs.modeline.setAttribute("gjoa-visible", "true");
    clearTimeout(vs.modeline_timer);
    return (vs.modeline_timer = setTimeout(() => { msg.setAttribute("value", "");
return update_modeline(); }, dur));
  }
} };
  const picker = make_picker_bang({restoreFocus: () => { if (truthy(state.panel)) {
  return state.panel.focus();
} }, modelineMsg: (_pct1, _pct2) => modeline_msg(_pct1, _pct2)});
  const focus_panel = () => { (vs.panel_active = true);
state.panel.focus();
if ((!truthy(state.cursor))) {
  const row = row_of.get(gBrowser.selectedTab);
  if (truthy(row)) {
    set_cursor(row);
  }
}
return update_modeline(); };
  const activate_vim = (row) => { focus_panel();
return set_cursor(row); };
  const focus_panel_unless_urlbar = () => { const u = document.getElementById("urlbar");
const a = document.activeElement;
if (truthy(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ((a === u) || u.contains(a)) : _logical))(a) : _logical))(u))) {
  if ((!truthy(state.cursor))) {
    const row = row_of.get(gBrowser.selectedTab);
    if (truthy(row)) {
      set_cursor(row);
    }
  }
  return update_modeline();
} else {
  return focus_panel();
} };
  const blur_panel = () => { (vs.panel_active = false);
(vs.chord = null);
(vs.pending_ctrl_w = false);
clearTimeout(vs.chord_timer);
if (truthy(is_horizontal() && vs.hz_expanded_root)) {
  collapse_hz_tree(vs.hz_expanded_root);
  (vs.hz_expanded_root = null);
  rows.updateVisibility();
}
return update_modeline(); };
  const activate_urlbar = (intent) => { (() => { try {
    const u = window.gURLBar;
  if (truthy(u)) {
    if (truthy(u.focus)) {
      u.focus();
    }
    if (truthy(u.select)) {
      u.select();
    }
    if (truthy((() => { const some_thread____9 = u; if ((some_thread____9 == null)) {
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
  const toggle_last_tab = () => { const target = vs.last_tab;
if (truthy(target)) {
  return (() => { try {
    if (truthy(target.isOpen)) {
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
return raw.split(",").map((_pct1) => _pct1.trim().toLowerCase()).filter((_pct1) => truthy(_pct1)); };
  const current_host = () => (() => { try {
    const uri = current_spec();
  return ((!truthy(uri)) ? "" : new URL(uri).hostname.toLowerCase());
  } catch (__e) {
    return "";
  } })();
  const current_host_blacklisted = () => { const host = current_host();
return (truthy(host) && blacklisted_hosts().some((_pct1) => ((equiv(host, _pct1)) || host.endsWith(("".concat(".", _pct1)))))); };
  const blacklist_add = (host) => { const list = blacklisted_hosts();
const h = host.trim().toLowerCase();
if (truthy(((_logical) => (_logical !== false && _logical != null ? (!truthy(list.includes(h))) : _logical))(h))) {
  list.push(h);
  return (() => { try {
    return Services.prefs.setStringPref("gjoa.keys.blacklist", list.join(","));
  } catch (__e____scope__13__1__4__1__143__3__2__3__2__1__0) {
    return null;
  } })();
} };
  const blacklist_remove = (host) => { const list = blacklisted_hosts();
const h = host.trim().toLowerCase();
const next = list.filter((_pct1) => (!(equiv(_pct1, h))));
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
  const leader_key = () => { if (truthy((() => { try {
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
  return (((v.length === 0)) ? null : v);
} else {
  return null;
} };
  const leader_timeout_ms = () => (() => { try {
    return Services.prefs.getIntPref("gjoa.keys.leader_timeout", 1500);
  } catch (__e____scope__13__1__4__1__152__3__2__1__0) {
    return 1500;
  } })();
  const which_key_ensure = () => { if (truthy((() => { const some_thread____11 = vs; if ((some_thread____11 == null)) {
  return null;
} else {
  const some_thread____12 = some_thread____11.which_key_el;
  return ((some_thread____12 == null) ? null : some_thread____12.isConnected);
} })())) {
  return vs.which_key_el;
} else {
  const el = document.createElement("div");
  const header = (() => { const __e____scope__13__1__4__1__155__3__3__1__5__1__0 = document.createElement("div"); (__e____scope__13__1__4__1__155__3__3__1__5__1__0.className = "gjoa-wk-header");
return __e____scope__13__1__4__1__155__3__3__1__5__1__0; })();
  (el.id = "gjoa-which-key");
  (el.hidden = true);
  (header.textContent = "leader");
  el.appendChild(header);
  VIM_COMMANDS.forEach((b) => { if (truthy((!((b.id === "exCommand"))) && key_enabled(b.id))) {
  const row = (() => { const __e____scope__13__1__4__1__155__3__3__6__3__3__2__1__2__1__0 = document.createElement("div"); (__e____scope__13__1__4__1__155__3__3__6__3__3__2__1__2__1__0.className = "gjoa-wk-row");
return __e____scope__13__1__4__1__155__3__3__6__3__3__2__1__2__1__0; })();
  const k = (() => { const __e____scope__13__1__4__1__155__3__3__6__3__3__2__1__5__1__0 = document.createElement("span"); (__e____scope__13__1__4__1__155__3__3__6__3__3__2__1__5__1__0.className = "gjoa-wk-key");
return __e____scope__13__1__4__1__155__3__3__6__3__3__2__1__5__1__0; })();
  const d = (() => { const __e____scope__13__1__4__1__155__3__3__6__3__3__2__1__8__1__0 = document.createElement("span"); (__e____scope__13__1__4__1__155__3__3__6__3__3__2__1__8__1__0.className = "gjoa-wk-desc");
return __e____scope__13__1__4__1__155__3__3__6__3__3__2__1__8__1__0; })();
  (k.textContent = (((b.key === " ")) ? "Space" : b.key));
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
(k.textContent = ("".concat(":", c.name, (truthy(c.takesArgs) ? " …" : ""))));
(d.textContent = c.description);
row.appendChild(k);
row.appendChild(d);
return el.appendChild(row); });
  document.documentElement.appendChild(el);
  (vs.which_key_el = el);
  return el;
} };
  const ensure_leader_focus_stash = () => { if (truthy((() => { const some_thread____13 = vs; if ((some_thread____13 == null)) {
  return null;
} else {
  const some_thread____14 = some_thread____13.leader_focus_stash;
  return ((some_thread____14 == null) ? null : some_thread____14.isConnected);
} })())) {
  return vs.leader_focus_stash;
} else {
  const el = document.createElement("div");
  (el.id = "gjoa-leader-focus-stash");
  el.setAttribute("aria-hidden", "true");
  el.setAttribute("tabindex", "-1");
  (el.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none");
  document.documentElement.appendChild(el);
  (vs.leader_focus_stash = el);
  return el;
} };
  const disarm_leader = () => { (vs.leader_armed = false);
if ((!((vs.leader_timer == null)))) {
  clearTimeout(vs.leader_timer);
  (vs.leader_timer = null);
}
(() => { try {
    if (truthy(((_logical) => (_logical !== false && _logical != null ? (equiv(document.activeElement, vs.leader_focus_stash)) : _logical))(vs.leader_prev_focus))) {
    if (truthy(vs.leader_prev_focus.focus)) {
      return vs.leader_prev_focus.focus();
    }
  }
  } catch (__e) {
    return null;
  } })();
return (vs.leader_prev_focus = null); };
  const arm_leader = () => { (vs.leader_armed = true);
if ((!((vs.leader_timer == null)))) {
  clearTimeout(vs.leader_timer);
}
(vs.leader_timer = setTimeout(() => disarm_leader(), leader_timeout_ms()));
const a = document.activeElement;
if (truthy(((_logical) => (_logical !== false && _logical != null ? (!(equiv(a, vs.leader_focus_stash))) : _logical))(a))) {
  (vs.leader_prev_focus = a);
}
return (() => { try {
    return ensure_leader_focus_stash().focus();
  } catch (__e) {
    return null;
  } })(); };
  const toggle_which_key = () => { const el = which_key_ensure();
return (el.hidden = (!truthy(el.hidden))); };
  const hide_which_key = () => { if (truthy(vs.which_key_el)) {
  return (vs.which_key_el.hidden = true);
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
  const end_link_hints = (send_cancel_p) => { (vs.link_hints_active = false);
if (send_cancel_p) {
  const a = link_hints_actor();
  if (truthy(a)) {
    return (() => { try {
    return a.sendQuery("LinkHints:Cancel");
  } catch (__e) {
    return null;
  } })();
  }
} };
  const start_link_hints = (new_tab) => { const a = link_hints_actor();
if (truthy(a)) {
  (vs.link_hints_active = true);
  return (() => { try {
    return a.sendQuery("LinkHints:Show", {newTab: new_tab}).then((r) => { if (((!truthy(r)) || ((r.count === 0)))) {
  return (vs.link_hints_active = false);
} }, (__e) => (vs.link_hints_active = false));
  } catch (__e) {
    return (vs.link_hints_active = false);
  } })();
} };
  const handle_link_hints_key = (e) => { if (((e.key === "Escape"))) {
  return end_link_hints(true);
} else {
  const k = e.key;
  if ((((k.length === 1)) || ((e.key === "Backspace")))) {
    const a = link_hints_actor();
    if (truthy(a)) {
      return (() => { try {
    return a.sendQuery("LinkHints:Key", {key: k}).then((r) => { if (truthy(((_logical) => (_logical !== false && _logical != null ? (!((r.state === "active"))) : _logical))(r))) {
  (vs.link_hints_active = false);
}
if (truthy(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? r.newTab : _logical))(r.url) : _logical))(r))) {
  return (() => { try {
    return window.openTrustedLinkIn(r.url, "tab");
  } catch (__e) {
    return null;
  } })();
} }, (__e) => (vs.link_hints_active = false));
  } catch (__e) {
    return (vs.link_hints_active = false);
  } })();
    }
  }
} };
  const start_visual = () => { const a = link_hints_actor();
if (truthy(a)) {
  (vs.visual_active = true);
  return (() => { try {
    return a.sendQuery("Visual:Start", {}).then((r) => { if (((!truthy(r)) || (!truthy(r.ok)))) {
  return (vs.visual_active = false);
} }, (__e) => (vs.visual_active = false));
  } catch (__e) {
    return (vs.visual_active = false);
  } })();
} };
  const end_visual = (yank_p) => { (vs.visual_active = false);
const a = link_hints_actor();
if (truthy(a)) {
  return (yank_p ? (() => { try {
    return a.sendQuery("Visual:Yank").then((r) => { if (truthy(r)) {
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
  const visual_move_of = (k) => ((((k === "h"))) ? {dir: "left", unit: "character"} : (((k === "l"))) ? {dir: "right", unit: "character"} : (((k === "j"))) ? {dir: "forward", unit: "line"} : (((k === "k"))) ? {dir: "backward", unit: "line"} : (((k === "w"))) ? {dir: "forward", unit: "word"} : (((k === "b"))) ? {dir: "backward", unit: "word"} : (((k === "0"))) ? {dir: "backward", unit: "lineboundary"} : (((k === "$"))) ? {dir: "forward", unit: "lineboundary"} : null);
  const handle_visual_key = (e) => { const k = e.key;
return ((((e.key === "Escape"))) ? end_visual(false) : (((k === "y"))) ? end_visual(true) : (() => { const mv = visual_move_of(k); if (truthy(mv)) {
  const a = link_hints_actor();
  if (truthy(a)) {
    return (() => { try {
    return a.sendQuery("Visual:Move", mv);
  } catch (__e) {
    return null;
  } })();
  }
} })()); };
  const focus_content = () => gBrowser.selectedBrowser.focus();
  const pane_switch = (key) => { const k = key.toLowerCase();
return ((((k === "h"))) ? focus_panel() : (((k === "l"))) ? focus_content() : (((k === "w"))) ? ((equiv(document.activeElement, state.panel)) ? focus_content() : focus_panel()) : null); };
  const go_to_end = (idx) => { const visible = all_rows().filter((_pct1) => (!truthy(_pct1.hidden)));
const visible_count = visible.length;
if ((visible_count > 0)) {
  const r = visible[((idx < 0) ? (visible_count + idx) : idx)];
  set_cursor(r);
  if (truthy(r._tab)) {
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
  return (() => { function find_valid(n) { if (truthy(n)) {
  return (truthy(((_logical) => (_logical !== false && _logical != null ? _logical : ((equiv(n, state.spacer)) || sel.includes(n))))(n.hidden)) ? find_valid(n.nextElementSibling) : n);
} } const next = find_valid(last_r.nextElementSibling);
if (truthy(((_logical) => (_logical !== false && _logical != null ? (!(equiv(next, state.spacer))) : _logical))(next))) {
  set_cursor(next);
}
(() => { let i = (sel_count - 1); while (true) {
    if ((i >= 0)) { (() => { const row = sel[i]; if (truthy(row._tab)) {
  return gBrowser.removeTab(row._tab);
} else {
  if (truthy(row._group)) {
    return row.remove();
  }
} })(); const _recur_0 = (i - 1); i = _recur_0; continue; } else { return null; }
  } })();
rows.updateVisibility();
return scheduleSave(); })();
} else {
  if (truthy(state.cursor)) {
    if (truthy(state.cursor._tab)) {
      return gBrowser.removeTab(state.cursor._tab);
    } else {
      if (truthy(state.cursor._group)) {
        const d = state.cursor._group;
        const my_level = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(d.level);
        const group_id = d.id;
        Array.from(gBrowser.tabs).forEach((tab) => { const td = tree_data_bang(tab);
if ((equiv(td.parentId, group_id))) {
  return (td.parentId = null);
} });
        (() => { function dec_groups(nxt) { if (truthy(((_logical) => (_logical !== false && _logical != null ? (!(equiv(nxt, state.spacer))) : _logical))(nxt))) {
  const lv = level_of_row_bang(nxt);
  if ((lv > my_level)) {
    if (truthy(nxt._group)) {
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
if (truthy(source_row)) {
  const sibling_parent_id = tree_data_bang(tab).parentId;
  (vs.pending_cursor_move = true);
  const clone = gBrowser.duplicateTab(tab);
  const obs = new MutationObserver(() => { const clone_row = row_of.get(clone);
if (truthy(clone_row)) {
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
  if (truthy(td)) {
    const url = tab_spec(tab);
    const host = (() => { try {
    return new URL(url).hostname;
  } catch (__e) {
    return "";
  } })();
    const icon = (truthy(((_logical) => (_logical !== false && _logical != null ? (!((url === ""))) : _logical))(url)) ? ("".concat("page-icon:", url)) : undefined);
    return items.push({display: ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : "(untitled)"))(tab.label)))(td.name), secondary: ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(url)))(host), icon: icon, id: td.id, parentId: (((typeof td.parentId === "number")) ? td.parentId : null), depth: level_of_bang(tab), data: tab});
  }
} });
return items; };
  const open_tabs_picker = (scope) => { const gjoa_api = window.Gjoa;
if (truthy(((scope === "all")) && gjoa_api)) {
  const all_tabs = gjoa_api.tabs.all();
  if (((all_tabs.length === 0))) {
    return modeline_msg("No tabs", 3000);
  } else {
    const window_labels = new Map();
    all_tabs.forEach((t) => { if ((!(window_labels.has(t.windowId)))) {
  return window_labels.set(t.windowId, ("".concat("Window ", (window_labels.size + 1))));
} });
    const items = all_tabs.map((t) => { const w_label = ((_logical) => (_logical !== false && _logical != null ? _logical : "Window ?"))(window_labels.get(t.windowId));
const host = (() => { try {
    return new URL(t.url).hostname;
  } catch (__e) {
    return "";
  } })();
return {display: ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : "(untitled)"))(t.label)))(t.customName), secondary: (truthy(host) ? ("".concat(host, "  ·  ", w_label)) : w_label), data: {id: t.id, windowId: t.windowId}}; });
    return picker.show({prompt: "tabs (all windows) >", items: items, preserveTree: false, onSelect: (item) => { const d = item.data;
return (() => { try {
    return gjoa_api.tabs.activate(d.id, d.windowId);
  } catch (__e) {
    return null;
  } })(); }});
  }
} else {
  const filter_fn = (truthy(((scope === "space")) && spaces) ? (_pct1) => spaces.isVisible(_pct1) : (_pct1) => { _pct1;
return true; });
  const prompt_label = (((scope === "space")) ? ("".concat("tabs (", spaces.active().name, ") >")) : "tabs (window) >");
  const items = build_window_items(filter_fn);
  return (((items.length === 0)) ? modeline_msg("No tabs", 3000) : picker.show({prompt: prompt_label, items: items, preserveTree: true, onSelect: (_pct1) => (() => { try {
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
    return (truthy(_pct1.data.pinned) ? gBrowser.unpinTab(_pct1.data) : gBrowser.pinTab(_pct1.data));
  } catch (__e) {
    return null;
  } })()}, {label: "Reload", key: "r", run: (_pct1) => (() => { try {
    return gBrowser.reloadTab(_pct1.data);
  } catch (__e) {
    return null;
  } })()}]}));
} };
  const label_of = (tag) => { if (truthy(tag)) {
  const i = tag.indexOf(":");
  return ((i >= 0) ? tag.slice((i + 1)) : tag);
} };
  const tag_kind = (tag) => { if (truthy(tag)) {
  return ((tag.startsWith("checkpoint:")) ? "checkpoint" : "session");
} };
  const relative_time = (ts) => { const now = Date.now();
const delta = (now - ts);
const mins = Math.floor((delta / 60000));
return (((mins < 1)) ? "just now" : ((mins < 60)) ? ("".concat(mins, "m ago")) : (() => { const hrs = Math.floor((mins / 60)); return (((hrs < 24)) ? ("".concat(hrs, "h ago")) : (() => { const days = Math.floor((hrs / 24)); return ((((days === 1))) ? "yesterday" : ((days < 7)) ? ("".concat(days, "d ago")) : (() => { const weeks = Math.floor((days / 7)); return ((weeks < 5) ? ("".concat(weeks, "w ago")) : new Date(ts).toLocaleDateString([], {month: "short", day: "numeric"})); })()); })()); })()); };
  const top_hosts = (nodes, max_count) => { const mx = ((equiv(max_count, undefined)) ? 3 : max_count);
const seen = new Set();
const hosts = [];
nodes.forEach((n) => { if (truthy((!((n.type === "group"))) && ((_logical) => (_logical !== false && _logical != null ? (hosts.length < mx) : _logical))(n.url))) {
  const host = (() => { try {
    return new URL(n.url).hostname.replace(new RegExp("^www\\."), "");
  } catch (__e) {
    return "";
  } })();
  if (truthy(((_logical) => (_logical !== false && _logical != null ? ((!((host === "newtab"))) && (!truthy(seen.has(host)))) : _logical))(host))) {
    seen.add(host);
    return hosts.push(host);
  }
} });
return hosts; };
  const tab_count = (nodes) => nodes.filter((_pct1) => (!((_pct1.type === "group")))).length;
  const event_has_space = (ev, space_id) => { const snap = ev.snapshot;
const ts = ((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? snap.spaces.tabSpaces : _logical))(snap.spaces) : _logical))(snap);
return ((ts == null) ? true : ts.some((_pct1) => (equiv(_pct1[1], space_id)))); };
  const history_picker_item = (ev) => { const nodes = ((_logical) => (_logical !== false && _logical != null ? _logical : []))(ev.snapshot.nodes);
const count = tab_count(nodes);
const hosts = top_hosts(nodes, 3);
const tag = label_of(ev.tag);
const when_str = relative_time(ev.timestamp);
const display = (truthy(tag) ? ("".concat(tag, "  --  ", ((_logical) => (_logical !== false && _logical != null ? _logical : "empty"))(hosts.join(", ")))) : ((_logical) => (_logical !== false && _logical != null ? _logical : "(empty)"))(hosts.join(", ")));
const parts = [when_str, ("".concat(count, " tab", ((!((count === 1))) ? "s" : "")))];
if (truthy(tag)) {
  parts.unshift((((tag_kind(ev.tag) === "checkpoint")) ? "checkpoint" : "session"));
}
return {display: display, secondary: parts.join(" . "), data: ev}; };
  const session_picker_item = (ev) => { const nodes = ((_logical) => (_logical !== false && _logical != null ? _logical : []))(ev.snapshot.nodes);
const count = tab_count(nodes);
const hosts = top_hosts(nodes, 4);
const kind = tag_kind(ev.tag);
const label = ((_logical) => (_logical !== false && _logical != null ? _logical : "untitled"))(label_of(ev.tag));
const when_str = relative_time(ev.timestamp);
const parts = [];
if (((kind === "checkpoint"))) {
  parts.push("checkpoint");
}
parts.push(when_str, ("".concat(count, " tab", ((!((count === 1))) ? "s" : ""))));
if (truthy(hosts.length)) {
  parts.push(hosts.join(", "));
}
return {display: label, secondary: parts.join(" . "), data: ev}; };
  const restore_event = (event) => { const env = event.snapshot;
const tab_nodes = env.nodes.filter((_pct1) => (!((_pct1.type === "group"))));
const tab_space_map = new Map();
if (truthy(((_logical) => (_logical !== false && _logical != null ? env.spaces.tabSpaces : _logical))(env.spaces))) {
  env.spaces.tabSpaces.forEach((_pct1) => tab_space_map.set(_pct1[0], _pct1[1]));
}
if (((tab_nodes.length === 0))) {
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
  const execute_refile = (target) => { if (truthy(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? (!(equiv(target, vs.refile_source))) : _logical))(target) : _logical))(vs.refile_source))) {
  const src_rows = subtree_rows_bang(vs.refile_source);
  if ((src_rows.includes(target))) {
    return modeline_msg("Can't refile under own subtree", 3000);
  } else {
    const src_data = data_of_bang(vs.refile_source);
    const tgt_data = data_of_bang(target);
    if (truthy(((_logical) => (_logical !== false && _logical != null ? tgt_data : _logical))(src_data))) {
      if (truthy(((_logical) => (_logical !== false && _logical != null ? target._tab : _logical))(vs.refile_source._tab))) {
        (tree_data_bang(vs.refile_source._tab).parentId = tree_data_bang(target._tab).id);
      } else {
        const tgt_level = level_of_row_bang(target);
        const src_level = level_of_row_bang(vs.refile_source);
        const delta = ((tgt_level + 1) - src_level);
        src_rows.forEach((r) => { if (truthy(r._group)) {
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
  const some_thread____20 = some_thread____19.refile_source;
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
      (vs.refile_source = null);
      (vs.search_matches = []);
      return (vs.search_idx = -1);
    }
  }
} };
  const cancel_refile = () => { if (truthy(vs.refile_source)) {
  (vs.refile_source = null);
  (vs.search_matches = []);
  (vs.search_idx = -1);
  return modeline_msg("Refile cancelled", 3000);
} };
  const clear_filter = () => { all_rows().forEach((_pct1) => (_pct1.hidden = false));
return rows.updateVisibility(); };
  const apply_filter = (query) => { const q = query.trim().toLowerCase();
if ((!truthy(q))) {
  return clear_filter();
} else {
  const all_r = all_rows();
  const matched = new Set();
  all_r.forEach((row) => { const d = data_of_bang(row);
if (truthy(d)) {
  const label = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((truthy(row._tab) ? row._tab.label : ""))))(d.name).toLowerCase();
  const url = tab_spec(row._tab).toLowerCase();
  if (truthy(((_logical) => (_logical !== false && _logical != null ? _logical : url.includes(q)))(label.includes(q)))) {
    return matched.add(row);
  }
} });
  (() => { function walk_anc(prev, lv_ref) { if (truthy(prev)) {
  const plv = level_of_row_bang(prev);
  if ((plv < lv_ref.v)) {
    matched.add(prev);
    (lv_ref.v = plv);
  }
  if ((!((plv === 0)))) {
    return walk_anc(prev.previousElementSibling, lv_ref);
  }
} } return Array.from(matched).forEach((row) => walk_anc(row.previousElementSibling, {v: level_of_row_bang(row)})); })();
  return all_r.forEach((_pct1) => (_pct1.hidden = (!(matched.has(_pct1)))));
} };
  const teardown_search_ui = () => { if (truthy(vs.search_input)) {
  vs.search_input.remove();
}
(vs.search_input = null);
const pfx = (() => { const some_thread____24 = vs; if ((some_thread____24 == null)) {
  return null;
} else {
  const some_thread____25 = some_thread____24.modeline;
  return ((some_thread____25 == null) ? null : some_thread____25.querySelector(".gjoa-search-prefix"));
} })();
if (truthy(pfx)) {
  pfx.remove();
}
show_children_bang(vs.modeline);
return update_modeline(); };
  const end_search = (accept) => { (vs.search_active = false);
if (accept) {
  const q = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____26 = vs; if ((some_thread____26 == null)) {
  return null;
} else {
  const some_thread____27 = some_thread____26.search_input;
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
  (vs.search_matches = []);
  (vs.search_idx = -1);
  const excluded = (truthy(vs.refile_source) ? new Set(subtree_rows_bang(vs.refile_source)) : null);
  if (truthy(q)) {
    all_rows().forEach((row) => { if ((!truthy(((_logical) => (_logical !== false && _logical != null ? excluded.has(row) : _logical))(excluded)))) {
  const d = data_of_bang(row);
  if (truthy(d)) {
    const label = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((truthy(row._tab) ? row._tab.label : ""))))(d.name).toLowerCase();
    const url = tab_spec(row._tab).toLowerCase();
    if (truthy(((_logical) => (_logical !== false && _logical != null ? _logical : url.includes(q)))(label.includes(q)))) {
      return vs.search_matches.push(row);
    }
  }
} });
  }
  const dtc = {v: false};
  if (((vs.search_matches.length === 1))) {
    const match = vs.search_matches[0];
    set_cursor(match);
    if (truthy(match._tab)) {
      (gBrowser.selectedTab = match._tab);
    }
    if (truthy(vs.refile_source)) {
      execute_refile(match);
    } else {
      (vs.panel_active = false);
      (vs.search_matches = []);
      (vs.search_idx = -1);
      sidebarMain.dispatchEvent(new Event("gjoa-dismiss"));
      (dtc.v = true);
    }
  } else {
    if ((vs.search_matches.length > 0)) {
      (vs.search_idx = 0);
      const fm = vs.search_matches[0];
      set_cursor(fm);
      if (truthy(fm._tab)) {
        (gBrowser.selectedTab = fm._tab);
      }
      const hint = (truthy(vs.refile_source) ? "  Enter=refile, n/N=cycle" : "");
      modeline_msg(("".concat("/", q, "  [1/", vs.search_matches.length, "]", hint)), 3000);
    } else {
      if (truthy(vs.refile_source)) {
        modeline_msg("No refile targets found", 3000);
      }
    }
  }
  clear_filter();
  teardown_search_ui();
  if ((!truthy(dtc.v))) {
    return focus_panel();
  }
} else {
  (vs.search_matches = []);
  (vs.search_idx = -1);
  clear_filter();
  if (truthy(vs.refile_source)) {
    cancel_refile();
  }
  teardown_search_ui();
  return focus_panel();
} };
  const start_search = () => { if (truthy((!truthy(vs.search_active)) && vs.modeline)) {
  (vs.search_active = true);
  hide_children_bang(vs.modeline);
  vs.modeline.setAttribute("gjoa-visible", "true");
  const input = (() => { const __e____scope__13__1__4__1__269__3__5__1__2__1__0 = document.createElement("input"); (__e____scope__13__1__4__1__269__3__5__1__2__1__0.className = "gjoa-search-input");
return __e____scope__13__1__4__1__269__3__5__1__2__1__0; })();
  (vs.search_input = input);
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
return ((((e.key === "Escape"))) ? end_search(false) : (((e.key === "Enter"))) ? end_search(true) : ((((e.key === "Backspace")) && (!truthy(input.value)))) ? end_search(false) : null); });
} };
  const start_rename = (row) => { if (truthy(row)) {
  const label = row.querySelector(".gjoa-tab-label");
  if (truthy(label)) {
    const d = data_of_bang(row);
    if (truthy(d)) {
      const original = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((truthy(row._tab) ? row._tab.label : ""))))(d.name);
      (label.textContent = original);
      label.setAttribute("contenteditable", "plaintext-only");
      label.classList.add("gjoa-renaming");
      (vs.renaming = true);
      label.style.removeProperty("overflow");
      label.style.removeProperty("text-overflow");
      label.focus();
      const sel = ((_logical) => (_logical !== false && _logical != null ? window.getSelection() : _logical))(window.getSelection);
      if (truthy(sel)) {
        const range = document.createRange();
        range.selectNodeContents(label);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      const done_flag = {v: false};
      const finish = (commit) => { if ((!truthy(done_flag.v))) {
  (done_flag.v = true);
  const value = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(label.textContent).trim();
  label.removeAttribute("contenteditable");
  label.classList.remove("gjoa-renaming");
  (vs.renaming = false);
  if (truthy(((_logical) => (_logical !== false && _logical != null ? window.getSelection() : _logical))(window.getSelection))) {
    window.getSelection().removeAllRanges();
  }
  if (commit) {
    if (truthy(row._group)) {
      (d.name = ((_logical) => (_logical !== false && _logical != null ? _logical : "New Group"))(value));
    } else {
      (d.name = (truthy(((_logical) => (_logical !== false && _logical != null ? (!(equiv(value, row._tab.label))) : _logical))(value)) ? value : null));
    }
    scheduleSave();
  }
  if (truthy(row._tab)) {
    rows.syncTabRow(row._tab);
  } else {
    rows.syncAnyRow(row);
  }
  return state.panel.focus();
} };
      label.addEventListener("keydown", (e) => { if (((e.key === "Enter"))) {
  e.preventDefault();
  finish(true);
  focus_panel();
}
if (((e.key === "Escape"))) {
  e.preventDefault();
  finish(false);
  focus_panel();
}
return e.stopPropagation(); });
      const __el____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__0 = label;
      const __ev____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__3 = "blur";
      const __h____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__6 = () => finish(true);
      __el____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__0.addEventListener(__ev____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__3, __h____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__6, {once: true});
      if (truthy(((__ev____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__3 === "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__0.__gjoaHR.teardowns : _logical))(__el____scope__13__1__4__1__272__3__2__2__2__2__2__10__3__1__0.__gjoaHR))) {
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
  const idx = list.findIndex((_pct1) => (equiv(_pct1.id, cur)));
  const next_idx = ((((idx + dir) % space_count) + space_count) % space_count);
  const next = list[next_idx];
  spaces.setActive(next.id);
  return modeline_msg(("".concat(":space -> \"", next.name, "\"")), 1500);
} };
  const end_ex_mode = (cmd) => { const sp = vs.modeline.querySelector(".gjoa-search-prefix");
if (truthy(sp)) {
  sp.remove();
}
const si = vs.modeline.querySelector(".gjoa-search-input");
if (truthy(si)) {
  si.remove();
}
show_children_bang(vs.modeline);
update_modeline();
if (truthy(cmd)) {
  const args = cmd.split(new RegExp("\\s+"));
  const name = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(args[0]).toLowerCase();
  return (((((name === "group")) || (((name === "grp")) || ((name === "folder"))))) ? (() => { const label = ((_logical) => (_logical !== false && _logical != null ? _logical : "New Group"))(args.slice(1).join(" ")); const row = rows.createGroupRow(label, (truthy(state.cursor) ? level_of_row_bang(state.cursor) : 0)); if (truthy(state.cursor)) {
  const st = subtree_rows_bang(state.cursor);
  const st_count = st.length;
  st[(st_count - 1)].after(row);
} else {
  state.panel.insertBefore(row, state.spacer);
}
set_cursor(row);
rows.updateVisibility();
scheduleSave();
return modeline_msg(("".concat(":group ", label)), 3000); })() : ((((name === "re")) || (((name === "refile")) || ((name === "rf"))))) ? ((!truthy(state.cursor)) ? modeline_msg("No cursor -- place cursor on tab to refile", 3000) : (() => { (vs.refile_source = state.cursor);
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
return setTimeout(() => start_search(), 0); })()) : ((((name === "pin")) || ((name === "unpin")))) ? (() => { const t = (() => { const some_thread____35 = state; if ((some_thread____35 == null)) {
  return null;
} else {
  const some_thread____36 = some_thread____35.cursor;
  return ((some_thread____36 == null) ? null : some_thread____36._tab);
} })(); const want_pin = ((name === "pin")); if ((t == null)) {
  return modeline_msg("No tab at cursor", 3000);
} else {
  if ((equiv(t.pinned, want_pin))) {
    return modeline_msg(("".concat((want_pin ? "Already pinned" : "Not pinned"), ": ", t.label)), 2000);
  } else {
    if (want_pin) {
      gBrowser.pinTab(t);
    } else {
      gBrowser.unpinTab(t);
    }
    return modeline_msg(("".concat(":", name, " ", t.label)), 3000);
  }
} })() : ((((name === "checkpoint")) || ((name === "cp")))) ? (() => { const label = args.slice(1).join(" ").trim(); if ((!truthy(label))) {
  return modeline_msg("Usage: :checkpoint <label>", 3000);
} else {
  scheduleSave();
  return setTimeout(() => history.tagLatest("checkpoint", label).then((_pct1) => modeline_msg((truthy(_pct1) ? ("".concat(":checkpoint \"", label, "\"")) : "Nothing to tag (no events yet)"), 3000)).catch((_pct1) => modeline_msg(("".concat(":checkpoint failed: ", _pct1.message)), 4000)), 100);
} })() : (((name === "restore"))) ? (() => { const arg = args.slice(1).join(" ").trim(); return history.getTagged(100).then((tagged) => { if (((tagged.length === 0))) {
  return modeline_msg("No tagged sessions yet", 4000);
} else {
  if ((!truthy(arg))) {
    return picker.show({prompt: "restore >", items: tagged.map((_pct1) => session_picker_item(_pct1)), onSelect: (item) => restore_event(item.data).then(() => modeline_msg(("".concat("Restored: ", label_of(item.data.tag))), 4000)).catch((_pct1) => modeline_msg(("".concat(":restore failed: ", _pct1.message)), 4000))});
  } else {
    const needle = arg.toLowerCase();
    const matches = tagged.filter((_pct1) => ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(label_of(_pct1.tag)).toLowerCase().includes(needle));
    return (((matches.length === 0)) ? modeline_msg(("".concat("No sessions match \"", arg, "\"")), 3000) : restore_event(matches[0]).then(() => modeline_msg(("".concat("Restored: ", label_of(matches[0].tag))), 4000)).catch((_pct1) => modeline_msg(("".concat(":restore failed: ", _pct1.message)), 4000)));
  }
} }).catch((_pct1) => modeline_msg(("".concat(":restore failed: ", _pct1.message)), 4000)); })() : (((name === "tabs"))) ? (() => { const sub = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(args[1]).toLowerCase(); const scope = (((((sub === "all")) || ((sub === "*")))) ? "all" : ((((sub === "window")) || ((sub === "win")))) ? "current" : "space"); return open_tabs_picker(scope); })() : ((((name === "blacklist")) || ((name === "bl")))) ? (() => { const sub = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(args[1]).toLowerCase(); return (((((sub === "list")) || ((sub === "ls")))) ? (() => { const list = blacklisted_hosts(); return modeline_msg((truthy(list.length) ? ("".concat("Blacklist: ", list.join(", "))) : "Blacklist is empty"), 5000); })() : ((((sub === "remove")) || (((sub === "rm")) || ((sub === "del"))))) ? (() => { const host = ((_logical) => (_logical !== false && _logical != null ? _logical : current_host()))((() => { const some_thread____37 = args[2]; return ((some_thread____37 == null) ? null : some_thread____37.trim()); })()); return ((!truthy(host)) ? modeline_msg("No host to remove", 3000) : modeline_msg((blacklist_remove(host) ? ("".concat("Removed: ", host)) : ("".concat("Not in blacklist: ", host))), 3000)); })() : (() => { const host = ((_logical) => (_logical !== false && _logical != null ? _logical : current_host()))((() => { const some_thread____38 = args[1]; return ((some_thread____38 == null) ? null : some_thread____38.trim()); })()); if ((!truthy(host))) {
  return modeline_msg("No host to blacklist", 3000);
} else {
  blacklist_add(host);
  return modeline_msg(("".concat("Blacklisted: ", host)), 3000);
} })()); })() : ((((name === "unblacklist")) || ((name === "ubl")))) ? (() => { const host = ((_logical) => (_logical !== false && _logical != null ? _logical : current_host()))((() => { const some_thread____39 = args[1]; return ((some_thread____39 == null) ? null : some_thread____39.trim()); })()); return ((!truthy(host)) ? modeline_msg("No host to remove", 3000) : modeline_msg((blacklist_remove(host) ? ("".concat("Removed: ", host)) : ("".concat("Not in blacklist: ", host))), 3000)); })() : (((name === "sessions"))) ? modeline_msg("Use :restore instead", 3000) : ((((name === "sidebar-strip")) || ((name === "strip")))) ? toggle_h_sidebar_strip() : (((name === "help"))) ? toggle_which_key() : ((((name === "bind")) || ((name === "map")))) ? (() => { const k = (() => { const some_thread____40 = args[1]; return ((some_thread____40 == null) ? null : some_thread____40.trim()); })(); const cmd = (() => { const some_thread____41 = args[2]; return ((some_thread____41 == null) ? null : some_thread____41.trim()); })(); if (((!truthy(k)) || (!truthy(cmd)))) {
  return modeline_msg("usage: :bind <key> <command>  (commands: about:vim)", 5000);
} else {
  if ((!(COMMAND_IDS.has(cmd)))) {
    return modeline_msg(("".concat("Unknown command: ", cmd, "  (see about:vim)")), 4500);
  } else {
    set_key_binding_bang(k, cmd);
    return modeline_msg(("".concat("Bound ", k, " → ", cmd)), 3000);
  }
} })() : ((((name === "unbind")) || ((name === "unmap")))) ? (() => { const k = (() => { const some_thread____42 = args[1]; return ((some_thread____42 == null) ? null : some_thread____42.trim()); })(); if ((!truthy(k))) {
  return modeline_msg("usage: :unbind <key>", 4000);
} else {
  set_key_binding_bang(k, null);
  return modeline_msg(("".concat("Unbound ", k)), 3000);
} })() : (((name === "bindreset"))) ? (() => { (() => { try {
    return Services.prefs.setStringPref("gjoa.keys.bindings", "");
  } catch (__e____scope__13__1__4__1__278__7__2__2__28__1__2__1__0) {
    return null;
  } })();
return modeline_msg("Keybindings reset to defaults", 3000); })() : (((name === "tabpos"))) ? (() => { const valid = ["sibling", "root", "child"]; const arg = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(args[1]).toLowerCase(); if ((!truthy(arg))) {
  const cur = Services.prefs.getCharPref("gjoa.tabs.newTabPosition", "sibling");
  return modeline_msg(("".concat(":tabpos = ", cur, " (options: sibling | root | child)")), 4000);
} else {
  if ((!(valid.includes(arg)))) {
    return modeline_msg("Usage: :tabpos <sibling|root|child>", 3500);
  } else {
    Services.prefs.setCharPref("gjoa.tabs.newTabPosition", arg);
    return modeline_msg(("".concat(":tabpos -> ", arg)), 2500);
  }
} })() : (((name === "space"))) ? (() => { const sub = ((_logical) => (_logical !== false && _logical != null ? _logical : "list"))(args[1]).toLowerCase(); const rest = args.slice(2).join(" ").trim(); return ((((sub === "new"))) ? (() => { const sn = ((_logical) => (_logical !== false && _logical != null ? _logical : "Untitled"))(rest); const s = spaces.create(sn); spaces.setActive(s.id);
return modeline_msg(("".concat(":space new \"", s.name, "\" -> switched")), 2500); })() : (((sub === "rename"))) ? ((!truthy(rest)) ? modeline_msg("Usage: :space rename <name>", 3000) : (() => { spaces.rename(spaces.activeId(), rest);
return modeline_msg(("".concat(":space rename \"", rest, "\"")), 2500); })()) : (((sub === "delete"))) ? (() => { const cur = spaces.active(); const all = spaces.list(); if (truthy((all.length <= 1) || (equiv(all[0].id, cur.id)))) {
  return modeline_msg("Can't delete the default space", 3000);
} else {
  spaces.delete(cur.id);
  return modeline_msg(("".concat(":space delete \"", cur.name, "\"")), 2500);
} })() : (((sub === "switch"))) ? ((!truthy(rest)) ? modeline_msg("Usage: :space switch <name>", 3000) : (() => { const match = spaces.list().find((_pct1) => (equiv(_pct1.name.toLowerCase(), rest.toLowerCase()))); if ((match == null)) {
  return modeline_msg(("".concat("No space named \"", rest, "\"")), 3000);
} else {
  spaces.setActive(match.id);
  return modeline_msg(("".concat(":space -> \"", match.name, "\"")), 2000);
} })()) : (() => { const items = spaces.list().map((s) => { const r = {display: s.name, secondary: ((equiv(s.id, spaces.activeId())) ? "(active)" : ""), data: s};
return r; }); return picker.show({prompt: "spaces >", items: items, onSelect: (item) => { spaces.setActive(item.data.id);
return modeline_msg(("".concat(":space -> \"", item.data.name, "\"")), 2000); }}); })()); })() : (((name === "history"))) ? (() => { const raw_args = args.slice(1); const space_scoped = ((raw_args.length > 0) && ((raw_args[0].toLowerCase() === "space"))); const q_args = (space_scoped ? raw_args.slice(1) : raw_args); const q = q_args.join(" ").trim(); const active_space = ((_logical) => (_logical !== false && _logical != null ? spaces.activeId() : _logical))(spaces); return ((truthy(q) ? history.search(q, {taggedOnly: false, limit: 200}) : history.getRecent(200))).then((evs) => { const filtered = (truthy(space_scoped && active_space) ? evs.filter((_pct1) => event_has_space(_pct1, active_space)) : evs);
const display_evs = filtered.slice(0, 100);
return (((display_evs.length === 0)) ? modeline_msg((truthy(q) ? ("".concat("No events match \"", q, "\"")) : "No history yet"), 3000) : picker.show({prompt: (space_scoped ? ("".concat("history (", spaces.active().name, ") >")) : "history >"), items: display_evs.map((_pct1) => history_picker_item(_pct1)), onSelect: (item) => { const ev = item.data;
return restore_event(ev).then(() => { const lbl = label_of(ev.tag);
return modeline_msg(("".concat("Restored: ", ((_logical) => (_logical !== false && _logical != null ? _logical : new Date(ev.timestamp).toLocaleString()))(lbl))), 4000); }).catch((_pct1) => modeline_msg(("".concat(":history restore failed: ", _pct1.message)), 4000)); }})); }).catch((_pct1) => modeline_msg(("".concat(":history failed: ", _pct1.message)), 4000)); })() : modeline_msg(("".concat("Unknown command: ", name)), 3000));
} };
  const open_ex_command_picker = () => { const items = EX_COMMANDS.map((cmd) => { const r = {display: ("".concat(":", cmd.name)), secondary: cmd.description, data: cmd};
return r; });
return picker.show({prompt: "ex >", items: items, filterItem: (item, q) => { const cmd = item.data;
const first_word = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(q.trim().toLowerCase().split(new RegExp("\\s+"))[0]);
if ((!truthy(first_word))) {
  return true;
} else {
  const hay = ("".concat(cmd.name, " ", ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(item.secondary))).toLowerCase();
  return hay.includes(first_word);
} }, onSelect: (item, query) => { const cmd = item.data;
const q = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(query).trim();
const lower = q.toLowerCase();
const use_qa = ((_logical) => (_logical !== false && _logical != null ? _logical : (equiv(lower, cmd.name.toLowerCase()))))(lower.startsWith(("".concat(cmd.name.toLowerCase(), " "))));
const ex_cmd = (use_qa ? q : cmd.name);
return end_ex_mode(ex_cmd); }}); };
  const command_handlers = (e, id) => ((((id === "tabsPicker"))) ? open_tabs_picker("space") : (((id === "tabsPickerAll"))) ? open_tabs_picker("all") : (((id === "exCommand"))) ? open_ex_command_picker() : (((id === "closeTab"))) ? (() => { try {
    return gBrowser.removeTab(gBrowser.selectedTab);
  } catch (__e) {
    return null;
  } })() : (((id === "urlbar"))) ? activate_urlbar("current") : (((id === "urlbarNewTab"))) ? activate_urlbar("newTab") : (((id === "lastTab"))) ? toggle_last_tab() : (((id === "back"))) ? (() => { try {
    return gBrowser.selectedBrowser.goBack();
  } catch (__e) {
    return null;
  } })() : (((id === "forward"))) ? (() => { try {
    return gBrowser.selectedBrowser.goForward();
  } catch (__e) {
    return null;
  } })() : (((id === "scrollDown"))) ? ((!truthy(e.repeat)) ? (() => { return (() => { try {
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
  } })(); })() : null) : (((id === "scrollUp"))) ? ((!truthy(e.repeat)) ? (() => { return (() => { try {
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
  } })(); })() : null) : (((id === "summonSidebar"))) ? (() => { const sb = document.getElementById("sidebar-container"); if (truthy((() => { try {
    return Services.prefs.getBoolPref("gjoa.sidebar.compact", false);
  } catch (__e____scope__13__1__4__1__284__3__24__2__1__2__1__0) {
    return false;
  } })())) {
  if (truthy(sb)) {
    if (truthy(((_logical) => (_logical !== false && _logical != null ? _logical : sb.hasAttribute("gjoa-has-hover")))(sb.hasAttribute("gjoa-pinned")))) {
      sb.removeAttribute("gjoa-pinned");
      return sb.removeAttribute("gjoa-has-hover");
    } else {
      return sb.setAttribute("gjoa-pinned", "true");
    }
  }
} else {
  if (truthy(sb)) {
    sb.removeAttribute("gjoa-pinned");
  }
  return (() => { try {
    return Services.prefs.setBoolPref("gjoa.sidebar.compact", true);
  } catch (__e____scope__13__1__4__1__284__3__24__2__3__2__2__1__0) {
    return null;
  } })();
} })() : (((id === "anchorSidebar"))) ? (() => { const c = window.gjoaCompact; if (truthy(c)) {
  return c.toggle();
} })() : (((id === "toggleStrip"))) ? toggle_h_sidebar_strip() : (((id === "help"))) ? toggle_which_key() : (((id === "linkHints"))) ? start_link_hints(false) : (((id === "linkHintsNewTab"))) ? start_link_hints(true) : (((id === "find"))) ? (() => { try {
    return gBrowser.getFindBar().then((fb) => { if (truthy(fb)) {
  return fb.startFind(fb.FIND_NORMAL);
} });
  } catch (__e) {
    return null;
  } })() : (((id === "findNext"))) ? (() => { try {
    return gBrowser.getFindBar().then((fb) => { if (truthy(fb)) {
  return fb.onFindAgainCommand(false);
} });
  } catch (__e) {
    return null;
  } })() : (((id === "findPrev"))) ? (() => { try {
    return gBrowser.getFindBar().then((fb) => { if (truthy(fb)) {
  return fb.onFindAgainCommand(true);
} });
  } catch (__e) {
    return null;
  } })() : (((id === "visualMode"))) ? start_visual() : null);
  const try_dispatch_binding = (e) => { if (truthy(((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : e.metaKey))(e.altKey)))(e.ctrlKey))) {
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
  if (truthy(((_logical) => (_logical !== false && _logical != null ? COMMAND_IDS.has(id) : _logical))(id))) {
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
  const visual_move = (dir) => { if ((!truthy(vs.selection_anchor))) {
  (vs.selection_anchor = state.cursor);
}
if (truthy(move_cursor(dir) && vs.selection_anchor)) {
  selectRange(vs.selection_anchor);
}
return true; };
  const handle_action_keys = (e) => ((((e.key === "Enter"))) ? (truthy(vs.refile_source) ? (() => { if (truthy(state.cursor)) {
  execute_refile(state.cursor);
}
return true; })() : (truthy(state.cursor._tab) ? (() => { (gBrowser.selectedTab = state.cursor._tab);
blur_panel();
gBrowser.selectedBrowser.focus();
return true; })() : (() => { rows.toggleCollapse(state.cursor);
return true; })())) : (((e.key === "Tab"))) ? (() => { rows.toggleCollapse(state.cursor);
return true; })() : (((e.key === "Escape"))) ? (() => { if (truthy(vs.refile_source)) {
  cancel_refile();
}
return true; })() : (((e.key === "r"))) ? (() => { start_rename(state.cursor);
return true; })() : (((e.key === "G"))) ? (() => { go_to_bottom();
return true; })() : (((e.key === "x"))) ? (() => { close_focused();
return true; })() : (((e.key === ":"))) ? (() => { open_ex_command_picker();
return true; })() : (((e.key === "J"))) ? visual_move(1) : (((e.key === "K"))) ? visual_move(-1) : false);
  const handle_normal_key = (e) => { if (((!((e.key === "J"))) && (!((e.key === "K"))))) {
  (vs.selection_anchor = null);
}
if (((!truthy(state.cursor)) && "jklhG/rnNx".includes(e.key))) {
  const row = row_of.get(gBrowser.selectedTab);
  if (truthy(row)) {
    set_cursor(row);
  }
}
return ((truthy(vs.pending_ctrl_w)) ? (() => { (vs.pending_ctrl_w = false);
clearTimeout(vs.chord_timer);
if ((((e.key === "h")) || (((e.key === "H")) || (((e.key === "l")) || (((e.key === "L")) || (((e.key === "w")) || ((e.key === "W")))))))) {
  pane_switch(e.key);
  return true;
} else {
  if (truthy(gBrowser.selectedTab)) {
    gBrowser.removeTab(gBrowser.selectedTab);
  }
  return false;
} })() : (truthy(((_logical) => (_logical !== false && _logical != null ? (((e.key === "w")) || ((e.code === "KeyW"))) : _logical))(e.ctrlKey))) ? (() => { (vs.pending_ctrl_w = true);
(vs.chord_timer = setTimeout(() => { if (truthy(vs.pending_ctrl_w)) {
  (vs.pending_ctrl_w = false);
  if (truthy(gBrowser.selectedTab)) {
    return gBrowser.removeTab(gBrowser.selectedTab);
  }
} }, CHORD_TIMEOUT));
return true; })() : (truthy(vs.chord)) ? (() => { const combo = ("".concat(vs.chord, e.key)); (vs.chord = null);
clearTimeout(vs.chord_timer);
return ((((combo === "gg"))) ? (() => { go_to_top();
return true; })() : (((combo === "gC"))) ? (() => { if (truthy((() => { const some_thread____53 = state; if ((some_thread____53 == null)) {
  return null;
} else {
  const some_thread____54 = some_thread____53.cursor;
  return ((some_thread____54 == null) ? null : some_thread____54._tab);
} })())) {
  clone_as_sibling(state.cursor._tab);
}
return true; })() : ((((combo === "gs")) || ((combo === "gS")))) ? (() => { cycle_space((((combo === "gs")) ? 1 : -1));
return true; })() : true); })() : ((((e.key === "g")) && ((!truthy(e.shiftKey)) && ((!truthy(e.ctrlKey)) && (!truthy(e.altKey)))))) ? (() => { (vs.chord = e.key);
(vs.chord_timer = setTimeout(() => (vs.chord = null), CHORD_TIMEOUT));
return true; })() : (((e.key === "i"))) ? (() => { blur_panel();
gBrowser.selectedBrowser.focus();
return true; })() : (truthy(((_logical) => (_logical !== false && _logical != null ? (((e.key === "h")) || (((e.code === "KeyH")) || ((e.key === "ArrowLeft")))) : _logical))(e.altKey))) ? (() => { if (truthy(state.cursor)) {
  const c = state.cursor;
  if (is_horizontal()) {
    if (truthy(((_logical) => (_logical !== false && _logical != null ? tree_data_bang(c._tab).parentId : _logical))(c._tab))) {
      unfold_left(c);
    } else {
      make_child_of_above(c);
    }
  } else {
    move_to_root(c);
  }
}
return true; })() : (truthy(((_logical) => (_logical !== false && _logical != null ? (((e.key === "l")) || (((e.code === "KeyL")) || ((e.key === "ArrowRight")))) : _logical))(e.altKey))) ? (() => { if (truthy(state.cursor)) {
  const c = state.cursor;
  if (is_horizontal()) {
    if (truthy(((_logical) => (_logical !== false && _logical != null ? tree_data_bang(c._tab).parentId : _logical))(c._tab))) {
      unfold_right(c);
    } else {
      make_child_of_next(c);
    }
  } else {
    make_child_of_above(c);
  }
}
return true; })() : (truthy(((_logical) => (_logical !== false && _logical != null ? (((e.key === "j")) || (((e.code === "KeyJ")) || ((e.key === "ArrowDown")))) : _logical))(e.altKey))) ? (() => { if (truthy(state.cursor)) {
  swap_down(state.cursor);
}
return true; })() : (truthy(((_logical) => (_logical !== false && _logical != null ? (((e.key === "k")) || (((e.code === "KeyK")) || ((e.key === "ArrowUp")))) : _logical))(e.altKey))) ? (() => { if (truthy(state.cursor)) {
  if (is_horizontal()) {
    move_to_root(state.cursor);
  } else {
    swap_up(state.cursor);
  }
}
return true; })() : (() => { if (((!truthy(state.cursor)) && "jklhG/rnNx".includes(e.key))) {
  const row = row_of.get(gBrowser.selectedTab);
  if (truthy(row)) {
    set_cursor(row);
  }
}
return ((!truthy(state.cursor)) ? false : (((!truthy(e.ctrlKey)) && (!truthy(e.metaKey))) ? (((((e.key === "j")) || ((e.key === "ArrowDown")))) ? (() => { move_cursor(1);
return true; })() : ((((e.key === "k")) || ((e.key === "ArrowUp")))) ? (() => { move_cursor(-1);
return true; })() : ((((e.key === "h")) || ((e.key === "ArrowLeft")))) ? (() => { if (is_horizontal()) {
  move_to_level0(-1);
} else {
  outdent_row(state.cursor);
}
return true; })() : ((((e.key === "l")) || ((e.key === "ArrowRight")))) ? (() => { if (is_horizontal()) {
  move_to_level0(1);
} else {
  indent_row(state.cursor);
}
return true; })() : handle_action_keys(e)) : handle_action_keys(e))); })()); };
  const setup_global_keys = () => { (vs.current_selected_tab = gBrowser.selectedTab);
gBrowser.tabContainer.addEventListener("TabSelect", (e) => { const new_tab = e.target;
if ((!(equiv(new_tab, vs.current_selected_tab)))) {
  (vs.last_tab = vs.current_selected_tab);
  return (vs.current_selected_tab = new_tab);
} });
document.addEventListener("keydown", (e) => { const a = document.activeElement;
if (((!truthy(picker.isActive())) && ((!truthy(vs.renaming)) && ((!truthy(contentFocus.contentInputFocused())) && ((!current_host_blacklisted()) && ((!truthy(((_logical) => (_logical !== false && _logical != null ? ((!(equiv(a, state.panel))) && (((a.tagName === "INPUT")) || (((a.tagName === "input")) || (((a.tagName === "TEXTAREA")) || (((a.tagName === "textarea")) || a.isContentEditable))))) : _logical))(a))) && ((!truthy(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? a.closest(".gjoa-picker") : _logical))(a.closest)))(((_logical) => (_logical !== false && _logical != null ? a.closest(".gjoa-search-input") : _logical))(a.closest))))(((_logical) => (_logical !== false && _logical != null ? a.closest("findbar") : _logical))(a.closest))))(((_logical) => (_logical !== false && _logical != null ? a.closest("#urlbar") : _logical))(a.closest)) : _logical))(a))) && (!truthy((((e.key === "Shift")) || (((e.key === "Control")) || (((e.key === "Alt")) || ((e.key === "Meta")))))))))))))) {
  if (truthy(vs.link_hints_active)) {
    e.preventDefault();
    e.stopImmediatePropagation();
    return handle_link_hints_key(e);
  } else {
    if (truthy(vs.visual_active)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return handle_visual_key(e);
    } else {
      if (truthy(((e.key === "Escape")) && ((_logical) => (_logical !== false && _logical != null ? (!truthy(vs.which_key_el.hidden)) : _logical))(vs.which_key_el))) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return hide_which_key();
      } else {
        const leader = leader_key();
        if ((!((leader == null)))) {
          if ((!truthy(vs.leader_armed))) {
            if ((equiv(e.key, leader))) {
              e.preventDefault();
              e.stopImmediatePropagation();
              return arm_leader();
            }
          } else {
            if (truthy((equiv(e.key, leader)) || ((e.key === "Escape")))) {
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
return document.addEventListener("keyup", (e) => { if ((((e.key === "j")) || ((e.key === "k")))) {
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
document.addEventListener("keydown", (e) => { if (truthy((!truthy(picker.isActive())) && ((_logical) => (_logical !== false && _logical != null ? (!truthy(vs.renaming)) : _logical))(vs.panel_active))) {
  const active = document.activeElement;
  if (truthy(((_logical) => (_logical !== false && _logical != null ? ((!(equiv(active, state.panel))) && (((active.tagName === "INPUT")) || (((active.tagName === "input")) || (((active.tagName === "TEXTAREA")) || (((active.tagName === "textarea")) || ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? active.closest("findbar") : _logical))(active.closest)))(((_logical) => (_logical !== false && _logical != null ? active.closest("#urlbar") : _logical))(active.closest))))(active.isContentEditable)))))) : _logical))(active))) {
    return blur_panel();
  } else {
    if (((e.key === "Escape"))) {
      if (truthy(vs.search_active)) {
        end_search(false);
        e.preventDefault();
        return e.stopImmediatePropagation();
      } else {
        if (truthy((() => { const some_thread____60 = vs; if ((some_thread____60 == null)) {
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
        if (((e.key.length === 1))) {
          blur_panel();
          if (((!truthy(e.ctrlKey)) && ((!truthy(e.altKey)) && (!truthy(e.metaKey))))) {
            return gBrowser.selectedBrowser.focus();
          }
        }
      }
    }
  }
} }, true);
return gBrowser.tabpanels.addEventListener("mousedown", () => { if (truthy(vs.panel_active)) {
  return blur_panel();
} }); };
  const consume_pending_cursor_move = () => { if ((!truthy(vs.pending_cursor_move))) {
  return false;
} else {
  (vs.pending_cursor_move = false);
  return true;
} };
  return {setCursor: set_cursor, activateVim: activate_vim, moveCursor: move_cursor, focusPanel: focus_panel, focusPanelUnlessUrlbar: focus_panel_unless_urlbar, blurPanel: blur_panel, createModeline: create_modeline, setupVimKeys: setup_vim_keys, setupGlobalKeys: setup_global_keys, cloneAsSibling: clone_as_sibling, startRename: start_rename, consumePendingCursorMove: consume_pending_cursor_move, runExCommand: (_pct1) => end_ex_mode(_pct1), openExCommandPicker: open_ex_command_picker};
}
