import { create_logger_bang } from './log.js';
import { state, row_of, selection, moving_tabs } from './state.js';
import { INDENT } from './constants.js';
import { all_rows, data_of_bang, is_horizontal, level_of_bang, level_of_row_bang, same_node_p, subtree_rows_bang, tab_by_id, tree_data_bang } from './helpers.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

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

export function make_drag_bang(deps) {
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
