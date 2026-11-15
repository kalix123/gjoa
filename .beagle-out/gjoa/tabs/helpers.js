import { create_logger_bang } from './log.js';
import { PIN_ATTR, SPACE_ATTR } from './constants.js';
import { tree_of, state } from './state.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const log = create_logger_bang("tabs");

export function same_node_p(a, b) {
  return ((_truthy) => _truthy !== false && _truthy != null)(Object.is(a, b));
}

export const SS = (() => { const try_global = (() => { try {
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

export function try_register_pin_attr_bang() {
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

export function pin_tab_id(tab, id) {
  return (() => { try {
    return tab.setAttribute(PIN_ATTR, String(id));
  } catch (__e) {
    return null;
  } })();
}

export function read_pinned_id(tab) {
  return (() => { try {
    const raw = ((_logical) => (_logical !== false && _logical != null ? tab.getAttribute(PIN_ATTR) : _logical))(tab.getAttribute);
  return ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(((_logical) => (_logical !== false && _logical != null ? Number(raw) : _logical))(raw));
  } catch (__e) {
    return 0;
  } })();
}

export function tree_data_bang(tab) {
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

export function tab_by_id(id) {
  return (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(id, null)) || (($$bc$equiv(id, undefined)) || ((!($$bc$equiv(typeof id, "number"))) || (!((_truthy) => _truthy !== false && _truthy != null)(id)))))) ? null : Array.from(gBrowser.tabs).find((_pct1) => { const td = tree_of.get(_pct1);
return ((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(td.id, id)) : _logical))(td); }));
}

export function group_by_id(id) {
  if (((_truthy) => _truthy !== false && _truthy != null)(id)) {
    return all_rows().find((_pct1) => { const g = _pct1._group;
return ((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(g.id, id)) : _logical))(g); });
  }
}

export function parent_of_tab_bang(tab) {
  return tab_by_id(tree_data_bang(tab).parentId);
}

export function level_of_bang(tab) {
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

export function level_of_row_bang(row) {
  return (((row == null)) ? 0 : (((_truthy) => _truthy !== false && _truthy != null)(row._group)) ? ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(row._group.level) : (((_truthy) => _truthy !== false && _truthy != null)(row._tab)) ? level_of_bang(row._tab) : 0);
}

export function data_of_bang(row) {
  return ((((_truthy) => _truthy !== false && _truthy != null)(row._group)) ? row._group : (((_truthy) => _truthy !== false && _truthy != null)(row._tab)) ? tree_data_bang(row._tab) : null);
}

export function all_tabs() {
  return Array.from(gBrowser.tabs);
}

export function all_rows() {
  const pinned = (((_truthy) => _truthy !== false && _truthy != null)(state.pinnedContainer) ? Array.from(state.pinnedContainer.querySelectorAll(".gjoa-tab-row")) : []);
  const tree_rows = (((_truthy) => _truthy !== false && _truthy != null)(state.panel) ? Array.from(state.panel.querySelectorAll(".gjoa-tab-row, .gjoa-group-row")) : []);
  return pinned.concat(tree_rows);
}

export function has_children_bang(row) {
  const next = row.nextElementSibling;
  return (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(next)) || ($$bc$equiv(next, state.spacer)))) ? false : (level_of_row_bang(next) > level_of_row_bang(row)));
}

export function subtree_rows_bang(row) {
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

export function is_horizontal() {
  return ((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? state.panel.hasAttribute("gjoa-horizontal") : _logical))(state.panel));
}

export function tab_url(tab) {
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
