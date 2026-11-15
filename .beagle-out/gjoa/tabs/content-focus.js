import { create_logger_bang } from './log.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const UNSELECTABLE_INPUT_TYPES = ["button", "checkbox", "color", "file", "hidden", "image", "radio", "reset", "submit"];

function editable_element_p(el) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(el)) || (!($$bc$equiv(typeof el.nodeName, "string")))))) {
    return false;
  } else {
    if (($$bc$equiv(el.readOnly, true))) {
      return false;
    } else {
      const tag = el.nodeName.toLowerCase();
      return ((($$bc$equiv(tag, "input"))) ? (!((_truthy) => _truthy !== false && _truthy != null)(UNSELECTABLE_INPUT_TYPES.includes(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(el.type).toLowerCase()))) : (($$bc$equiv(tag, "textarea"))) ? true : (($$bc$equiv(tag, "select"))) ? true : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(typeof el.isContentEditable, "boolean")) && el.isContentEditable))) ? true : (() => { const role = (($$bc$equiv(typeof el.getAttribute, "function")) ? ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(el.getAttribute("role")).toLowerCase() : ""); return (($$bc$equiv(role, "textbox")) || (($$bc$equiv(role, "searchbox")) || (($$bc$equiv(role, "combobox")) || ($$bc$equiv(role, "application"))))); })());
    }
  }
}

function deep_active(doc) {
  return ((!((_truthy) => _truthy !== false && _truthy != null)(doc)) ? null : (() => { let a = doc.activeElement; while (true) {
    if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(a)) || editable_element_p(a)))) { return a; } else { const root = (() => { try {
    return ((_logical) => (_logical !== false && _logical != null ? _logical : a.shadowRoot))(a.openOrClosedShadowRoot);
  } catch (__e) {
    return null;
  } })(); if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? root.activeElement : _logical))(root))) { const _recur_0 = root.activeElement; a = _recur_0; continue; } else { return a; } }
  } })());
}

function same_process_editable_p(browser) {
  return (() => { try {
    const doc = browser.contentDocument;
  return ((!((_truthy) => _truthy !== false && _truthy != null)(doc)) ? false : (($$bc$equiv(doc.designMode, "on")) ? true : editable_element_p(deep_active(doc))));
  } catch (__e) {
    return false;
  } })();
}

export function make_content_focus_bang() {
  const log = create_logger_bang("contentFocus");
  log("init", {transport: "GjoaInput actor + same-process read"});
  return {contentInputFocused: () => (() => { try {
    const browser = gBrowser.selectedBrowser;
  return (((!((_truthy) => _truthy !== false && _truthy != null)(browser))) ? false : (((_truthy) => _truthy !== false && _truthy != null)(browser.contentDocument)) ? same_process_editable_p(browser) : ($$bc$equiv(browser._gjoaEditable, true)));
  } catch (__e) {
    return false;
  } })(), diag: () => { const holder = {sameProcess: null, actorCache: null};
(() => { try {
    const browser = gBrowser.selectedBrowser;
  if (((_truthy) => _truthy !== false && _truthy != null)(browser)) {
    (holder.sameProcess = same_process_editable_p(browser));
    return (holder.actorCache = browser._gjoaEditable);
  }
  } catch (__e) {
    return null;
  } })();
return holder; }, destroy: () => null};
}
