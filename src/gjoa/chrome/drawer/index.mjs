import { make_drag_overlay_bang } from './drag-overlay.mjs';
import { make_compact_bang } from './compact.mjs';
import { make_sidebar_button_bang } from './sidebar-button.mjs';
import { make_banner_bang } from './banner.mjs';
import { make_omni_icon_bang } from './omni-icon.mjs';
import { make_focus_guard_bang } from './focus.mjs';
import { make_layout_bang } from './layout.mjs';
import { make_urlbar_bang } from './urlbar.mjs';

import { truthy } from "../lib/value.mjs";
function init_bang() {
  const sidebar_main = document.getElementById("sidebar-container");
  const navigator_toolbox = document.getElementById("navigator-toolbox");
  const urlbar_container = document.getElementById("urlbar-container");
  const nav_bar = document.getElementById("nav-bar");
  const urlbar = document.getElementById("urlbar");
  if (((!truthy(sidebar_main)) || ((!truthy(navigator_toolbox)) || ((!truthy(urlbar_container)) || (!truthy(nav_bar)))))) {
    return console.error("gjoa-drawer: missing required elements");
  } else {
    const focus_guard = make_focus_guard_bang();
    const layout = make_layout_bang({sidebarMain: sidebar_main, navigatorToolbox: navigator_toolbox, urlbarContainer: urlbar_container, navBar: nav_bar, urlbar: urlbar});
    const drag_overlay = make_drag_overlay_bang({sidebarMain: sidebar_main});
    const compact = make_compact_bang({sidebarMain: sidebar_main, navigatorToolbox: navigator_toolbox, urlbar: urlbar});
    const state = {urlbar_api: null, urlbar_key: null};
    if (truthy(urlbar)) {
      (state.urlbar_api = make_urlbar_bang({urlbar: urlbar}));
      (state.urlbar_key = (e) => { const accel = ((_logical) => (_logical !== false && _logical != null ? _logical : e.metaKey))(e.ctrlKey);
if (truthy(((_logical) => (_logical !== false && _logical != null ? ((!truthy(e.shiftKey)) && (!truthy(e.altKey))) : _logical))(accel))) {
  if ((((e.key === "l")) || ((e.key === "L")))) {
    return state.urlbar_api.activateFloating("current");
  }
} });
      document.addEventListener("keydown", state.urlbar_key, true);
    }
    (window.gjoaCompact = compact);
    (window.gjoaFocusGuard = focus_guard);
    const sidebar_button = make_sidebar_button_bang({sidebarMain: sidebar_main, compact: compact});
    const banner = make_banner_bang();
    (() => { try {
    return make_omni_icon_bang({});
  } catch (e) {
    return console.error("gjoa-drawer: omni-icon failed", e);
  } })();
    const __el____scope__3__4__2__3__5__3__1__0 = window;
    const __ev____scope__3__4__2__3__5__3__1__3 = "unload";
    const __h____scope__3__4__2__3__5__3__1__6 = () => { layout.destroy();
drag_overlay.destroy();
compact.destroy();
(window.gjoaCompact = null);
(window.gjoaFocusGuard = null);
if (truthy(state.urlbar_key)) {
  document.removeEventListener("keydown", state.urlbar_key, true);
  (state.urlbar_key = null);
}
if (truthy(state.urlbar_api)) {
  state.urlbar_api.destroy();
}
sidebar_button.destroy();
focus_guard.destroy();
return banner.destroy(); };
    __el____scope__3__4__2__3__5__3__1__0.addEventListener(__ev____scope__3__4__2__3__5__3__1__3, __h____scope__3__4__2__3__5__3__1__6, {once: true});
    if (truthy(((__ev____scope__3__4__2__3__5__3__1__3 === "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__3__4__2__3__5__3__1__0.__gjoaHR.teardowns : _logical))(__el____scope__3__4__2__3__5__3__1__0.__gjoaHR))) {
      __el____scope__3__4__2__3__5__3__1__0.__gjoaHR.teardowns.push(__h____scope__3__4__2__3__5__3__1__6);
    }
    __h____scope__3__4__2__3__5__3__1__6;
    return console.log("gjoa-drawer: initialized");
  }
}

init_bang();
