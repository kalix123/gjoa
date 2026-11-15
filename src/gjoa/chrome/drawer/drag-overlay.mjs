import { create_logger_bang } from '../tabs/log.mjs';

import { truthy } from "../lib/value.mjs";
const PREF = "gjoa.view.draggable-sidebar";

const st = {overlay: null, resize_obs: null, mutation_obs: null, sidebar_main: null, arrowscrollbox: null, observer: null, log: null};

function update_bang() {
  const ov = st.overlay;
  const asb = st.arrowscrollbox;
  if (truthy(((_logical) => (_logical !== false && _logical != null ? asb : _logical))(ov))) {
    const container_rect = st.sidebar_main.getBoundingClientRect();
    const asb_rect = asb.getBoundingClientRect();
    const tabs = asb.querySelectorAll("tab.tabbrowser-tab");
    const tab_count = tabs.length;
    const last_tab = ((tab_count > 0) ? tabs[(tab_count - 1)] : null);
    const top = (truthy(last_tab) ? last_tab.getBoundingClientRect().bottom : asb_rect.top);
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
  if ((!truthy(st.overlay))) {
    const el = document.createXULElement("box");
    const asb = st.arrowscrollbox;
    const log = st.log;
    (el.id = "gjoa-drag-overlay");
    st.sidebar_main.appendChild(el);
    (st.overlay = el);
    if (truthy(asb)) {
      const ro = new ResizeObserver(update_bang);
      ro.observe(asb);
      (st.resize_obs = ro);
      const mo = new MutationObserver(update_bang);
      mo.observe(asb, {childList: true});
      (st.mutation_obs = mo);
    }
    update_bang();
    return log("enable");
  }
}

function disable_bang() {
  if (truthy(st.overlay)) {
    const log = st.log;
    if (truthy(st.resize_obs)) {
      st.resize_obs.disconnect();
    }
    if (truthy(st.mutation_obs)) {
      st.mutation_obs.disconnect();
    }
    (st.resize_obs = null);
    (st.mutation_obs = null);
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
  (st.sidebar_main = deps.sidebarMain);
  (st.arrowscrollbox = document.getElementById("tabbrowser-arrowscrollbox"));
  if (truthy((() => { try {
    return Services.prefs.getBoolPref(PREF, true);
  } catch (__e____scope__8__1__7__1__2__1__0) {
    return true;
  } })())) {
    enable_bang();
  }
  const obs = {observe: () => (truthy((() => { try {
    return Services.prefs.getBoolPref(PREF, true);
  } catch (__e____scope__8__1__8__1__2__2__3__1__2__1__0) {
    return true;
  } })()) ? enable_bang() : disable_bang())};
  (st.observer = obs);
  Services.prefs.addObserver(PREF, obs);
  return {destroy: destroy_bang};
}
