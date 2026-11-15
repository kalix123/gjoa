import { equivV as $$bc$equiv } from 'beagle/core.js';

export function make_cross_window_tabs() {
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
