import { create_logger_bang } from '../tabs/log.js';

export function make_omni_icon_bang(deps) {
  const log = create_logger_bang("drawer/omni-icon");
  const nav_bar = document.getElementById("nav-bar");
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(nav_bar)) || document.getElementById("gjoa-omni-icon-button")))) {
    return {destroy: () => null};
  } else {
    const btn = (() => { const __e____scope__3__1__4__2__3__1__2__1__0 = document.createXULElement("toolbarbutton"); (__e____scope__3__1__4__2__3__1__2__1__0.id = "gjoa-omni-icon-button");
return __e____scope__3__1__4__2__3__1__2__1__0; })();
    const menu = (() => { const __e____scope__3__1__4__2__3__1__5__1__0 = document.createXULElement("menupopup"); (__e____scope__3__1__4__2__3__1__5__1__0.id = "gjoa-omni-icon-menu");
return __e____scope__3__1__4__2__3__1__5__1__0; })();
    const do_action = (name, thunk) => (() => { try {
    return thunk();
  } catch (e) {
    return log.error(("".concat(name, " failed")), e);
  } })();
    btn.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
    btn.setAttribute("type", "menu");
    btn.setAttribute("tooltiptext", "Navigation");
    btn.setAttribute("removable", "false");
    btn.setAttribute("skipintoolbarset", "true");
    btn.setAttribute("label", "Navigation");
    const back = (() => { const __item____scope__3__1__4__2__3__8__1__2__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__3__8__1__2__1__0.setAttribute("label", "Back");
__item____scope__3__1__4__2__3__8__1__2__1__0.addEventListener("command", () => do_action("back", () => { if (((_truthy) => _truthy !== false && _truthy != null)(gBrowser.canGoBack)) {
  return gBrowser.goBack();
} }));
return __item____scope__3__1__4__2__3__8__1__2__1__0; })();
    const fwd = (() => { const __item____scope__3__1__4__2__3__8__1__5__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__3__8__1__5__1__0.setAttribute("label", "Forward");
__item____scope__3__1__4__2__3__8__1__5__1__0.addEventListener("command", () => do_action("forward", () => { if (((_truthy) => _truthy !== false && _truthy != null)(gBrowser.canGoForward)) {
  return gBrowser.goForward();
} }));
return __item____scope__3__1__4__2__3__8__1__5__1__0; })();
    const reload = (() => { const __item____scope__3__1__4__2__3__8__1__8__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__3__8__1__8__1__0.setAttribute("label", "Reload");
__item____scope__3__1__4__2__3__8__1__8__1__0.addEventListener("command", () => do_action("reload", () => gBrowser.reload()));
return __item____scope__3__1__4__2__3__8__1__8__1__0; })();
    const ext = (() => { const __item____scope__3__1__4__2__3__8__1__11__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__3__8__1__11__1__0.setAttribute("label", "Extensions");
__item____scope__3__1__4__2__3__8__1__11__1__0.addEventListener("command", () => do_action("extensions", () => { const b = document.getElementById("unified-extensions-button");
if (((_truthy) => _truthy !== false && _truthy != null)(b)) {
  return b.click();
} }));
return __item____scope__3__1__4__2__3__8__1__11__1__0; })();
    const side = (() => { const __item____scope__3__1__4__2__3__8__1__14__1__0 = document.createXULElement("menuitem"); __item____scope__3__1__4__2__3__8__1__14__1__0.setAttribute("label", "Toggle sidebar");
__item____scope__3__1__4__2__3__8__1__14__1__0.addEventListener("command", () => do_action("sidebar", () => { const sc = window.SidebarController;
return ((((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? sc.toggle : _logical))(sc))) ? sc.toggle() : (() => { const cmd = document.getElementById("cmd_toggleSidebar"); if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? cmd.doCommand : _logical))(cmd))) {
  return cmd.doCommand();
} })()); }));
return __item____scope__3__1__4__2__3__8__1__14__1__0; })();
    menu.append(back, fwd, reload, document.createXULElement("menuseparator"), ext, side);
    btn.appendChild(menu);
    const pui = document.getElementById("PanelUI-button");
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (pui.parentNode === nav_bar) : _logical))(pui))) {
      pui.after(btn);
    } else {
      nav_bar.prepend(btn);
    }
    return {destroy: () => btn.remove()};
  }
}
