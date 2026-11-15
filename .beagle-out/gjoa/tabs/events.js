import { create_logger_bang } from './log.js';
import { CLOSED_MEMORY, SPACE_ATTR } from './constants.js';
import { all_rows, group_by_id, is_horizontal, level_of_bang, parent_of_tab_bang, pin_tab_id, read_pinned_id, same_node_p, subtree_rows_bang, tab_by_id, tab_url, tree_data_bang } from './helpers.js';
import { pop_saved_by_url, pop_saved_for_tab } from './snapshot.js';
import { closed_tabs, moving_tabs, row_of, saved_tab_queue, state, tree_of } from './state.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

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

export function make_events_bang(deps) {
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
