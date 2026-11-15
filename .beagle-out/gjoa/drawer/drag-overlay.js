import { create_logger_bang } from '../tabs/log.js';

const PREF = "gjoa.view.draggable-sidebar";

const st = {overlay: null, resize_obs: null, mutation_obs: null, sidebar_main: null, arrowscrollbox: null, observer: null, log: null};

function update_bang() {
  const ov = st.overlay;
  const asb = st.arrowscrollbox;
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? asb : _logical))(ov))) {
    const container_rect = st["sidebar-main"].getBoundingClientRect();
    const asb_rect = asb.getBoundingClientRect();
    const tabs = asb.querySelectorAll("tab.tabbrowser-tab");
    const tab_count = tabs.length;
    const last_tab = ((tab_count > 0) ? tabs[(tab_count - 1)] : null);
    const top = (((_truthy) => _truthy !== false && _truthy != null)(last_tab) ? last_tab.getBoundingClientRect().bottom : asb_rect.top);
    const bottom = asb_rect.bottom;
    const asb_left = asb_rect.left;
    const container_left = container_rect.left;
    const container_top = container_rect.top;
    const height = Math.max(0.0, (bottom - top));
    (ov.style.left = ("".concat((asb_left - container_left), "px")));
    (ov.style.top = ("".concat((top - container_top), "px")));
    (ov.style.width = ("".concat(asb_rect.width, "px")));
    (ov.style.height = ("".concat(height, "px")));
    return (ov.style.display = ((height > 0) ? "" : "none"));
  }
}

function enable_bang() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(st.overlay))) {
    const el = document.createXULElement("box");
    const asb = st.arrowscrollbox;
    const log = st.log;
    (el.id = "gjoa-drag-overlay");
    st["sidebar-main"].appendChild(el);
    (st.overlay = el);
    if (((_truthy) => _truthy !== false && _truthy != null)(asb)) {
      const ro = new ResizeObserver(update_bang);
      ro.observe(asb);
      (st["resize-obs"] = ro);
      const mo = new MutationObserver(update_bang);
      mo.observe(asb, {childList: true});
      (st["mutation-obs"] = mo);
    }
    update_bang();
    return log("enable");
  }
}

function disable_bang() {
  if (((_truthy) => _truthy !== false && _truthy != null)(st.overlay)) {
    const log = st.log;
    if (((_truthy) => _truthy !== false && _truthy != null)(st["resize-obs"])) {
      st["resize-obs"].disconnect();
    }
    if (((_truthy) => _truthy !== false && _truthy != null)(st["mutation-obs"])) {
      st["mutation-obs"].disconnect();
    }
    (st["resize-obs"] = null);
    (st["mutation-obs"] = null);
    st.overlay.remove();
    (st.overlay = null);
    return log("disable");
  }
}

function destroy_bang() {
  (() => { try {
    return Services.prefs.removeObserver(PREF, st.observer);
  } catch (e) {
    return null;
  } })();
  return disable_bang();
}

export function make_drag_overlay_bang(deps) {
  (st.log = create_logger_bang("drawer/drag-overlay"));
  (st["sidebar-main"] = deps.sidebarMain);
  (st.arrowscrollbox = document.getElementById("tabbrowser-arrowscrollbox"));
  if (((_truthy) => _truthy !== false && _truthy != null)((() => { try {
    return Services.prefs.getBoolPref(PREF, true);
  } catch (__e____scope__8__1__7__1__2__1__0) {
    return true;
  } })())) {
    enable_bang();
  }
  const obs = {observe: () => (((_truthy) => _truthy !== false && _truthy != null)((() => { try {
    return Services.prefs.getBoolPref(PREF, true);
  } catch (__e____scope__8__1__8__1__2__2__3__1__2__1__0) {
    return true;
  } })()) ? enable_bang() : disable_bang())};
  (st.observer = obs);
  Services.prefs.addObserver(PREF, obs);
  return {destroy: destroy_bang};
}
