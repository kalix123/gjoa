// Thin adapter over gBrowser's tab API.

export const all_tabs = () => gBrowser.tabs;
export const selected_tab = () => gBrowser.selectedTab;
export const select_tab_bang = (tab) => (gBrowser.selectedTab = tab);
export const tab_container = () => gBrowser.tabContainer;

export function pin_tab(tab) {
  if (!tab.pinned) gBrowser.pinTab(tab);
}

export function unpin_tab(tab) {
  if (tab.pinned) gBrowser.unpinTab(tab);
}

export const toggle_pinned = (tab) => (tab.pinned ? unpin_tab(tab) : pin_tab(tab));
export const remove_tab = (tab) => gBrowser.removeTab(tab);
export const duplicate_tab = (tab) => gBrowser.duplicateTab(tab);
export const reload_tab = (tab) => gBrowser.reloadTab(tab);
export const move_tab_to = (tab, index) => gBrowser.moveTabTo(tab, index);

export function open_tab_bang(url) {
  return gBrowser.addTab(url, {
    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
  });
}

export function tab_icon(tab) {
  try {
    return gBrowser.getIcon(tab);
  } catch {
    return null;
  }
}
