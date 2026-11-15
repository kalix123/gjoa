import { create_logger_bang } from './log.mjs';

import { truthy } from "../lib/value.mjs";
const UNSELECTABLE_INPUT_TYPES = ["button", "checkbox", "color", "file", "hidden", "image", "radio", "reset", "submit"];

function editable_element_p(el) {
  if (((!truthy(el)) || (!((typeof el.nodeName === "string"))))) {
    return false;
  } else {
    if (((el.readOnly === true))) {
      return false;
    } else {
      const tag = el.nodeName.toLowerCase();
      return ((((tag === "input"))) ? (!truthy(UNSELECTABLE_INPUT_TYPES.includes(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(el.type).toLowerCase()))) : (((tag === "textarea"))) ? true : (((tag === "select"))) ? true : (truthy(((typeof el.isContentEditable === "boolean")) && el.isContentEditable)) ? true : (() => { const role = (((typeof el.getAttribute === "function")) ? ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(el.getAttribute("role")).toLowerCase() : ""); return (((role === "textbox")) || (((role === "searchbox")) || (((role === "combobox")) || ((role === "application"))))); })());
    }
  }
}

function deep_active(doc) {
  return ((!truthy(doc)) ? null : (() => { let a = doc.activeElement; while (true) {
    if (truthy((!truthy(a)) || editable_element_p(a))) { return a; } else { const root = (() => { try {
    return ((_logical) => (_logical !== false && _logical != null ? _logical : a.shadowRoot))(a.openOrClosedShadowRoot);
  } catch (__e) {
    return null;
  } })(); if (truthy(((_logical) => (_logical !== false && _logical != null ? root.activeElement : _logical))(root))) { const _recur_0 = root.activeElement; a = _recur_0; continue; } else { return a; } }
  } })());
}

function same_process_editable_p(browser) {
  return (() => { try {
    const doc = browser.contentDocument;
  return ((!truthy(doc)) ? false : (((doc.designMode === "on")) ? true : editable_element_p(deep_active(doc))));
  } catch (__e) {
    return false;
  } })();
}

export function make_content_focus_bang() {
  const log = create_logger_bang("contentFocus");
  log("init", {transport: "GjoaInput actor + same-process read"});
  return {contentInputFocused: () => (() => { try {
    const browser = gBrowser.selectedBrowser;
  return (((!truthy(browser))) ? false : (truthy(browser.contentDocument)) ? same_process_editable_p(browser) : ((browser._gjoaEditable === true)));
  } catch (__e) {
    return false;
  } })(), diag: () => { const holder = {sameProcess: null, actorCache: null};
(() => { try {
    const browser = gBrowser.selectedBrowser;
  if (truthy(browser)) {
    (holder.sameProcess = same_process_editable_p(browser));
    return (holder.actorCache = browser._gjoaEditable);
  }
  } catch (__e) {
    return null;
  } })();
return holder; }, destroy: () => null};
}
