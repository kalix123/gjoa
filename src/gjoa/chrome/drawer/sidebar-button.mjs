import { create_logger_bang } from '../tabs/log.mjs';

import { equiv, truthy } from "../lib/value.mjs";
function install_bang(sidebar_button, sidebar_main, compact) {
  const og_icon = sidebar_button.querySelector(".toolbarbutton-icon");
  const og_icon_style = (truthy(og_icon) ? getComputedStyle(og_icon).listStyleImage : null);
  (sidebar_button.style.display = "none");
  const button = (() => { const __e____scope__3__4__3__1__2__1__0 = document.createXULElement("toolbarbutton"); (__e____scope__3__4__3__1__2__1__0.id = "gjoa-sidebar-button");
return __e____scope__3__4__3__1__2__1__0; })();
  (button.className = sidebar_button.className);
  button.setAttribute("tooltiptext", "Toggle compact mode (right-click for more)");
  ["cui-areatype", "widget-id", "widget-type", "removable", "overflows"].forEach((_pct1) => { if ((sidebar_button.hasAttribute(_pct1))) {
  return button.setAttribute(_pct1, ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(sidebar_button.getAttribute(_pct1)));
} });
  button.setAttribute("removable", "false");
  button.setAttribute("skipintoolbarset", "true");
  if (truthy(og_icon_style)) {
    (button.style.listStyleImage = og_icon_style);
  }
  const nav_bar = document.getElementById("nav-bar");
  const reload_btn = document.getElementById("stop-reload-button");
  const panel_ui = document.getElementById("PanelUI-button");
  if (truthy(reload_btn)) {
    reload_btn.after(button);
  } else if (truthy(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? (panel_ui.parentNode === nav_bar) : _logical))(panel_ui) : _logical))(nav_bar))) {
    panel_ui.after(button);
  } else {
    sidebar_button.after(button);
  }
  const strip_hide_button = (() => { const __e____scope__3__4__3__9__1__2__1__0 = document.createXULElement("toolbarbutton"); (__e____scope__3__4__3__9__1__2__1__0.id = "gjoa-strip-hide-button");
return __e____scope__3__4__3__9__1__2__1__0; })();
  const on_strip_hide_click = () => (() => { try {
    return Services.prefs.setBoolPref("gjoa.layout.horizontalSidebarStrip", false);
  } catch (__e____scope__3__4__3__9__1__5__3__2__1__0) {
    return null;
  } })();
  const on_click = (_pct1) => { if (((_pct1.button === 0))) {
  return compact.toggle();
} };
  strip_hide_button.setAttribute("tooltiptext", "Hide strip");
  strip_hide_button.addEventListener("click", on_strip_hide_click);
  sidebar_main.append(strip_hide_button);
  button.addEventListener("click", on_click);
  const menu = (() => { const __e____scope__3__4__3__9__6__1__2__1__0 = document.createXULElement("menupopup"); (__e____scope__3__4__3__9__6__1__2__1__0.id = "gjoa-sidebar-button-menu");
return __e____scope__3__4__3__9__6__1__2__1__0; })();
  const compact_item = (() => { const __item____scope__3__4__3__9__6__2__1__2__1__0 = document.createXULElement("menuitem"); __item____scope__3__4__3__9__6__2__1__2__1__0.setAttribute("label", "Enable Compact");
__item____scope__3__4__3__9__6__2__1__2__1__0.addEventListener("command", () => compact.toggle());
return __item____scope__3__4__3__9__6__2__1__2__1__0; })();
  const collapse_item = (() => { const __item____scope__3__4__3__9__6__2__1__5__1__0 = document.createXULElement("menuitem"); __item____scope__3__4__3__9__6__2__1__5__1__0.setAttribute("label", "Collapse Layout");
__item____scope__3__4__3__9__6__2__1__5__1__0.addEventListener("command", () => (() => { try {
    const prev_display = sidebar_button.style.display;
  (sidebar_button.style.display = "");
  sidebar_button.click();
  return (sidebar_button.style.display = prev_display);
  } catch (e) {
    return console.error("[GJOA:drawer] collapse layout failed", e);
  } })());
return __item____scope__3__4__3__9__6__2__1__5__1__0; })();
  const strip_item = (() => { const __item____scope__3__4__3__9__6__2__1__8__1__0 = document.createXULElement("menuitem"); __item____scope__3__4__3__9__6__2__1__8__1__0.setAttribute("label", "Show Strip");
__item____scope__3__4__3__9__6__2__1__8__1__0.addEventListener("command", () => { const cur = (() => { try {
    return Services.prefs.getBoolPref("gjoa.layout.horizontalSidebarStrip", false);
  } catch (__e____scope__3__4__3__9__6__2__1__8__3__4__3__1__2__2__1__0) {
    return false;
  } })();
return (() => { try {
    return Services.prefs.setBoolPref("gjoa.layout.horizontalSidebarStrip", (!cur));
  } catch (__e____scope__3__4__3__9__6__2__1__8__3__4__3__2__2__1__0) {
    return null;
  } })(); });
return __item____scope__3__4__3__9__6__2__1__8__1__0; })();
  const sidebar_item = (() => { const __item____scope__3__4__3__9__6__2__1__11__1__0 = document.createXULElement("menuitem"); __item____scope__3__4__3__9__6__2__1__11__1__0.setAttribute("label", "Enable Sidebar");
__item____scope__3__4__3__9__6__2__1__11__1__0.addEventListener("command", () => (() => { try {
    return ((truthy(((_logical) => (_logical !== false && _logical != null ? window.SidebarController.toggle : _logical))(window.SidebarController))) ? window.SidebarController.toggle() : (truthy(((_logical) => (_logical !== false && _logical != null ? window.SidebarUI.toggle : _logical))(window.SidebarUI))) ? window.SidebarUI.toggle() : (() => { const cmd = document.getElementById("cmd_toggleSidebar"); return (truthy(((_logical) => (_logical !== false && _logical != null ? cmd.doCommand : _logical))(cmd)) ? cmd.doCommand() : console.error("[GJOA:drawer] no sidebar-toggle API available")); })());
  } catch (e) {
    return console.error("[GJOA:drawer] sidebar toggle failed", e);
  } })());
return __item____scope__3__4__3__9__6__2__1__11__1__0; })();
  const layout_item = (() => { const __item____scope__3__4__3__9__6__2__1__14__1__0 = document.createXULElement("menuitem"); __item____scope__3__4__3__9__6__2__1__14__1__0.setAttribute("label", "Horizontal Tabs");
__item____scope__3__4__3__9__6__2__1__14__1__0.addEventListener("command", () => { const vertical = (() => { try {
    return Services.prefs.getBoolPref("sidebar.verticalTabs", true);
  } catch (__e____scope__3__4__3__9__6__2__1__14__3__4__3__1__2__2__1__0) {
    return true;
  } })();
return (() => { try {
    return Services.prefs.setBoolPref("sidebar.verticalTabs", (!vertical));
  } catch (__e____scope__3__4__3__9__6__2__1__14__3__4__3__2__2__1__0) {
    return null;
  } })(); });
return __item____scope__3__4__3__9__6__2__1__14__1__0; })();
  const customize_item = (() => { const __item____scope__3__4__3__9__6__2__1__17__1__0 = document.createXULElement("menuitem"); __item____scope__3__4__3__9__6__2__1__17__1__0.setAttribute("label", "Customize Sidebar");
__item____scope__3__4__3__9__6__2__1__17__1__0.addEventListener("command", () => (() => { try {
    const native = document.getElementById("toolbar-context-customize-sidebar");
  if (truthy(((_logical) => (_logical !== false && _logical != null ? native.doCommand : _logical))(native))) {
    return native.doCommand();
  } else {
    if (truthy(((_logical) => (_logical !== false && _logical != null ? native.click : _logical))(native))) {
      return native.click();
    }
  }
  } catch (e) {
    return console.error("gjoa: customize sidebar failed", e);
  } })());
return __item____scope__3__4__3__9__6__2__1__17__1__0; })();
  const block_item = (() => { const __item____scope__3__4__3__9__6__2__1__20__1__0 = document.createXULElement("menuitem"); __item____scope__3__4__3__9__6__2__1__20__1__0.setAttribute("label", "Disable Blocking");
__item____scope__3__4__3__9__6__2__1__20__1__0.addEventListener("command", () => { if (truthy(window.gjoaBlocking)) {
  return window.gjoaBlocking.toggle();
} });
return __item____scope__3__4__3__9__6__2__1__20__1__0; })();
  (compact_item.id = "gjoa-toggle-compact");
  (collapse_item.id = "gjoa-collapse-layout");
  (strip_item.id = "gjoa-toggle-strip");
  (sidebar_item.id = "gjoa-toggle-sidebar");
  (layout_item.id = "gjoa-toggle-tab-layout");
  (customize_item.id = "gjoa-customize-sidebar");
  (block_item.id = "gjoa-toggle-blocking");
  menu.append(compact_item, collapse_item, strip_item, sidebar_item, layout_item, document.createXULElement("menuseparator"), block_item, customize_item);
  const popup_set = document.getElementById("mainPopupSet");
  if (truthy(popup_set)) {
    popup_set.append(menu);
  }
  button.setAttribute("context", "gjoa-sidebar-button-menu");
  const on_popup_showing = () => { const vertical = (() => { try {
    return Services.prefs.getBoolPref("sidebar.verticalTabs", true);
  } catch (__e____scope__3__4__3__9__6__2__12__1__2__3__1__2__2__1__0) {
    return true;
  } })();
const is_compact = (vertical ? compact.isCompactVertical() : compact.isCompactHorizontal());
compact_item.setAttribute("label", (truthy(is_compact) ? "Disable Compact" : "Enable Compact"));
(collapse_item.hidden = (!vertical));
if (vertical) {
  const expanded = sidebar_main.hasAttribute("sidebar-launcher-expanded");
  collapse_item.setAttribute("label", (expanded ? "Collapse Layout" : "Expand Layout"));
}
(strip_item.hidden = vertical);
if ((!vertical)) {
  const strip_on = (() => { try {
    return Services.prefs.getBoolPref("gjoa.layout.horizontalSidebarStrip", false);
  } catch (__e____scope__3__4__3__9__6__2__12__1__2__3__6__2__1__2__2__1__0) {
    return false;
  } })();
  strip_item.setAttribute("label", (strip_on ? "Hide Strip" : "Show Strip"));
}
const sidebar_open = (truthy(((_logical) => (_logical !== false && _logical != null ? (!(equiv(window.SidebarController.isOpen, undefined))) : _logical))(window.SidebarController)) ? window.SidebarController.isOpen : ((!truthy(sidebar_main.hidden)) && (sidebar_main.getBoundingClientRect().width > 0)));
sidebar_item.setAttribute("label", (truthy(sidebar_open) ? "Disable Sidebar" : "Enable Sidebar"));
layout_item.setAttribute("label", (vertical ? "Horizontal Tabs" : "Vertical Tabs"));
if (truthy(window.gjoaBlocking)) {
  block_item.setAttribute("label", (truthy(window.gjoaBlocking.enabled()) ? "Disable Blocking" : "Enable Blocking"));
}
if (truthy(compact.isCompactVertical())) {
  compact.pinSidebar();
}
if (truthy(compact.isCompactHorizontal())) {
  return compact.pinToolbox();
} };
  const on_popup_hidden = () => { compact.reconcile("menu:popuphidden");
return compact.reconcileHorizontal("menu:popuphidden"); };
  menu.addEventListener("popupshowing", on_popup_showing);
  menu.addEventListener("popuphidden", on_popup_hidden);
  return {destroy: () => { button.removeEventListener("click", on_click);
strip_hide_button.removeEventListener("click", on_strip_hide_click);
menu.removeEventListener("popupshowing", on_popup_showing);
menu.removeEventListener("popuphidden", on_popup_hidden);
menu.remove();
button.remove();
strip_hide_button.remove();
return (sidebar_button.style.display = ""); }};
}

export function make_sidebar_button_bang(deps) {
  const $beagle$binding$0 = deps;
  let sidebarMain = $beagle$binding$0["sidebarMain"];
  let compact = $beagle$binding$0["compact"];
  const log = create_logger_bang("drawer/sidebar-button");
  const sidebar_main = sidebarMain;
  const native = document.getElementById("sidebar-button");
  if (truthy(native)) {
    return install_bang(native, sidebar_main, compact);
  } else {
    log("init:no native #sidebar-button after nav-bar repair — skipping custom-button swap");
    return {destroy: () => { return null; }};
  }
}
