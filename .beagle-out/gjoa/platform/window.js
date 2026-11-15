import { make_window_tabs_bang } from './window-tabs.js';

export function make_gjoa_window_bang(scheduler) {
  const window_id = crypto.randomUUID();
  return {windowId: window_id, tabs: make_window_tabs_bang(scheduler)};
}
