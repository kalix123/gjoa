
import { equiv } from "../lib/value.mjs";
export const ids = {sidebar_main: () => document.getElementById("sidebar-container"), navigator_toolbox: () => document.getElementById("navigator-toolbox"), urlbar: () => document.getElementById("urlbar"), urlbar_container: () => document.getElementById("urlbar-container"), nav_bar: () => document.getElementById("nav-bar"), tabs_toolbar: () => document.getElementById("TabsToolbar"), tabs_toolbar_target: () => document.getElementById("TabsToolbar-customization-target"), tabbrowser_tabs: () => document.getElementById("tabbrowser-tabs"), main_popup_set: () => document.getElementById("mainPopupSet"), unified_extensions_button: () => document.getElementById("unified-extensions-button"), sidebar_button: () => document.getElementById("sidebar-button")};

export function delayed_startup_finished() {
  return gBrowserInit.delayedStartupFinished;
}

const state = {cached_principal: undefined};

export function system_principal_bang() {
  if ((equiv(state.cached_principal, undefined))) {
    const p = Services.scriptSecurityManager.getSystemPrincipal();
    (state.cached_principal = p);
    return p;
  } else {
    return state.cached_principal;
  }
}

export function import_esm(url) {
  return ChromeUtils.importESModule(url);
}
