import { create_logger_bang } from '../tabs/log.mjs';

import { truthy } from "../lib/value.mjs";
const SHOW_DELAY_MS = 2000;

export function make_banner_bang() {
  const log = create_logger_bang("drawer/banner");
  const identity_box = document.getElementById("identity-box");
  if ((!truthy(identity_box))) {
    log("init:no-identity-box");
    return {destroy: () => null};
  } else {
    const state = {timer: null, banner: null};
    const show = () => { if ((!truthy(state.banner))) {
  const el = (() => { const __e____scope__4__1__4__2__3__1__5__3__2__1__2__1__0 = document.createXULElement("hbox"); (__e____scope__4__1__4__2__3__1__5__3__2__1__2__1__0.id = "gjoa-insecure-banner");
return __e____scope__4__1__4__2__3__1__5__3__2__1__2__1__0; })();
  el.setAttribute("align", "center");
  el.setAttribute("pack", "center");
  (el.textContent = "Gjoa - HTTP Alert: Not Secure");
  const browser_el = document.getElementById("browser");
  if (truthy(((_logical) => (_logical !== false && _logical != null ? browser_el.parentNode : _logical))(browser_el))) {
    browser_el.parentNode.insertBefore(el, browser_el);
    (state.banner = el);
    return log("show");
  } else {
    return log("show:no-browser-parent");
  }
} };
    const hide = () => { if (truthy(state.timer)) {
  clearTimeout(state.timer);
  (state.timer = null);
}
if (truthy(state.banner)) {
  state.banner.remove();
  (state.banner = null);
  return log("hide");
} };
    const check_bang = () => { const browser = gBrowser.selectedBrowser;
const uri = (truthy(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? browser.currentURI.spec : _logical))(browser.currentURI) : _logical))(browser)) ? browser.currentURI.spec : "");
const is_internal = ((_logical) => (_logical !== false && _logical != null ? _logical : uri.startsWith("chrome:")))(uri.startsWith("about:"));
const is_customizing = document.documentElement.hasAttribute("customizing");
const is_insecure = ((_logical) => (_logical !== false && _logical != null ? ((!truthy(is_internal)) && (!is_customizing)) : _logical))(identity_box.classList.contains("notSecure"));
if (truthy(((_logical) => (_logical !== false && _logical != null ? ((!truthy(state.timer)) && (!truthy(state.banner))) : _logical))(is_insecure))) {
  return (state.timer = setTimeout(show, SHOW_DELAY_MS));
} else {
  if ((!truthy(is_insecure))) {
    return hide();
  }
} };
    const class_observer = new MutationObserver(check_bang);
    const opts = {attributes: true};
    (opts.attributeFilter = ["class"]);
    class_observer.observe(identity_box, opts);
    gBrowser.tabContainer.addEventListener("TabSelect", check_bang);
    return {destroy: () => { class_observer.disconnect();
gBrowser.tabContainer.removeEventListener("TabSelect", check_bang);
return hide(); }};
  }
}
