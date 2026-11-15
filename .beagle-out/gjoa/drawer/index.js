import { make_drag_overlay_bang } from './drag-overlay.js';
import { make_compact_bang } from './compact.js';
import { make_sidebar_button_bang } from './sidebar-button.js';
import { make_banner_bang } from './banner.js';
import { make_omni_icon_bang } from './omni-icon.js';
import { make_focus_guard_bang } from './focus.js';
import { make_layout_bang } from './layout.js';
import { make_urlbar_bang } from './urlbar.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

function init_bang() {
  const sidebar_main = document.getElementById("sidebar-container");
  const navigator_toolbox = document.getElementById("navigator-toolbox");
  const urlbar_container = document.getElementById("urlbar-container");
  const nav_bar = document.getElementById("nav-bar");
  const urlbar = document.getElementById("urlbar");
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(sidebar_main)) || ((!((_truthy) => _truthy !== false && _truthy != null)(navigator_toolbox)) || ((!((_truthy) => _truthy !== false && _truthy != null)(urlbar_container)) || (!((_truthy) => _truthy !== false && _truthy != null)(nav_bar))))))) {
    return console.error("gjoa-drawer: missing required elements");
  } else {
    const focus_guard = make_focus_guard_bang();
    const layout = make_layout_bang({sidebarMain: sidebar_main, navigatorToolbox: navigator_toolbox, urlbarContainer: urlbar_container, navBar: nav_bar, urlbar: urlbar});
    const drag_overlay = make_drag_overlay_bang({sidebarMain: sidebar_main});
    const compact = make_compact_bang({sidebarMain: sidebar_main, navigatorToolbox: navigator_toolbox, urlbar: urlbar});
    const state = {urlbar_api: null, urlbar_key: null};
    if (((_truthy) => _truthy !== false && _truthy != null)(urlbar)) {
      (state["urlbar-api"] = make_urlbar_bang({urlbar: urlbar}));
      (state["urlbar-key"] = (e) => { const accel = ((_logical) => (_logical !== false && _logical != null ? _logical : e.metaKey))(e.ctrlKey);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(e.shiftKey)) && (!((_truthy) => _truthy !== false && _truthy != null)(e.altKey))) : _logical))(accel))) {
  if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(e.key, "l")) || ($$bc$equiv(e.key, "L"))))) {
    return state["urlbar-api"].activateFloating("current");
  }
} });
      document.addEventListener("keydown", state["urlbar-key"], true);
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
if (((_truthy) => _truthy !== false && _truthy != null)(state["urlbar-key"])) {
  document.removeEventListener("keydown", state["urlbar-key"], true);
  (state["urlbar-key"] = null);
}
if (((_truthy) => _truthy !== false && _truthy != null)(state["urlbar-api"])) {
  state["urlbar-api"].destroy();
}
sidebar_button.destroy();
focus_guard.destroy();
return banner.destroy(); };
    __el____scope__3__4__2__3__5__3__1__0.addEventListener(__ev____scope__3__4__2__3__5__3__1__3, __h____scope__3__4__2__3__5__3__1__6, {once: true});
    if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(__ev____scope__3__4__2__3__5__3__1__3, "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__3__4__2__3__5__3__1__0.__gjoaHR.teardowns : _logical))(__el____scope__3__4__2__3__5__3__1__0.__gjoaHR)))) {
      __el____scope__3__4__2__3__5__3__1__0.__gjoaHR.teardowns.push(__h____scope__3__4__2__3__5__3__1__6);
    }
    __h____scope__3__4__2__3__5__3__1__6;
    return console.log("gjoa-drawer: initialized");
  }
}

init_bang();
