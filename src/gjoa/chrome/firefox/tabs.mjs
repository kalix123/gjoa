
import { truthy } from "../lib/value.mjs";
export function all_tabs() {
  return gBrowser.tabs;
}

export function selected_tab() {
  return gBrowser.selectedTab;
}

export function select_tab_bang(tab) {
  return (gBrowser.selectedTab = tab);
}

export function tab_container() {
  return gBrowser.tabContainer;
}

export function pin_tab(tab) {
  if ((!truthy(tab.pinned))) {
    return gBrowser.pinTab(tab);
  }
}

export function unpin_tab(tab) {
  if (truthy(tab.pinned)) {
    return gBrowser.unpinTab(tab);
  }
}

export function toggle_pinned(tab) {
  return (truthy(tab.pinned) ? unpin_tab(tab) : pin_tab(tab));
}

export function remove_tab(tab) {
  return gBrowser.removeTab(tab);
}

export function duplicate_tab(tab) {
  return gBrowser.duplicateTab(tab);
}

export function reload_tab(tab) {
  return gBrowser.reloadTab(tab);
}

export function move_tab_to(tab, index) {
  return gBrowser.moveTabTo(tab, index);
}

export function open_tab_bang(url) {
  const opts = {};
  (opts.triggeringPrincipal = Services.scriptSecurityManager.getSystemPrincipal());
  return gBrowser.addTab(url, opts);
}

export function tab_icon(tab) {
  return (() => { try {
    return gBrowser.getIcon(tab);
  } catch (__e) {
    return null;
  } })();
}
