import { row_of, state } from './state.js';
import { data_of_bang, has_children_bang, level_of_row_bang, subtree_rows_bang, tree_data_bang } from './helpers.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

export function build_context_menu_bang(deps) {
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

export function build_group_context_menu_bang(deps) {
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

export function build_panel_context_menu_bang(deps) {
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
