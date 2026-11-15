import { all_tabs as adapter_all_tabs, selected_tab as adapter_selected_tab, pin_tab as adapter_pin_tab, unpin_tab as adapter_unpin_tab, toggle_pinned as adapter_toggle_pinned, remove_tab as adapter_remove_tab, duplicate_tab as adapter_duplicate_tab, reload_tab as adapter_reload_tab, select_tab_bang as adapter_select_tab, open_tab_bang as adapter_open_tab } from '../firefox/tabs.mjs';
import { create_logger_bang } from '../tabs/log.mjs';
import { tab_by_id } from '../tabs/helpers.mjs';
import { tree_of } from '../tabs/state.mjs';

import { truthy } from "../lib/value.mjs";
function resolve_tab(ref) {
  return (((typeof ref === "number")) ? tab_by_id(ref) : ref);
}

function depth_of(td) {
  return (() => { let d = td; let lv = 0; while (true) {
    if ((((d == null)) || ((d.parentId == null)))) { return lv; } else { const parent = (((typeof d.parentId === "number")) ? tab_by_id(d.parentId) : null); if (((parent == null))) { return (lv + 1); } else { const _recur_0 = tree_of.get(parent); const _recur_1 = (lv + 1); d = _recur_0; lv = _recur_1; continue; } }
  } })();
}

function project(tab) {
  const td = tree_of.get(tab);
  if (truthy(td)) {
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
} })()), label: ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(tab.label), customName: td.name, pinned: truthy(tab.pinned), selected: truthy(tab.selected), hidden: truthy(tab.hidden), parentId: td.parentId, depth: depth_of(td)};
  }
}

function list_tabs() {
  const out = [];
  const tabs = adapter_all_tabs();
  tabs.forEach((_pct1) => { const p = project(_pct1);
if (truthy(p)) {
  return out.push(p);
} });
  return out;
}

function selected_tab() {
  return project(adapter_selected_tab());
}

function get_tab(ref) {
  const t = resolve_tab(ref);
  if (truthy(t)) {
    return project(t);
  }
}

function with_tab(ref, op, reason, scheduler, log) {
  const t = resolve_tab(ref);
  if ((!truthy(t))) {
    return log("ref:not-found", {ref: (((typeof ref === "number")) ? ref : "(Tab elem)")});
  } else {
    op(t);
    return scheduler.markDirty("tabs", reason);
  }
}

export function make_window_tabs_bang(scheduler) {
  const log = create_logger_bang("platform/tabs");
  return {list: () => list_tabs(), selected: () => selected_tab(), get: (_pct1) => get_tab(_pct1), pin: (_pct1) => with_tab(_pct1, adapter_pin_tab, "Gjoa.tabs.pin", scheduler, log), unpin: (_pct1) => with_tab(_pct1, adapter_unpin_tab, "Gjoa.tabs.unpin", scheduler, log), togglePinned: (_pct1) => with_tab(_pct1, adapter_toggle_pinned, "Gjoa.tabs.togglePinned", scheduler, log), close: (_pct1) => with_tab(_pct1, adapter_remove_tab, "Gjoa.tabs.close", scheduler, log), duplicate: (r) => { const t = resolve_tab(r);
if (truthy(t)) {
  const dup = adapter_duplicate_tab(t);
  scheduler.markDirty("tabs", "Gjoa.tabs.duplicate");
  return project(dup);
} }, reload: (_pct1) => with_tab(_pct1, adapter_reload_tab, "Gjoa.tabs.reload", scheduler, log), select: (_pct1) => with_tab(_pct1, adapter_select_tab, "Gjoa.tabs.select", scheduler, log), activate: (r) => { const t = resolve_tab(r);
if ((!truthy(t))) {
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
