import { create_logger_bang } from '../tabs/log.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const FLOATING_HINTS = [{key: "ctrl+j", act: "down"}, {key: "ctrl+k", act: "up"}, {key: "esc", act: "exit"}];

export function make_urlbar_bang(deps) {
  const urlbar = deps.urlbar;
  const root = document.documentElement;
  const log = create_logger_bang("urlbar");
  const state = {activated: false, intent: "current", backdrop: null, ghost: null, hints: null, healObs: null, healFn: null, urlbarH0: "", containerH0: "", stage: null, home: null, popover0: null, pinObs: null};
  const intent_attr = (_pct1) => (($$bc$equiv(_pct1, "newTab")) ? "new-tab" : "current");
  const container = () => ((_logical) => (_logical !== false && _logical != null ? _logical : urlbar.parentNode))((() => { const some_thread____0 = state.home; return ((some_thread____0 == null) ? null : some_thread____0.parent); })());
  const ensure_hints = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____1 = state.hints; return ((some_thread____1 == null) ? null : some_thread____1.isConnected); })()))) {
  const el = document.createElement("div");
  (el.id = "gjoa-urlbar-hints");
  el.setAttribute("aria-hidden", "true");
  FLOATING_HINTS.forEach((h) => { const pair = (() => { const __e____scope__4__1__4__1__20__3__2__4__3__3__1__2__1__0 = document.createElement("span"); (__e____scope__4__1__4__1__20__3__2__4__3__3__1__2__1__0.className = "gjoa-urlbar-hint");
return __e____scope__4__1__4__1__20__3__2__4__3__3__1__2__1__0; })();
const k = (() => { const __e____scope__4__1__4__1__20__3__2__4__3__3__1__5__1__0 = document.createElement("span"); (__e____scope__4__1__4__1__20__3__2__4__3__3__1__5__1__0.className = "gjoa-urlbar-hint-key");
return __e____scope__4__1__4__1__20__3__2__4__3__3__1__5__1__0; })();
const a = (() => { const __e____scope__4__1__4__1__20__3__2__4__3__3__1__8__1__0 = document.createElement("span"); (__e____scope__4__1__4__1__20__3__2__4__3__3__1__8__1__0.className = "gjoa-urlbar-hint-act");
return __e____scope__4__1__4__1__20__3__2__4__3__3__1__8__1__0; })();
(k.textContent = h.key);
(a.textContent = h.act);
pair.appendChild(k);
pair.appendChild(a);
return el.appendChild(pair); });
  urlbar.appendChild(el);
  return (state.hints = el);
} };
  const ensure_stage_bang = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____2 = state.stage; return ((some_thread____2 == null) ? null : some_thread____2.isConnected); })()))) {
  const el = (() => { const __e____scope__4__1__4__1__23__3__2__1__2__1__0 = document.createXULElement("toolbar"); (__e____scope__4__1__4__1__23__3__2__1__2__1__0.id = "gjoa-urlbar-stage");
return __e____scope__4__1__4__1__23__3__2__1__2__1__0; })();
  el.setAttribute("customizable", "false");
  root.appendChild(el);
  (state.stage = el);
}
return state.stage; };
  const ensure_staged_bang = () => { const st = ensure_stage_bang();
if ((!((_truthy) => _truthy !== false && _truthy != null)(st.contains(urlbar)))) {
  (state.home = {parent: urlbar.parentNode, next: urlbar.nextSibling});
  return st.appendChild(urlbar);
} };
  const restore_home_bang = () => { const h = state.home;
if (((_truthy) => _truthy !== false && _truthy != null)(h)) {
  (state.home = null);
  const p = h.parent;
  const n = h.next;
  if (((_truthy) => _truthy !== false && _truthy != null)(p)) {
    return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (n.parentNode === p) : _logical))(n)) ? p.insertBefore(urlbar, n) : p.appendChild(urlbar));
  }
} };
  const pin_container_height_bang = (c, want) => { if (((_truthy) => _truthy !== false && _truthy != null)(state.pinObs)) {
  state.pinObs.disconnect();
  (state.pinObs = null);
}
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(want, ""))) : _logical))(c))) {
  const obs = new MutationObserver(() => { if ((!($$bc$equiv(c.style.getPropertyValue("--urlbar-container-height"), want)))) {
  obs.disconnect();
  (state.pinObs = null);
  return c.style.setProperty("--urlbar-container-height", want);
} });
  obs.observe(c, {attributes: true, attributeFilter: ["style"]});
  (state.pinObs = obs);
  return window.setTimeout(() => { if ((state.pinObs === obs)) {
  obs.disconnect();
  return (state.pinObs = null);
} }, 1000);
} };
  const install_popover_shim_bang = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(urlbar.gjoaPopoverShim))) {
  const native = urlbar.showPopover;
  if (((_truthy) => _truthy !== false && _truthy != null)(native)) {
    (urlbar.gjoaPopoverShim = true);
    return (urlbar.showPopover = () => { if (((_truthy) => _truthy !== false && _truthy != null)(urlbar.hasAttribute("popover"))) {
  return native.call(urlbar);
} });
  }
} };
  const finish_teardown = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(state.activated))) {
  if (((_truthy) => _truthy !== false && _truthy != null)(state.healObs)) {
    state.healObs.disconnect();
    (state.healObs = null);
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(state.healFn)) {
    urlbar.removeEventListener("toggle", state.healFn);
    (state.healFn = null);
  }
  (() => { try {
    const a = document.activeElement;
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((a === urlbar) || urlbar.contains(a)) : _logical))(a))) {
    (() => { const some_thread____3 = window; if ((some_thread____3 == null)) {
  return null;
} else {
  const some_thread____4 = some_thread____3.gjoaFocusGuard;
  return ((some_thread____4 == null) ? null : some_thread____4.release());
} })();
    (() => { const some_thread____5 = window; if ((some_thread____5 == null)) {
  return null;
} else {
  const some_thread____6 = some_thread____5.gBrowser;
  if ((some_thread____6 == null)) {
    return null;
  } else {
    const some_thread____7 = some_thread____6.selectedBrowser;
    return ((some_thread____7 == null) ? null : some_thread____7.focus());
  }
} })();
  }
  restore_home_bang();
  (() => { const some_thread____8 = window; if ((some_thread____8 == null)) {
  return null;
} else {
  const some_thread____9 = some_thread____8.gURLBar;
  if ((some_thread____9 == null)) {
    return null;
  } else {
    const some_thread____10 = some_thread____9.view;
    return ((some_thread____10 == null) ? null : some_thread____10.close());
  }
} })();
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? urlbar.hidePopover : _logical))(urlbar.matches(":popover-open")))) {
    urlbar.hidePopover();
  }
  if (($$bc$equiv(state.popover0, "manual"))) {
    urlbar.setAttribute("popover", "manual");
    if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(urlbar.matches(":popover-open"))) && urlbar.showPopover))) {
      urlbar.showPopover();
    }
  } else {
    urlbar.removeAttribute("popover");
  }
  urlbar.removeAttribute("breakout-extend");
  if (($$bc$equiv(state.urlbarH0, ""))) {
    urlbar.style.removeProperty("--urlbar-height");
  } else {
    urlbar.style.setProperty("--urlbar-height", state.urlbarH0);
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(urlbar.parentNode)) {
    if (($$bc$equiv(state.containerH0, ""))) {
      urlbar.parentNode.style.removeProperty("--urlbar-container-height");
    } else {
      urlbar.parentNode.style.setProperty("--urlbar-container-height", state.containerH0);
    }
    return pin_container_height_bang(urlbar.parentNode, state.containerH0);
  }
  } catch (e) {
    return log("finishTeardown:collapse-error", {msg: String(e)});
  } })();
  root.setAttribute("gjoa-urlbar-snap", "");
  root.removeAttribute("gjoa-urlbar-floating");
  root.removeAttribute("gjoa-urlbar-intent");
  root.removeAttribute("gjoa-urlbar-teardown");
  root.removeAttribute("gjoa-urlbar-arming");
  if (((_truthy) => _truthy !== false && _truthy != null)(state.backdrop)) {
    state.backdrop.remove();
    (state.backdrop = null);
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(state.ghost)) {
    state.ghost.remove();
    (state.ghost = null);
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(state.hints)) {
    state.hints.remove();
    (state.hints = null);
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(state.stage)) {
    state.stage.remove();
    (state.stage = null);
  }
  return window.requestAnimationFrame(() => window.requestAnimationFrame(() => root.removeAttribute("gjoa-urlbar-snap")));
} };
  const deactivate_floating = () => { if (((_truthy) => _truthy !== false && _truthy != null)(state.activated)) {
  (state.activated = false);
  log("deactivateFloating");
  root.setAttribute("gjoa-urlbar-teardown", "");
  const h = {done: false, f: null};
  const fire = (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(h.done)) && ((!((_truthy) => _truthy !== false && _truthy != null)(e)) || ((e.target === urlbar) && ($$bc$equiv(e.propertyName, "opacity"))))))) {
  (h.done = true);
  (() => { try {
    return urlbar.removeEventListener("transitionend", h.f);
  } catch (__) {
    return null;
  } })();
  return finish_teardown();
} };
  (h.f = fire);
  urlbar.addEventListener("transitionend", fire);
  return window.setTimeout(() => fire(null), 260);
} };
  const ensure_floating_promoted = () => { (() => { try {
    if ((!((_truthy) => _truthy !== false && _truthy != null)(urlbar.hasAttribute("breakout")))) {
    urlbar.setAttribute("breakout", "true");
  }
  const c = container();
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(c.hasAttribute("breakout"))) : _logical))(c))) {
    c.setAttribute("breakout", "true");
  }
  if ((!($$bc$equiv(urlbar.getAttribute("popover"), "manual")))) {
    urlbar.setAttribute("popover", "manual");
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(urlbar.matches(":popover-open"))) && urlbar.showPopover))) {
    return urlbar.showPopover();
  }
  } catch (e) {
    return log("activateFloating:promote-error", {msg: String(e)});
  } })();
