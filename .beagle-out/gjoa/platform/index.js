import { make_scheduler_bang } from './scheduler.js';
import { make_gjoa_window_bang } from './window.js';
import { make_persisted } from './history.js';
import { make_cross_window_tabs } from './cross-window-tabs.js';

export function make_gjoa_bang(deps) {
  const scheduler = make_scheduler_bang();
  const win = make_gjoa_window_bang(scheduler);
  const persisted = make_persisted(deps.history);
  const cross_window_tabs = make_cross_window_tabs();
  return {windows: {current: () => win}, tabs: cross_window_tabs, history: persisted.history, sessions: persisted.sessions, checkpoints: persisted.checkpoints, flush: () => scheduler.flush(), diag: () => { const s = scheduler.diag();
const wid = win.windowId;
const iid = deps.history.instanceId();
return {scheduler: s, windowId: wid, instanceId: iid}; }, destroy: () => scheduler.destroy()};
}
