// Lookups for well-known browser.xhtml elements and window-level state.

const byId = (id) => () => document.getElementById(id);

export const ids = {
  sidebar_main: byId("sidebar-container"),
  navigator_toolbox: byId("navigator-toolbox"),
  urlbar: byId("urlbar"),
  urlbar_container: byId("urlbar-container"),
  nav_bar: byId("nav-bar"),
  tabs_toolbar: byId("TabsToolbar"),
  tabs_toolbar_target: byId("TabsToolbar-customization-target"),
  tabbrowser_tabs: byId("tabbrowser-tabs"),
  main_popup_set: byId("mainPopupSet"),
  unified_extensions_button: byId("unified-extensions-button"),
  sidebar_button: byId("sidebar-button"),
};

export const delayed_startup_finished = () => gBrowserInit.delayedStartupFinished;

let cachedPrincipal;
export function system_principal_bang() {
  cachedPrincipal ??= Services.scriptSecurityManager.getSystemPrincipal();
  return cachedPrincipal;
}

export const import_esm = (url) => ChromeUtils.importESModule(url);