return (() => { try {
    (() => { const some_thread____11 = window; if ((some_thread____11 == null)) {
  return null;
} else {
  const some_thread____12 = some_thread____11.gURLBar;
  return ((some_thread____12 == null) ? null : some_thread____12.focus());
} })();
  return (() => { const some_thread____13 = window; if ((some_thread____13 == null)) {
  return null;
} else {
  const some_thread____14 = some_thread____13.gURLBar;
  return ((some_thread____14 == null) ? null : some_thread____14.select());
} })();
  } catch (e) {
    return log("activateFloating:focus-error", {msg: String(e)});
  } })(); };
  const heal = () => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(root.hasAttribute("gjoa-urlbar-teardown"))) : _logical))(root.hasAttribute("gjoa-urlbar-floating")) : _logical))(state.activated))) {
  if (((_truthy) => _truthy !== false && _truthy != null)((((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____15 = document.getElementById("window-modal-dialog"); return ((some_thread____15 == null) ? null : some_thread____15.open); })()) || root.hasAttribute("window-modal-open")))) {
    log("heal:modal-dismiss");
    return deactivate_floating();
  } else {
    if ((!((_truthy) => _truthy !== false && _truthy != null)((((_truthy) => _truthy !== false && _truthy != null)(urlbar.matches(":popover-open")) && urlbar.hasAttribute("breakout"))))) {
      log("heal:re-promote", {popoverOpen: ((_truthy) => _truthy !== false && _truthy != null)(urlbar.matches(":popover-open")), breakout: urlbar.hasAttribute("breakout")});
      ensure_staged_bang();
      return ensure_floating_promoted();
    }
  }
} };
  const install_heal = () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(state.healFn))) {
  (state.healFn = heal);
  urlbar.addEventListener("toggle", heal);
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(state.healObs))) {
  const obs = new MutationObserver(heal);
  obs.observe(urlbar, {attributes: true, attributeFilter: ["popover", "breakout"]});
  return (state.healObs = obs);
} };
  const activate_floating = (new_intent) => { (state.intent = new_intent);
root.removeAttribute("gjoa-urlbar-teardown");
const attr_val = intent_attr(state.intent);
if (((_truthy) => _truthy !== false && _truthy != null)(state.activated)) {
  log("activateFloating:re-arm", {intent: state.intent});
  root.setAttribute("gjoa-urlbar-intent", attr_val);
  ensure_hints();
  ensure_staged_bang();
  return ensure_floating_promoted();
} else {
  (state.activated = true);
  log("activateFloating", {intent: state.intent});
  if ((state.home == null)) {
    const c = container();
    (state.urlbarH0 = urlbar.style.getPropertyValue("--urlbar-height"));
    (state.containerH0 = (((_truthy) => _truthy !== false && _truthy != null)(c) ? c.style.getPropertyValue("--urlbar-container-height") : ""));
    (state.popover0 = urlbar.getAttribute("popover"));
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(state.ghost)) && (state.home == null)))) {
    (() => { try {
    const parent = container();
  if (((_truthy) => _truthy !== false && _truthy != null)(parent)) {
    const rect = urlbar.getBoundingClientRect();
    const cs = window.getComputedStyle(urlbar);
    const g = document.createElement("div");
    const txt = document.createElement("div");
    const ph = ((_logical) => (_logical !== false && _logical != null ? _logical : "Search with Google or enter address"))((() => { const some_thread____16 = window; if ((some_thread____16 == null)) {
  return null;
} else {
  const some_thread____17 = some_thread____16.gURLBar;
  if ((some_thread____17 == null)) {
    return null;
  } else {
    const some_thread____18 = some_thread____17.inputField;
    return ((some_thread____18 == null) ? null : some_thread____18.placeholder);
  }
} })());
    const container = ((_logical) => (_logical !== false && _logical != null ? _logical : urlbar))(urlbar.querySelector(".urlbar-input-container"));
    const visible_p = (el) => { const r = el.getBoundingClientRect();
const c = window.getComputedStyle(el);
return ((r.width > 0) && ((r.height > 0) && ((!($$bc$equiv(c.display, "none"))) && (!($$bc$equiv(c.visibility, "hidden")))))); };
    const inner_nodes = (el) => { const sr = el.shadowRoot;
return Array.from(el.querySelectorAll("*")).concat((((_truthy) => _truthy !== false && _truthy != null)(sr) ? Array.from(sr.querySelectorAll("*")) : [])).filter(visible_p); };
    const inside_p = (host, n) => (((_truthy) => _truthy !== false && _truthy != null)(host.contains(n)) || ((_truthy) => _truthy !== false && _truthy != null)((() => { const some_thread____19 = host.shadowRoot; return ((some_thread____19 == null) ? null : some_thread____19.contains(n)); })()));
    const content_url = (c) => { const m = new RegExp("url\\(\"?([^\")]+)\"?\\)").exec(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(c.content));
return (((_truthy) => _truthy !== false && _truthy != null)(m) ? m[1] : null); };
    const glyph_of = (el) => { const c = window.getComputedStyle(el);
const isrc = el.getAttribute("iconsrc");
const curl = content_url(c);
const src = (($$bc$equiv(el.localName, "img")) ? el.src : null);
return ((((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(isrc, ""))) : _logical))(isrc))) ? {css: ("".concat("background:url(\"", isrc, "\") center/contain no-repeat;"))} : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(src, ""))) : _logical))(src))) ? {css: ("".concat("background:url(\"", src, "\") center/contain no-repeat;"))} : (((_truthy) => _truthy !== false && _truthy != null)(curl)) ? {css: ("".concat("-moz-context-properties:fill;fill:", c.fill, ";", "background:url(\"", curl, "\") center/contain no-repeat;"))} : ((!($$bc$equiv(c.listStyleImage, "none")))) ? {css: ("".concat("-moz-context-properties:fill;fill:", c.fill, ";", "background:", c.listStyleImage, " center/contain no-repeat;"))} : ((!($$bc$equiv(c.backgroundImage, "none")))) ? {css: ("".concat("-moz-context-properties:fill;fill:", c.fill, ";", "background:", c.backgroundImage, " center/contain no-repeat;"))} : ((!($$bc$equiv(c.maskImage, "none")))) ? {css: ("".concat("background-color:", c.color, ";", "mask:", c.maskImage, " center/contain no-repeat;", "-webkit-mask:", c.maskImage, " center/contain no-repeat;"))} : null); };
    const own_text = (el) => Array.from(el.childNodes).filter((n) => ($$bc$equiv(n.nodeType, 3))).map((n) => n.textContent).join("").trim();
    const parts_of = (el) => { const nodes = inner_nodes(el);
const painter_p = (n) => ((_truthy) => _truthy !== false && _truthy != null)(glyph_of(n));
const leaf_glyph_p = (n) => ((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(nodes.some((m) => ((!($$bc$equiv(m, n))) && ((_logical) => (_logical !== false && _logical != null ? painter_p(m) : _logical))(inside_p(n, m)))))) : _logical))(painter_p(n));
const out = [];
nodes.forEach((n) => { const t = own_text(n);
return ((((_truthy) => _truthy !== false && _truthy != null)(leaf_glyph_p(n))) ? out.push({el: n, css: glyph_of(n).css}) : ((!($$bc$equiv(t, "")))) ? (() => { const c = window.getComputedStyle(n); return out.push({el: n, text: t, css: ("".concat("font:", c.font, ";color:", c.color, ";", "white-space:nowrap;overflow:hidden;"))}); })() : null); });
if (($$bc$equiv(out.length, 0))) {
  const g = glyph_of(el);
  if (((_truthy) => _truthy !== false && _truthy != null)(g)) {
    out.push({el: el, css: g.css});
  }
}
return out; };
    const opaque_p = (col) => ((_logical) => (_logical !== false && _logical != null ? ((!($$bc$equiv(col, "transparent"))) && (!((_truthy) => _truthy !== false && _truthy != null)(col.includes(", 0)")))) : _logical))(col);
    const box_chrome = (ch, r) => { const hit = [ch].concat(inner_nodes(ch)).find((n) => { const nr = n.getBoundingClientRect();
const c = window.getComputedStyle(n);
const nw = nr.width;
const nh = nr.height;
const rw = r.width;
const rh = r.height;
return ((Math.abs((nw - rw)) < 2) && ((Math.abs((nh - rh)) < 2) && ((_truthy) => _truthy !== false && _truthy != null)(opaque_p(c.backgroundColor)))); });
if (((_truthy) => _truthy !== false && _truthy != null)(hit)) {
  const c = window.getComputedStyle(hit);
  return ("".concat("background:", c.backgroundColor, ";", "border-radius:", c.borderRadius, ";"));
} else {
  return "";
} };
    const input_box = container.querySelector("moz-input-box, .urlbar-input-box");
    const text_el = ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : input_box))(urlbar.querySelector(".urlbar-input"))))((() => { const some_thread____20 = window; if ((some_thread____20 == null)) {
  return null;
} else {
  const some_thread____21 = some_thread____20.gURLBar;
  return ((some_thread____21 == null) ? null : some_thread____21.inputField);
} })());
    const rect_left = rect.left;
    const input_left = (((_truthy) => _truthy !== false && _truthy != null)(text_el) ? (() => { const text_left = text_el.getBoundingClientRect().left; return (text_left - rect_left); })() : 36);
    const kids = Array.from(container.children);
    const input_idx = kids.indexOf(input_box);
    const leading = (((input_idx >= 0) ? kids.slice(0, input_idx) : kids)).filter(visible_p);
    const value = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____22 = window; if ((some_thread____22 == null)) {
  return null;
} else {
  const some_thread____23 = some_thread____22.gURLBar;
  return ((some_thread____23 == null) ? null : some_thread____23.value);
} })());
    const has_value_p = (!($$bc$equiv(value.trim(), "")));
    const text_str = (((_truthy) => _truthy !== false && _truthy != null)(has_value_p) ? value : ph);
    (g.id = "gjoa-urlbar-ghost");
    g.setAttribute("aria-hidden", "true");
    (g.style.cssText = ("".concat("position:absolute;display:block;box-sizing:border-box;padding:0;", "width:", rect.width, "px;height:", rect.height, "px;", "pointer-events:none;overflow:hidden;white-space:nowrap;", "border:", cs.border, ";border-radius:", cs.borderRadius, ";", "background:", cs.backgroundColor, ";", "font:", cs.font, ";color:", cs.color, ";")));
    (() => { leading.forEach((ch) => {
  const r = ch.getBoundingClientRect();
  const r_left = r.left;
  const r_top = r.top;
  const rect_top = rect.top;
  const parts = parts_of(ch);
  const slot = document.createElement("div");
  if ((parts.length > 0)) {
    (slot.style.cssText = ("".concat("position:absolute;box-sizing:border-box;", "left:", (r_left - rect_left), "px;", "top:", (r_top - rect_top), "px;", "width:", r.width, "px;height:", r.height, "px;", box_chrome(ch, r))));
    (() => { parts.forEach((p) => {
  const pr = p.el.getBoundingClientRect();
  const pr_left = pr.left;
  const pr_top = pr.top;
  const ic = document.createElement("div");
  (ic.style.cssText = ("".concat("position:absolute;box-sizing:border-box;", "left:", (pr_left - r_left), "px;", "top:", (pr_top - r_top), "px;", "width:", pr.width, "px;height:", pr.height, "px;", "opacity:.9;", p.css)));
  if (((_truthy) => _truthy !== false && _truthy != null)(p.text)) {
    (ic.textContent = p.text);
  }
  slot.appendChild(ic);
}); })();
    g.appendChild(slot);
  }
}); })();
    (txt.textContent = text_str);
    (txt.style.cssText = ("".concat("position:absolute;top:0;bottom:0;display:flex;align-items:center;", "left:", input_left, "px;right:8px;overflow:hidden;", "text-overflow:ellipsis;opacity:", (((_truthy) => _truthy !== false && _truthy != null)(has_value_p) ? ".95" : ".55"), ";")));
    g.appendChild(txt);
    parent.insertBefore(g, urlbar);
    return (state.ghost = g);
  }
  } catch (e) {
    return log("activateFloating:ghost-error", {msg: String(e)});
  } })();
  }
  root.setAttribute("gjoa-urlbar-arming", "");
  root.setAttribute("gjoa-urlbar-floating", "");
  root.setAttribute("gjoa-urlbar-intent", attr_val);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(state.backdrop))) {
    const bd = document.createElement("div");
    (bd.id = "gjoa-urlbar-backdrop");
    bd.addEventListener("mousedown", () => deactivate_floating());
    root.appendChild(bd);
    (state.backdrop = bd);
  }
  ensure_staged_bang();
  ensure_hints();
  ensure_floating_promoted();
  install_heal();
  const reveal = () => root.removeAttribute("gjoa-urlbar-arming");
  window.requestAnimationFrame(() => window.requestAnimationFrame(reveal));
  return window.setTimeout(reveal, 120);
} };
  const is_floating = () => state.activated;
  const on_focus_out = (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(state.activated)) {
  return setTimeout(() => { if (((_truthy) => _truthy !== false && _truthy != null)(state.activated)) {
  const a = document.activeElement;
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((a === urlbar) || urlbar.contains(a)) : _logical))(a)))) {
    return deactivate_floating();
  }
} }, 0);
} };
  const handle_accel = (e) => { const accel = ((_logical) => (_logical !== false && _logical != null ? _logical : e.metaKey))(e.ctrlKey);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(e.shiftKey)) && (!((_truthy) => _truthy !== false && _truthy != null)(e.altKey))) : _logical))(accel))) {
  const k = e.key;
  if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(k, "j")) || ($$bc$equiv(k, "k"))))) {
    const view = (() => { const some_thread____24 = window; if ((some_thread____24 == null)) {
  return null;
} else {
  const some_thread____25 = some_thread____24.gURLBar;
  return ((some_thread____25 == null) ? null : some_thread____25.view);
} })();
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? view.selectBy : _logical))(view))) {
      e.preventDefault();
      e.stopImmediatePropagation();
      (() => { try {
    return view.selectBy((($$bc$equiv(k, "j")) ? 1 : -1));
  } catch (err) {
    return log("selectBy:error", {msg: String(err)});
  } })();
      return true;
    }
  }
} };
  const on_keydown = (e) => { if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(handle_accel(e))) && state.activated))) {
  return ((($$bc$equiv(e.key, "Escape"))) ? (() => { e.preventDefault();
e.stopImmediatePropagation();
deactivate_floating();
return setTimeout(() => (() => { try {
    (() => { const some_thread____26 = window; if ((some_thread____26 == null)) {
  return null;
} else {
  const some_thread____27 = some_thread____26.gURLBar;
  if ((some_thread____27 == null)) {
    return null;
  } else {
    const some_thread____28 = some_thread____27.view;
    return ((some_thread____28 == null) ? null : some_thread____28.close());
  }
} })();
  const a = document.activeElement;
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((a === urlbar) || urlbar.contains(a)) : _logical))(a))) {
    (() => { const some_thread____29 = window; if ((some_thread____29 == null)) {
  return null;
} else {
  const some_thread____30 = some_thread____29.gjoaFocusGuard;
  return ((some_thread____30 == null) ? null : some_thread____30.release());
} })();
    return (() => { const some_thread____31 = window; if ((some_thread____31 == null)) {
  return null;
} else {
  const some_thread____32 = some_thread____31.gBrowser;
  if ((some_thread____32 == null)) {
    return null;
  } else {
    const some_thread____33 = some_thread____32.selectedBrowser;
    return ((some_thread____33 == null) ? null : some_thread____33.focus());
  }
} })();
  }
  } catch (err) {
    return log("escape:teardown-error", {msg: String(err)});
  } })(), 135); })() : (($$bc$equiv(e.key, "Enter"))) ? (() => { if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(state.intent, "newTab")) && (!((_truthy) => _truthy !== false && _truthy != null)(e.altKey))))) {
  e.preventDefault();
  e.stopImmediatePropagation();
  log("intercept:newTab-enter");
  const target = e.target;
  target.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter", code: "Enter", keyCode: 13, which: 13, altKey: true, bubbles: true, cancelable: true, view: window}));
}
return setTimeout(deactivate_floating, 0); })() : null);
} };
  const on_activate_request = (e) => { const detail = e.detail;
return activate_floating((((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(detail.intent, "newTab")) : _logical))(detail)) ? "newTab" : "current")); };
  const on_deactivate_request = () => deactivate_floating();
  install_popover_shim_bang();
  urlbar.addEventListener("focusout", on_focus_out, true);
  urlbar.addEventListener("keydown", on_keydown, true);
  document.addEventListener("gjoa-urlbar-activate", on_activate_request);
  document.addEventListener("gjoa-urlbar-deactivate", on_deactivate_request);
  return {activateFloating: activate_floating, deactivateFloating: deactivate_floating, isFloating: is_floating, destroy: () => { urlbar.removeEventListener("focusout", on_focus_out, true);
urlbar.removeEventListener("keydown", on_keydown, true);
document.removeEventListener("gjoa-urlbar-activate", on_activate_request);
document.removeEventListener("gjoa-urlbar-deactivate", on_deactivate_request);
if (((_truthy) => _truthy !== false && _truthy != null)(state.healObs)) {
  state.healObs.disconnect();
  (state.healObs = null);
}
if (((_truthy) => _truthy !== false && _truthy != null)(state.healFn)) {
  urlbar.removeEventListener("toggle", state.healFn);
  (state.healFn = null);
}
if (((_truthy) => _truthy !== false && _truthy != null)(state.pinObs)) {
  state.pinObs.disconnect();
  (state.pinObs = null);
}
return deactivate_floating(); }};
}
