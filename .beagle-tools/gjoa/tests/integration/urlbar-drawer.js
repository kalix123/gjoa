import { wait_for } from '../dsl.js';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

const ENSURE_EXPANDED_DRAWER = "\n  Services.prefs.setBoolPref('sidebar.verticalTabs', true);\n  Services.prefs.setBoolPref('sidebar.revamp', true);\n  const sm = document.getElementById('sidebar-container');\n  if (sm && !sm.hasAttribute('sidebar-launcher-expanded')) {\n    sm.setAttribute('sidebar-launcher-expanded', '');\n  }\n  // This suite exercises Gjoa's non-Nova CSS path explicitly.\n  const nova = Services.prefs.getBoolPref('browser.nova.enabled', false);\n  return { hasToolbar: !!document.getElementById('gjoa-urlbar-toolbar'),\n           hasUrlbar: !!document.getElementById('urlbar'),\n           hasSidebarMain: !!sm, nova };\n";

const MEASURE_RESTING = "\n  const urlbar = document.getElementById('urlbar');\n  const toolbox = document.getElementById('navigator-toolbox');\n  const sm = document.getElementById('sidebar-container');\n  if (!urlbar || !toolbox || !sm) return { error: 'missing element',\n    urlbar: !!urlbar, toolbox: !!toolbox, sm: !!sm };\n  const cs = getComputedStyle(document.documentElement);\n  const inset = parseFloat(cs.getPropertyValue('--gjoa-sidebar-inset')) || 10;\n  const ic = urlbar.querySelector('.urlbar-input-container');\n  const u = urlbar.getBoundingClientRect();\n  const t = toolbox.getBoundingClientRect();\n  const s = sm.getBoundingClientRect();\n  return {\n    urlbarWidth: u.width, urlbarLeft: u.left, urlbarRight: u.right,\n    toolboxWidth: t.width, toolboxLeft: t.left, toolboxRight: t.right,\n    sidebarWidth: s.width, sidebarLeft: s.left, sidebarRight: s.right,\n    windowWidth: window.innerWidth,\n    inset,\n    breakoutExtend: urlbar.hasAttribute('breakout-extend'),\n    breakout: urlbar.hasAttribute('breakout'),\n    popoverOpen: urlbar.matches(':popover-open'),\n    urlbarHeightVar: getComputedStyle(urlbar).getPropertyValue('--urlbar-height'),\n    inputContainerTop: ic ? ic.getBoundingClientRect().top : null,\n    hints: !!document.getElementById('gjoa-urlbar-hints'),\n  };\n";

const MEASURE_FLOATING = "\n  const urlbar = document.getElementById('urlbar');\n  const sc = document.getElementById('sidebar-container');\n  if (!urlbar || !sc) return { error: 'missing element' };\n  const u = urlbar.getBoundingClientRect();\n  const s = sc.getBoundingClientRect();\n  const cy = Math.round(u.top + u.height / 2);\n  const hit = x => { const e = document.elementFromPoint(Math.round(x), cy);\n    return e ? { id: e.id || e.localName, inUrlbar: (e === urlbar || urlbar.contains(e)) }\n             : { id: null, inUrlbar: false }; };\n  const rects = urlbar.getClientRects();\n  const hints = document.getElementById('gjoa-urlbar-hints');\n  const hr = hints ? hints.getBoundingClientRect() : null;\n  const view = urlbar.querySelector('.urlbarView');\n  const vr = view ? view.getBoundingClientRect() : null;\n  return {\n    urlbarWidth: u.width, urlbarLeft: u.left, urlbarRight: u.right,\n    sidebarLeft: s.left, sidebarRight: s.right,\n    windowWidth: window.innerWidth,\n    hints: !!hints,\n    hintsInUrlbar: !!(hints && urlbar.contains(hints)),\n    hintsVisible: !!(hr && hr.width > 0 && hr.height > 0\n                     && getComputedStyle(hints).display !== 'none'\n                     && getComputedStyle(hints).visibility !== 'hidden'),\n    hintsBelowResults: !!(hr && (!vr || hr.top >= vr.bottom - 1)),\n    hintsText: hints ? hints.textContent.trim() : null,\n    floating: document.documentElement.hasAttribute('gjoa-urlbar-floating'),\n    arming: document.documentElement.hasAttribute('gjoa-urlbar-arming'),\n    breakoutExtend: urlbar.hasAttribute('breakout-extend'),\n    popoverOpen: urlbar.matches(':popover-open'),\n    clientRects: rects.length,\n    clientRectWidth: rects.length ? rects[0].width : null,\n    hitLeft: hit(u.left + 3), hitRight: hit(u.right - 3),\n  };\n";

const SUMMON_FLOATING = "\n  document.dispatchEvent(new CustomEvent('gjoa-urlbar-activate', { detail: { intent: 'current' } }));\n  try { window.focus(); gURLBar.focus(); } catch (e) {}\n  return true;\n";

const DISMISS_FLOATING = "\n  document.dispatchEvent(new CustomEvent('gjoa-urlbar-deactivate'));\n  return true;\n";

const EXTEND_FLOATING = "\n  const urlbar = document.getElementById('urlbar');\n  if (!urlbar) return false;\n  try {\n    urlbar.toggleAttribute('open', true);\n    if (window.gURLBar && window.gURLBar.startLayoutExtend) window.gURLBar.startLayoutExtend();\n    else urlbar.toggleAttribute('breakout-extend', true);\n  } catch (e) { urlbar.toggleAttribute('breakout-extend', true); }\n  return true;\n";

const MEASURE_EXTENDED = "\n  const urlbar = document.getElementById('urlbar');\n  if (!urlbar) return { error: 'no urlbar' };\n  try { if (window.gURLBar) {\n    window.gURLBar.focus();\n    urlbar.toggleAttribute('open', true);\n    if (window.gURLBar.startLayoutExtend) window.gURLBar.startLayoutExtend();\n    else urlbar.toggleAttribute('breakout-extend', true);\n  } else {\n    urlbar.toggleAttribute('open', true);\n    urlbar.toggleAttribute('breakout-extend', true);\n  } } catch (e) { return { error: 'extend failed: ' + (e && e.message || e) }; }\n  if (!urlbar.hasAttribute('breakout-extend')) return { error: 'breakout-extend not applied' };\n  const bg = urlbar.querySelector('.urlbar-background');\n  const ic = urlbar.querySelector('.urlbar-input-container');\n  const u = urlbar.getBoundingClientRect();\n  const bgRect = bg ? bg.getBoundingClientRect() : null;\n  const bgCS = bg ? getComputedStyle(bg) : null;\n  return {\n    hasBackground: !!bg,\n    bgHeight: bgRect ? bgRect.height : null,\n    bgTop: bgRect ? bgRect.top : null,\n    bgBottom: bgRect ? bgRect.bottom : null,\n    bgColor: bgCS ? bgCS.backgroundColor : null,\n    urlbarHeight: u.height,\n    inputContainerTop: ic ? ic.getBoundingClientRect().top : null,\n    breakoutExtend: urlbar.hasAttribute('breakout-extend'),\n  };\n";

const RESET_URLBAR = "\n  const urlbar = document.getElementById('urlbar');\n  try { if (window.gURLBar) { if (window.gURLBar.endLayoutExtend) window.gURLBar.endLayoutExtend(); window.gURLBar.blur(); } } catch (e) {}\n  if (urlbar) { urlbar.removeAttribute('open'); urlbar.removeAttribute('breakout-extend'); }\n  return true;\n";

const MEASURE_ANCHOR = "\n  const id = x => document.getElementById(x);\n  const urlbar = id('urlbar'), panel = id('gjoa-tab-panel'), header = id('gjoa-space-header');\n  const sc = id('sidebar-container');\n  if (!urlbar || !panel || !sc) return { error: 'missing element',\n    urlbar: !!urlbar, panel: !!panel, sc: !!sc };\n  const u = urlbar.getBoundingClientRect(), p = panel.getBoundingClientRect();\n  const c = urlbar.parentNode;\n  return {\n    urlbarBottom: u.bottom, urlbarHeight: u.height,\n    panelTop: p.top, panelHeight: p.height,\n    headerTop: header ? header.getBoundingClientRect().top : null,\n    gapAboveTabs: p.top - u.bottom,\n    sidebarBottom: sc.getBoundingClientRect().bottom,\n    urlbarHVar: getComputedStyle(urlbar).getPropertyValue('--urlbar-height').trim(),\n    containerHVar: c ? getComputedStyle(c).getPropertyValue('--urlbar-container-height').trim() : null,\n    containerId: c ? (c.id || c.localName) : null,\n    containerHeight: c ? c.getBoundingClientRect().height : null,\n    breakout: urlbar.hasAttribute('breakout'),\n  };\n";

const ARM_TEARDOWN_WATCH = "\n  const d = document.documentElement, u = document.getElementById('urlbar');\n  window.__gjoaAnchorWrite = null;\n  const obs = new MutationObserver(() => {\n    if (window.__gjoaAnchorWrite) return;\n    if (d.hasAttribute('gjoa-urlbar-teardown') || d.hasAttribute('gjoa-urlbar-floating')) return;\n    const c = u.parentNode;\n    window.__gjoaAnchorWrite = {\n      urlbarHVar: getComputedStyle(u).getPropertyValue('--urlbar-height').trim(),\n      containerHVar: c ? getComputedStyle(c).getPropertyValue('--urlbar-container-height').trim() : null,\n      containerId: c ? (c.id || c.localName) : null,\n    };\n    obs.disconnect();\n  });\n  obs.observe(d, { attributes: true, attributeFilter: ['gjoa-urlbar-teardown'] });\n  return true;\n";

const READ_TEARDOWN_WATCH = "return window.__gjoaAnchorWrite;";

const FLOATING_ARMED = "\n  const d = document.documentElement;\n  return d.hasAttribute('gjoa-urlbar-floating') && !d.hasAttribute('gjoa-urlbar-arming');\n";

const DISMISS_VIA_BACKDROP = "\n  const bd = document.getElementById('gjoa-urlbar-backdrop');\n  if (!bd) return false;\n  bd.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));\n  return true;\n";

const SNAP_RELEASED = "\n  return !document.documentElement.hasAttribute('gjoa-urlbar-snap');\n";

const DISMISS_THEN_RESUMMON = "\n  const [resolve] = arguments;\n  const u = document.getElementById('urlbar');\n  const deactivate = () => document.dispatchEvent(new CustomEvent('gjoa-urlbar-deactivate'));\n  deactivate();\n  requestAnimationFrame(() => requestAnimationFrame(() => {\n    const stage = document.getElementById('gjoa-urlbar-stage');\n    const staged = !!stage && stage.contains(u);\n    const paletteH = u.style.getPropertyValue('--urlbar-height');\n    document.dispatchEvent(new CustomEvent('gjoa-urlbar-activate', { detail: { intent: 'current' } }));\n    try { window.focus(); gURLBar.focus(); } catch (e) {}\n    requestAnimationFrame(() => { deactivate(); resolve({ staged, paletteH }); });\n  }));\n";

const FLOATING_TORN_DOWN = "\n  const d = document.documentElement;\n  return !d.hasAttribute('gjoa-urlbar-floating')\n      && !d.hasAttribute('gjoa-urlbar-teardown')\n      && !document.getElementById('gjoa-urlbar-ghost')\n      && !document.getElementById('gjoa-urlbar-backdrop')\n      && !document.getElementById('gjoa-urlbar-hints');\n";

const CAPTURE_POPOVER = "\n  const u = document.getElementById('urlbar');\n  return { manual: u && u.getAttribute('popover') === 'manual',\n           open: !!(u && u.matches(':popover-open')) };\n";

const RESTORE_POPOVER = "\n  const u = document.getElementById('urlbar');\n  const [manual, open] = arguments;\n  try {\n    if (u && manual && u.getAttribute('popover') !== 'manual') u.setAttribute('popover', 'manual');\n    if (u && open && !u.matches(':popover-open') && u.showPopover) u.showPopover();\n  } catch (e) {}\n  return true;\n";

const EVICT_BREAKOUT = "\n  window.__gjoaEvictSettled = false;\n  window.gURLBar.incrementBreakoutBlockerCount();\n  requestAnimationFrame(() => requestAnimationFrame(() => { window.__gjoaEvictSettled = true; }));\n  return true;\n";

const RESTORE_BREAKOUT = "\n  window.__gjoaEvictSettled = false;\n  window.gURLBar.decrementBreakoutBlockerCount();\n  requestAnimationFrame(() => requestAnimationFrame(() => { window.__gjoaEvictSettled = true; }));\n  return true;\n";

const EVICT_SETTLED = "return window.__gjoaEvictSettled === true;";

const MEASURE_PROMOTION = "\n  const urlbar = document.getElementById('urlbar');\n  const container = document.getElementById('urlbar-container');\n  const u = urlbar.getBoundingClientRect();\n  return {\n    popoverOpen: urlbar.matches(':popover-open'),\n    breakout: urlbar.hasAttribute('breakout'),\n    containerBreakout: !!(container && container.hasAttribute('breakout')),\n    left: u.left, width: u.width, windowWidth: window.innerWidth,\n  };\n";

function assert_promoted_bang(p, phase) {
  const tag = ("".concat("top-layer watchdog (", phase, "): "));
  const p_left = p.left;
  const p_width = p.width;
  const window_width = p.windowWidth;
  const centre_off = Math.abs((p_left - ((window_width - p_width) / 2)));
  if ((!((_truthy) => _truthy !== false && _truthy != null)(p.popoverOpen))) {
    (() => { throw new Error(("".concat(tag, "#urlbar evicted from the top layer (:popover-open false) — the ", "floating palette is laid out inside the drawer. ", JSON.stringify(p)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(p.breakout))) {
    (() => { throw new Error(("".concat(tag, "#urlbar lost [breakout] — .urlbar-background/.urlbarView stop ", "rendering, so the palette paints nothing. ", JSON.stringify(p)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(p.containerBreakout))) {
    (() => { throw new Error(("".concat(tag, "#urlbar-container lost [breakout]. ", JSON.stringify(p)))); })();
  }
  if ((!(centre_off <= 4))) {
    return (() => { throw new Error(("".concat(tag, "palette off-centre by ", centre_off.toFixed(1), "px — it is positioned by the sidebar subtree, not the ICB. ", JSON.stringify(p)))); })();
  }
}

const DEMOTE_AND_MEASURE = "\n  const [path] = arguments;\n  const u = document.getElementById('urlbar');\n  try {\n    if (path === 'breakout blocker') gURLBar.incrementBreakoutBlockerCount();\n    else if (path === 'uidensity change') gUIDensity.update(gUIDensity.MODE_COMPACT);\n    if (u.matches(':popover-open') && u.hidePopover) u.hidePopover();\n    u.removeAttribute('popover');\n  } catch (e) { return { error: 'demote via ' + path + ' threw: ' + String(e), path }; }\n  const stage = document.getElementById('gjoa-urlbar-stage');\n  const ur = u.getBoundingClientRect();\n  const cy = Math.round(ur.top + ur.height / 2);\n  const hit = x => { const e = document.elementFromPoint(Math.round(x), cy);\n    return e ? { id: e.id || e.localName, inUrlbar: (e === u || u.contains(e)) }\n             : { id: null, inUrlbar: false }; };\n  const rects = u.getClientRects();\n  return {\n    path,\n    staged: !!(stage && u.parentNode === stage),\n    stageOnRoot: !!(stage && stage.parentNode === document.documentElement),\n    popoverOpen: u.matches(':popover-open'),\n    left: ur.left, right: ur.right, width: ur.width, windowWidth: window.innerWidth,\n    clientRects: rects.length,\n    clientRectWidth: rects.length ? rects[0].width : null,\n    hitLeft: hit(ur.left + 3), hitRight: hit(ur.right - 3),\n  };\n";

const UNDEMOTE = "\n  const [path] = arguments;\n  try {\n    if (path === 'breakout blocker') gURLBar.decrementBreakoutBlockerCount();\n    else if (path === 'uidensity change') gUIDensity.update(gUIDensity.MODE_NORMAL);\n  } catch (e) {}\n  window.__gjoaEvictSettled = false;\n  requestAnimationFrame(() => requestAnimationFrame(() => { window.__gjoaEvictSettled = true; }));\n  return true;\n";

function assert_promotion_independent_bang(d) {
  const tag = ("".concat("staged palette (demoted via ", d.path, "): "));
  const d_left = d.left;
  const d_right = d.right;
  const window_width = d.windowWidth;
  const centre_off = Math.abs((((d_left + d_right) / 2) - (window_width / 2)));
  if ((!(!((_truthy) => _truthy !== false && _truthy != null)(d.error)))) {
    (() => { throw new Error(("".concat(tag, d.error))); })();
  }
  if ((!(!((_truthy) => _truthy !== false && _truthy != null)(d.popoverOpen)))) {
    (() => { throw new Error(("".concat(tag, "still :popover-open — the forced demotion did not take. ", JSON.stringify(d)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? d.stageOnRoot : _logical))(d.staged)))) {
    (() => { throw new Error(("".concat(tag, "#urlbar is not parked in #gjoa-urlbar-stage under documentElement, so ", "it is back inside the drawer's containing block + stacking context. ", JSON.stringify(d)))); })();
  }
  if ((!(centre_off <= 4))) {
    (() => { throw new Error(("".concat(tag, "off-centre by ", centre_off.toFixed(1), "px WITHOUT the promotion — ", "the stage is not holding the geometry. ", JSON.stringify(d)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((d.width >= 660) && (d.width <= 760))))) {
    (() => { throw new Error(("".concat(tag, "width ", d.width.toFixed(1), "px left the zen-sized band — the ", "drawer-scoped width rules took it back. ", JSON.stringify(d)))); })();
  }
  const client_rect_width = d.clientRectWidth;
  const d_width = d.width;
  if ((!((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(d.clientRects, 1)) && (Math.abs((client_rect_width - d_width)) < 1))))) {
    (() => { throw new Error(("".concat(tag, "client rect disagrees with its bounding rect. ", JSON.stringify(d)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? d.hitRight.inUrlbar : _logical))(d.hitLeft.inUrlbar)))) {
    return (() => { throw new Error(("".concat(tag, "CUT OFF — an edge point hit-tests outside #urlbar (left→", d.hitLeft.id, ", right→", d.hitRight.id, "); the content deck ", "is painting over the palette. ", JSON.stringify(d)))); })();
  }
}

const ENSURE_HORIZONTAL = "\n  Services.prefs.setBoolPref('sidebar.revamp', true);\n  Services.prefs.setBoolPref('gjoa.layout.dynamicOrientation', false);\n  const sm = document.getElementById('sidebar-container');\n  if (sm && !sm.hasAttribute('sidebar-launcher-expanded')) sm.setAttribute('sidebar-launcher-expanded', '');\n  Services.prefs.setBoolPref('sidebar.verticalTabs', false);\n  return true;\n";

const RESTORE_VERTICAL = "\n  Services.prefs.setBoolPref('sidebar.verticalTabs', true);\n  Services.prefs.clearUserPref('gjoa.layout.dynamicOrientation');\n  return true;\n";

const MEASURE_ROW = "\n  const ids = ['nav-bar', 'nav-bar-customization-target', 'urlbar-container',\n               'back-button', 'forward-button', 'stop-reload-button',\n               'gjoa-sidebar-button', 'unified-extensions-button', 'PanelUI-button'];\n  const row = {};\n  for (const id of ids) {\n    const e = document.getElementById(id);\n    if (!e) continue;\n    const r = e.getBoundingClientRect();\n    row[id] = [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];\n  }\n  const u = document.getElementById('urlbar');\n  const ur = u.getBoundingClientRect();\n  const g = document.getElementById('gjoa-urlbar-ghost');\n  const gr = g ? g.getBoundingClientRect() : null;\n  return {\n    horizontal: document.documentElement.hasAttribute('gjoa-horizontal-tabs'),\n    floating: document.documentElement.hasAttribute('gjoa-urlbar-floating'),\n    row,\n    urlbar: [Math.round(ur.left), Math.round(ur.top), Math.round(ur.width), Math.round(ur.height)],\n    urlbarParent: u.parentNode ? (u.parentNode.id || u.parentNode.localName) : null,\n    popoverAttr: u.getAttribute('popover'),\n    popoverOpen: u.matches(':popover-open'),\n    breakoutExtend: u.hasAttribute('breakout-extend'),\n    breakout: u.hasAttribute('breakout'),\n    urlbarHVar: u.style.getPropertyValue('--urlbar-height'),\n    containerBreakout: (() => { const c = document.getElementById('urlbar-container');\n      return !!(c && c.hasAttribute('breakout')); })(),\n    containerHVar: (() => { const c = document.getElementById('urlbar-container');\n      return c ? c.style.getPropertyValue('--urlbar-container-height') : null; })(),\n    ghost: !!g,\n    ghostRect: gr ? [Math.round(gr.left), Math.round(gr.top), Math.round(gr.width), Math.round(gr.height)] : null,\n    windowWidth: window.innerWidth,\n  };\n";

const SUMMON_VECTOR = "\n  const [vector] = arguments;\n  const u = document.getElementById('urlbar');\n  if (vector === 'event') {\n    try { gURLBar.focus(); gURLBar.select(); gURLBar.view.autoOpen({ event: new Event('command') }); } catch (e) {}\n    document.dispatchEvent(new CustomEvent('gjoa-urlbar-activate', { detail: { intent: 'current' } }));\n  } else if (vector === 'ctrl-l') {\n    document.dispatchEvent(new KeyboardEvent('keydown',\n      { key: 'l', ctrlKey: true, bubbles: true, cancelable: true }));\n    try { gURLBar.focus(); } catch (e) {}\n  } else {\n    const r = u.getBoundingClientRect();\n    const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);\n    const o = { bubbles: true, cancelable: true, composed: true, view: window,\n                clientX: x, clientY: y, button: 0, buttons: 1 };\n    const t = document.elementFromPoint(x, y) || u;\n    t.dispatchEvent(new MouseEvent('mousedown', o));\n    t.dispatchEvent(new MouseEvent('mouseup', Object.assign({}, o, { buttons: 0 })));\n    t.dispatchEvent(new MouseEvent('click', Object.assign({}, o, { buttons: 0 })));\n    try { gURLBar.focus(); gURLBar.view.autoOpen({ event: new Event('command') }); } catch (e) {}\n  }\n  return true;\n";

const MEASURE_LATCH = "\n  const id = x => document.getElementById(x);\n  const u = id('urlbar'), c = id('urlbar-container');\n  const tb = id('navigator-toolbox'), panel = id('gjoa-tab-panel');\n  if (!u || !c) return { error: 'missing element', urlbar: !!u, container: !!c };\n  return {\n    vertical: Services.prefs.getBoolPref('sidebar.verticalTabs', true),\n    containerParent: c.parentNode ? (c.parentNode.id || c.parentNode.localName) : null,\n    containerHVar: getComputedStyle(c).getPropertyValue('--urlbar-container-height').trim(),\n    urlbarHVar: getComputedStyle(u).getPropertyValue('--urlbar-height').trim(),\n    // The INLINE pair is what Firefox latches and gjoa's !important pins mask:\n    // a computed-only read passes while the other mode's row height sits on the\n    // element, waiting for any mode whose CSS does not out-rank it.\n    containerHInline: c.style.getPropertyValue('--urlbar-container-height'),\n    urlbarHInline: u.style.getPropertyValue('--urlbar-height'),\n    containerHeight: Math.round(c.getBoundingClientRect().height),\n    urlbarHeight: Math.round(u.getBoundingClientRect().height),\n    toolboxHeight: tb ? Math.round(tb.getBoundingClientRect().height) : null,\n    panelTop: panel ? Math.round(panel.getBoundingClientRect().top) : null,\n    breakout: u.hasAttribute('breakout'),\n    breakoutExtend: u.hasAttribute('breakout-extend'),\n  };\n";

const FLIP_ORIENTATION = "\n  const [vertical] = arguments;\n  Services.prefs.setBoolPref('gjoa.layout.dynamicOrientation', false);\n  Services.prefs.setBoolPref('sidebar.verticalTabs', vertical);\n  return true;\n";

const SET_DRAWER_MODE = "\n  const [mode] = arguments;\n  const sc = document.getElementById('sidebar-container');\n  Services.prefs.setBoolPref('sidebar.revamp', true);\n  Services.prefs.setBoolPref('gjoa.layout.dynamicOrientation', false);\n  Services.prefs.setBoolPref('sidebar.verticalTabs', true);\n  Services.prefs.setBoolPref('sidebar.position_start', mode !== 'sidebar-right');\n  Services.prefs.setBoolPref('gjoa.sidebar.compact', mode === 'compact-on');\n  if (sc) {\n    if (mode === 'compact-on') sc.setAttribute('gjoa-pinned', 'true');\n    else sc.removeAttribute('gjoa-pinned');\n  }\n  return mode;\n";

const RELATCHED = "\n  const u = document.getElementById('urlbar');\n  const c = document.getElementById('urlbar-container');\n  return !!(u && c && u.style.getPropertyValue('--urlbar-height')\n            && c.style.getPropertyValue('--urlbar-container-height'));\n";

const ARM_FRAMES = "\n  window.__gjoaFrames = 0;\n  const tick = () => { window.__gjoaFrames++;\n    if (window.__gjoaFrames < 6) requestAnimationFrame(tick); };\n  requestAnimationFrame(tick);\n  return true;\n";

const FRAMES_DONE = "return window.__gjoaFrames >= 6;";

const TOGGLE_FULLSCREEN = "\n  try { BrowserCommands.fullScreen(); } catch (e) { return { error: String(e) }; }\n  return true;\n";

const IN_FULLSCREEN = "return document.documentElement.hasAttribute('inFullscreen');";

const OUT_OF_FULLSCREEN = "return !document.documentElement.hasAttribute('inFullscreen');";

const MEASURE_FULLSCREEN = "\n  const u = document.getElementById('urlbar');\n  const stage = document.getElementById('gjoa-urlbar-stage');\n  const r = u.getBoundingClientRect();\n  const cy = Math.round(r.top + r.height / 2);\n  const hit = x => { const e = document.elementFromPoint(Math.round(x), cy);\n    return e ? { id: e.id || e.localName, inUrlbar: (e === u || u.contains(e)) }\n             : { id: null, inUrlbar: false }; };\n  return {\n    inFullscreen: document.documentElement.hasAttribute('inFullscreen'),\n    floating: document.documentElement.hasAttribute('gjoa-urlbar-floating'),\n    staged: !!(stage && stage.contains(u)),\n    stageVis: stage ? getComputedStyle(stage).visibility : null,\n    urlbarVis: getComputedStyle(u).visibility,\n    width: r.width, left: r.left, right: r.right, windowWidth: window.innerWidth,\n    hitLeft: hit(r.left + 3), hitMid: hit(r.left + r.width / 2), hitRight: hit(r.right - 3),\n    activeId: document.activeElement ? (document.activeElement.id ||\n              document.activeElement.localName) : null,\n    isInput: document.activeElement === gURLBar.inputField,\n  };\n";

const POPOVER_DEMOTED_PROBE = "\n  const u = document.getElementById('urlbar');\n  const had = u.getAttribute('popover');\n  try { u.hidePopover(); } catch (e) {}\n  u.removeAttribute('popover');\n  let threw = null;\n  try { u.showPopover(); } catch (e) { threw = String(e); }\n  if (had !== null) u.setAttribute('popover', had);\n  return { threw, shimmed: !!u.gjoaPopoverShim, restored: u.getAttribute('popover') };\n";

const RECT_EDGE = ["left", "top", "width", "height"];

function assert_row_held_bang(before, during, vector, phase) {
  const tag = ("".concat("horizontal nav-bar row (", vector, ", ", phase, "): "));
  const drift = [];
  Object.keys(before.row).forEach((id) => {
  const a = before.row[id];
  const b = during.row[id];
  if ((!((_truthy) => _truthy !== false && _truthy != null)(b))) {
    drift.push(("".concat("#", id, " VANISHED from the row")));
  } else {
    [0, 1, 2, 3].forEach((i) => {
  const before_edge = a[i];
  const during_edge = b[i];
  if ((Math.abs((during_edge - before_edge)) > 1)) {
    drift.push(("".concat("#", id, " ", RECT_EDGE[i], " ", before_edge, "→", during_edge)));
  }
});
  }
});
  if ((!($$bc$equiv(drift.length, 0)))) {
    return (() => { throw new Error(("".concat(tag, "the row REFLOWED: ", drift.join(", "), ". The row's height is `.urlbar-container[breakout] { min-height: ", "var(--urlbar-container-height) }`, so a container-height leak reshapes ", "every widget on it. resting --urlbar-container-height=", before.containerHVar, " now=", during.containerHVar, ". before=", JSON.stringify(before), " during=", JSON.stringify(during)))); })();
  }
}

function assert_horizontal_palette_bang(f, vector) {
  const tag = ("".concat("horizontal floating palette (", vector, "): "));
  const urlbar_left = f.urlbar[0];
  const urlbar_width = f.urlbar[2];
  const window_width = f.windowWidth;
  const off = Math.abs(((urlbar_left + (urlbar_width / 2)) - (window_width / 2)));
  if ((!((_truthy) => _truthy !== false && _truthy != null)(f.horizontal))) {
    (() => { throw new Error(("".concat(tag, "window left horizontal tab mode mid-test"))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(f.floating))) {
    (() => { throw new Error(("".concat(tag, "gjoa-urlbar-floating not set — this vector never reached the float path. ", JSON.stringify(f)))); })();
  }
  if ((!($$bc$equiv(f.urlbarParent, "gjoa-urlbar-stage")))) {
    (() => { throw new Error(("".concat(tag, "#urlbar is parked on #", f.urlbarParent, ", not the stage. ", JSON.stringify(f)))); })();
  }
  if ((!(off <= 8))) {
    (() => { throw new Error(("".concat(tag, "OFF-CENTRE by ", off.toFixed(1), "px — anchored to the nav-bar slot ", "instead of the viewport. ", JSON.stringify(f)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((f.urlbar[2] >= 660) && (f.urlbar[2] <= 760))))) {
    (() => { throw new Error(("".concat(tag, "width ", f.urlbar[2], "px is outside the zen-sized 700px±40 band ", "at a ", f.windowWidth, "px window. ", JSON.stringify(f)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(f.ghost))) {
    return (() => { throw new Error(("".concat(tag, "no #gjoa-urlbar-ghost — the urlbar's slot in the toolbar row is empty. ", JSON.stringify(f)))); })();
  }
}

const MEASURE_CHIP = "\n  const urlbar = document.getElementById('urlbar');\n  const chip = urlbar.querySelector('.searchmode-switcher');\n  if (!chip) return { error: 'no .searchmode-switcher in #urlbar' };\n  const vis = el => { const r = el.getBoundingClientRect(); const c = getComputedStyle(el);\n    return r.width > 0 && r.height > 0 && c.display !== 'none' && c.visibility !== 'hidden'; };\n  const ur = urlbar.getBoundingClientRect();\n  const cr = chip.getBoundingClientRect();\n  const sr = chip.shadowRoot;\n  const icon = (sr && sr.querySelector('img[src]')) || chip.querySelector('img[src]');\n  const ir = icon ? icon.getBoundingClientRect() : null;\n  return {\n    searchmode: urlbar.hasAttribute('searchmode'),\n    chipVisible: vis(chip),\n    chip: { l: cr.left - ur.left, t: cr.top - ur.top, w: cr.width, h: cr.height },\n    iconSrc: icon ? icon.src : null,\n    iconVisible: !!(icon && vis(icon)),\n    icon: ir ? { l: ir.left - ur.left, t: ir.top - ur.top, w: ir.width, h: ir.height } : null,\n    urlbarWidth: ur.width,\n  };\n";

const MEASURE_GHOST_BOXES = "\n  const g = document.getElementById('gjoa-urlbar-ghost');\n  if (!g) return { error: 'no #gjoa-urlbar-ghost while the palette floats' };\n  const gr = g.getBoundingClientRect();\n  const boxes = Array.from(g.querySelectorAll('*')).map(el => {\n    const r = el.getBoundingClientRect(); const c = getComputedStyle(el);\n    return { l: r.left - gr.left, t: r.top - gr.top, w: r.width, h: r.height,\n             paints: c.backgroundImage !== 'none' || (!!c.maskImage && c.maskImage !== 'none') };\n  });\n  return { width: gr.width, count: boxes.length, boxes };\n";

const ENTER_SEARCHMODE = "\n  const urlbar = document.getElementById('urlbar');\n  try {\n    gURLBar.focus();\n    gURLBar.value = 'amaz';\n    gURLBar.searchMode = { source: 1 };\n  } catch (e) { return { error: String(e) }; }\n  return { searchmode: urlbar.hasAttribute('searchmode'), value: gURLBar.value };\n";

const EXIT_SEARCHMODE = "\n  try { gURLBar.searchMode = null; gURLBar.value = ''; gURLBar.blur(); } catch (e) {}\n  return !document.getElementById('urlbar').hasAttribute('searchmode');\n";

async function require_gjoa_css_bang(mn) {
  const applied = await mn.executeScript(("".concat("const v = getComputedStyle(document.documentElement)", ".getPropertyValue('--gjoa-urlbar-breathing').trim();", "return v === '8px';")));
  if ((!applied)) {
    return (() => { throw new Error(("".concat("gjoa.uc.css is NOT applied (--gjoa-urlbar-breathing unresolved) — ", "GjoaLoader did not register the gjoa stylesheet (e.g. $$bc-runtime ", "mismatch in a stale binary). This test would otherwise pass ", "vacuously on native Firefox defaults; rebuild the bundle/binary."))); })();
  }
}

function assert_floating_overlay_bang(f, phase) {
  const tag = ("".concat("floating palette (", phase, "): "));
  const urlbar_left = f.urlbarLeft;
  const urlbar_right = f.urlbarRight;
  const sidebar_left = f.sidebarLeft;
  const sidebar_right = f.sidebarRight;
  const window_width = f.windowWidth;
  const urlbar_width = f.urlbarWidth;
  const client_rect_width = f.clientRectWidth;
  if ((!(!((_truthy) => _truthy !== false && _truthy != null)(f.error)))) {
    (() => { throw new Error(("".concat(tag, "MEASURE-FLOATING error: ", JSON.stringify(f)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(f.floating))) {
    (() => { throw new Error(("".concat(tag, "gjoa-urlbar-floating not set — the Ctrl+L activate path never ran"))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((urlbar_left < (sidebar_left - 1)) || (urlbar_right > (sidebar_right + 1)))))) {
    (() => { throw new Error(("".concat(tag, "CONTAINED in #sidebar-container [", f.sidebarLeft.toFixed(1), "..", f.sidebarRight.toFixed(1), "] — it must overlay the page content. ", JSON.stringify(f)))); })();
  }
  const off = Math.abs((((urlbar_left + urlbar_right) / 2) - (window_width / 2)));
  if ((!(off <= 8))) {
    (() => { throw new Error(("".concat(tag, "OFF-CENTRE by ", off.toFixed(1), "px — anchored to the drawer ", "slot, not centred over the content. ", JSON.stringify(f)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((f.urlbarWidth >= 660) && (f.urlbarWidth <= 760))))) {
    (() => { throw new Error(("".concat(tag, "width ", f.urlbarWidth.toFixed(1), "px is outside the zen-sized 700px±40 band at a ", f.windowWidth.toFixed(1), "px window. ", JSON.stringify(f)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? f.hintsBelowResults : _logical))(f.hintsVisible) : _logical))(f.hintsInUrlbar) : _logical))(f.hints)))) {
    (() => { throw new Error(("".concat(tag, "hint footer missing/hidden/misplaced — present=", f.hints, " inUrlbar=", f.hintsInUrlbar, " visible=", f.hintsVisible, " belowResults=", f.hintsBelowResults, " text=", f.hintsText, ". ", JSON.stringify(f)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(f.popoverOpen))) {
    (() => { throw new Error(("".concat(tag, "NOT top-layer promoted (:popover-open false) — it is laid out ", "inside the drawer's clip chain. ", JSON.stringify(f)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(f.clientRects, 1)) && (Math.abs((client_rect_width - urlbar_width)) < 1))))) {
    (() => { throw new Error(("".concat(tag, "client rect disagrees with its bounding rect. ", JSON.stringify(f)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? f.hitRight.inUrlbar : _logical))(f.hitLeft.inUrlbar)))) {
    return (() => { throw new Error(("".concat(tag, "CLIPPED — an edge point hit-tests outside #urlbar (left→", f.hitLeft.id, ", right→", f.hitRight.id, "), so the painted box is narrower than its layout rect. ", JSON.stringify(f)))); })();
  }
}

function assert_resting_anchor_bang(a, wrote, rest0, mode) {
  const tag = ("".concat("resting anchor after a ", mode, " dismiss: "));
  const TOL = 2;
  const drift = (k) => { const now = Number($$bc$get(a, k));
const was = Number($$bc$get(rest0, k));
return Math.abs((now - was)); };
  if ((!(!((_truthy) => _truthy !== false && _truthy != null)(a.error)))) {
    (() => { throw new Error(("".concat(tag, "MEASURE-ANCHOR error: ", JSON.stringify(a)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(wrote))) {
    (() => { throw new Error(("".concat(tag, "no teardown was observed at all, so nothing below was exercised."))); })();
  }
  const __a____scope__53__4__4__1__0 = wrote.containerHVar;
  const __e____scope__53__4__4__1__3 = rest0.containerHVar;
  if ((!($$bc$equiv(__a____scope__53__4__4__1__0, __e____scope__53__4__4__1__3)))) {
    (() => { throw new Error(("".concat(("".concat(tag, "finish-teardown wrote a stage-derived --urlbar-container-height ", "onto #", wrote.containerId)), " — expected ", __e____scope__53__4__4__1__3, ", got ", __a____scope__53__4__4__1__0))); })();
  }
  const __a____scope__53__4__5__1__0 = wrote.urlbarHVar;
  const __e____scope__53__4__5__1__3 = rest0.urlbarHVar;
  if ((!($$bc$equiv(__a____scope__53__4__5__1__0, __e____scope__53__4__5__1__3)))) {
    (() => { throw new Error(("".concat(("".concat(tag, "finish-teardown wrote a palette-derived --urlbar-height onto #urlbar")), " — expected ", __e____scope__53__4__5__1__3, ", got ", __a____scope__53__4__5__1__0))); })();
  }
  if ((!(drift("panelTop") <= TOL))) {
    (() => { throw new Error(("".concat(tag, "#gjoa-tab-panel top drifted ", drift("panelTop").toFixed(1), "px (resting ", rest0.panelTop.toFixed(1), " → ", a.panelTop.toFixed(1), ") — the tab list no longer sits under the urlbar. after=", JSON.stringify(a)))); })();
  }
  if ((!(drift("headerTop") <= TOL))) {
    (() => { throw new Error(("".concat(tag, "#gjoa-space-header top drifted ", drift("headerTop").toFixed(1), "px. after=", JSON.stringify(a)))); })();
  }
  const gap_now = a.gapAboveTabs;
  const gap_was = rest0.gapAboveTabs;
  if ((!(drift("gapAboveTabs") <= TOL))) {
    (() => { throw new Error(("".concat(tag, "the gap between the urlbar bottom and the tab list grew by ", (gap_now - gap_was).toFixed(1), "px. after=", JSON.stringify(a)))); })();
  }
  if ((!(drift("urlbarHeight") <= TOL))) {
    (() => { throw new Error(("".concat(tag, "the resting #urlbar is ", a.urlbarHeight.toFixed(1), "px tall, was ", rest0.urlbarHeight.toFixed(1), "px. after=", JSON.stringify(a)))); })();
  }
  const __a____scope__53__4__10__1__0 = a.urlbarHVar;
  const __e____scope__53__4__10__1__3 = rest0.urlbarHVar;
  if ((!($$bc$equiv(__a____scope__53__4__10__1__0, __e____scope__53__4__10__1__3)))) {
    (() => { throw new Error(("".concat(("".concat(tag, "--urlbar-height leaked out of the floating palette")), " — expected ", __e____scope__53__4__10__1__3, ", got ", __a____scope__53__4__10__1__0))); })();
  }
  const __a____scope__53__4__11__1__0 = a.containerHVar;
  const __e____scope__53__4__11__1__3 = rest0.containerHVar;
  if ((!($$bc$equiv(__a____scope__53__4__11__1__0, __e____scope__53__4__11__1__3)))) {
    (() => { throw new Error(("".concat(("".concat(tag, "--urlbar-container-height leaked onto #", a.containerId)), " — expected ", __e____scope__53__4__11__1__3, ", got ", __a____scope__53__4__11__1__0))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(a.breakout))) {
    (() => { throw new Error(("".concat(tag, "#urlbar came back WITHOUT [breakout] — the resting row is now ", a.containerHeight.toFixed(1), "px, was ", rest0.containerHeight.toFixed(1), "px. after=", JSON.stringify(a)))); })();
  }
  if ((!(drift("containerHeight") <= TOL))) {
    return (() => { throw new Error(("".concat(tag, "the resting #", a.containerId, " is ", a.containerHeight.toFixed(1), "px tall, was ", rest0.containerHeight.toFixed(1), "px. after=", JSON.stringify(a)))); })();
  }
}

function assert_ghost_chip_bang(c, gh, phase) {
  const tag = ("".concat("ghost engine chip (", phase, "): "));
  const near_p = (a, b) => { const av = Number(a);
const bv = Number(b);
return (Math.abs((av - bv)) <= 2); };
  const at_rect = (want, painted_p) => gh.boxes.find((b) => (near_p(b.l, want.l) && (near_p(b.t, want.t) && (near_p(b.w, want.w) && (near_p(b.h, want.h) && ((!((_truthy) => _truthy !== false && _truthy != null)(painted_p)) || b.paints))))));
  if ((!(!((_truthy) => _truthy !== false && _truthy != null)(c.error)))) {
    (() => { throw new Error(("".concat(tag, "MEASURE-CHIP error: ", JSON.stringify(c)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(c.chipVisible))) {
    (() => { throw new Error(("".concat(tag, "the resting bar shows no engine chip — precondition gone, the ", "assertion below would pass vacuously. ", JSON.stringify(c)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? c.iconVisible : _logical))(c.icon)))) {
    (() => { throw new Error(("".concat(tag, "no engine icon inside the resting chip. ", JSON.stringify(c)))); })();
  }
  if ((!(!((_truthy) => _truthy !== false && _truthy != null)(gh.error)))) {
    (() => { throw new Error(("".concat(tag, "MEASURE-GHOST-BOXES error: ", JSON.stringify(gh)))); })();
  }
  if ((!near_p(gh.width, c.urlbarWidth))) {
    (() => { throw new Error(("".concat(tag, "ghost width ", gh.width.toFixed(1), "px != pre-summon urlbar width ", c.urlbarWidth.toFixed(1), "px, so the offsets below are not comparable."))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(at_rect(c.chip, false)))) {
    (() => { throw new Error(("".concat(tag, "no ghost box at the chip's rect ", JSON.stringify(c.chip), " — the chip is missing from the resting slot while the palette floats. ", "ghost=", JSON.stringify(gh)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(at_rect(c.icon, true)))) {
    return (() => { throw new Error(("".concat(tag, "no PAINTED ghost box at the engine icon's rect ", JSON.stringify(c.icon), " (src=", c.iconSrc, ") — the engine icon vanishes from the drawer on ", "Ctrl+L. ghost=", JSON.stringify(gh)))); })();
  }
}

export const tests = [{name: "urlbar — Ctrl+L palette OVERLAYS the content at spec width; resting bar stays in the drawer", run: async (mn) => { await mn.executeScript(ENSURE_EXPANDED_DRAWER);
await require_gjoa_css_bang(mn);
const orig = await mn.executeScript("return { w: window.outerWidth, h: window.outerHeight };");
const pop0 = await mn.executeScript(CAPTURE_POPOVER);
await mn.executeScript("window.resizeTo(1400, 900); return true;");
await await dsl.wait_for(mn, "return window.innerWidth === 1400;", 3000);
const in_drawer = await mn.executeScript(("".concat("const u = document.getElementById('urlbar');", "const tb = document.getElementById('gjoa-urlbar-toolbar');", "return !!(u && tb && tb.contains(u) && window.gjoaTest);")));
if ((!in_drawer)) {
  (() => { throw new Error(("".concat("#urlbar is not inside #gjoa-urlbar-toolbar — the gjoa drawer chrome ", "did not initialize (e.g. GjoaLoader $$bc-runtime mismatch in a stale ", "binary). Rebuild the bundle/binary; this test needs live gjoa chrome."))); })();
}
await await dsl.wait_for(mn, ("".concat("const u = document.getElementById('urlbar');", "if (!u) return false;", "const ur = u.getBoundingClientRect();", "return ur.width > 0 && ur.width < window.innerWidth * 0.6;")), 5000);
const r = await mn.executeScript(MEASURE_RESTING);
const urlbar_width = r.urlbarWidth;
const urlbar_left = r.urlbarLeft;
const urlbar_right = r.urlbarRight;
const toolbox_left = r.toolboxLeft;
const toolbox_right = r.toolboxRight;
const sidebar_width = r.sidebarWidth;
const inset = r.inset;
const window_width = r.windowWidth;
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(r.error)))) {
  (() => { throw new Error(("".concat("MEASURE-RESTING error: ", JSON.stringify(r)))); })();
}
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(r.breakoutExtend)))) {
  (() => { throw new Error("resting urlbar unexpectedly has [breakout-extend] — measure ran in the wrong state"); })();
}
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(r.hints)))) {
  (() => { throw new Error(("".concat("#gjoa-urlbar-hints present in the RESTING drawer urlbar — the hint ", "footer leaked out of the floating palette. ", JSON.stringify(r)))); })();
}
if ((!(urlbar_width < (window_width * 0.6)))) {
  (() => { throw new Error(("".concat("resting urlbar not contained — width ", r.urlbarWidth.toFixed(1), "px is ~the window width ", r.windowWidth.toFixed(1), "px ", "instead of the drawer width. ", JSON.stringify(r)))); })();
}
const expected_inner = (sidebar_width - (inset * 2));
const delta = Math.abs((urlbar_width - expected_inner));
if ((!(delta < 40))) {
  (() => { throw new Error(("".concat("resting urlbar width ", r.urlbarWidth.toFixed(1), "px not ~ drawer inner width ", expected_inner.toFixed(1), "px (sidebar ", r.sidebarWidth.toFixed(1), " − 2·", r.inset, "); delta=", delta.toFixed(1), "px. ", JSON.stringify(r)))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(((urlbar_left >= (toolbox_left - 2)) && (urlbar_right <= (toolbox_right + 2)))))) {
  (() => { throw new Error(("".concat("resting urlbar overflows the toolbox horizontally. ", JSON.stringify(r)))); })();
}
await mn.executeScript(SUMMON_FLOATING);
await await dsl.wait_for(mn, ("".concat("const d = document.documentElement;", "return d.hasAttribute('gjoa-urlbar-floating')", " && !d.hasAttribute('gjoa-urlbar-arming');")), 3000);
assert_floating_overlay_bang(await mn.executeScript(MEASURE_FLOATING), "on summon");
await mn.executeScript(EXTEND_FLOATING);
await await dsl.wait_for(mn, ("".concat("const u = document.getElementById('urlbar');", "return !!u && u.hasAttribute('breakout-extend');")), 2000);
assert_floating_overlay_bang(await mn.executeScript(MEASURE_FLOATING), "in breakout-extend");
await mn.executeScript(EVICT_BREAKOUT);
await await dsl.wait_for(mn, EVICT_SETTLED, 2000);
assert_promoted_bang(await mn.executeScript(MEASURE_PROMOTION), "after breakout blocker");
await mn.executeScript(RESTORE_BREAKOUT);
await await dsl.wait_for(mn, EVICT_SETTLED, 2000);
assert_promoted_bang(await mn.executeScript(MEASURE_PROMOTION), "after blocker release");
await (async () => { for (const path of ["breakout blocker", "raw hidePopover", "uidensity change"]) {
  assert_promotion_independent_bang(await mn.executeScript(DEMOTE_AND_MEASURE, [path]));
  await mn.executeScript(UNDEMOTE, [path]);
  await await dsl.wait_for(mn, EVICT_SETTLED, 2000);
} })();
await mn.executeScript(DISMISS_FLOATING);
await await dsl.wait_for(mn, FLOATING_TORN_DOWN, 2000);
await mn.executeScript(RESET_URLBAR);
await mn.executeScript(RESTORE_POPOVER, [pop0.manual, pop0.open]);
return await mn.executeScript("window.resizeTo(arguments[0], arguments[1]); return true;", [orig.w, orig.h]); }}, {name: "urlbar — expanded [breakout-extend] dropdown panel is OPAQUE (non-collapsed)", run: async (mn) => { await mn.executeScript(ENSURE_EXPANDED_DRAWER);
await require_gjoa_css_bang(mn);
const r = await mn.executeScript(MEASURE_EXTENDED);
const __ = await mn.executeScript(RESET_URLBAR);
const urlbar_height = r.urlbarHeight;
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(r.error)))) {
  (() => { throw new Error(("".concat("MEASURE-EXTENDED error: ", JSON.stringify(r)))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.breakoutExtend))) {
  (() => { throw new Error("could not drive urlbar into [breakout-extend]"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.hasBackground))) {
  (() => { throw new Error(".urlbar-background not found under [breakout-extend]"); })();
}
if ((!(r.bgHeight > 0))) {
  (() => { throw new Error(("".concat(".urlbar-background collapsed to zero height — height=", r.bgHeight.toFixed(1), "px. ", JSON.stringify(r)))); })();
}
if ((!(r.bgHeight >= (urlbar_height - 2)))) {
  (() => { throw new Error(("".concat(".urlbar-background too short to cover the input row — height ", r.bgHeight.toFixed(1), "px vs urlbar box ", r.urlbarHeight.toFixed(1), "px. ", JSON.stringify(r)))); })();
}
const bg = r.bgColor;
if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!($$bc$equiv(bg, "transparent"))) && (!($$bc$equiv(bg, "rgba(0, 0, 0, 0)")))) : _logical))(bg)))) {
  return (() => { throw new Error(("".concat(".urlbar-background is transparent — sidebar would bleed through. ", "background-color=", bg, ". ", JSON.stringify(r)))); })();
} }}, {name: "urlbar — focusing the urlbar does NOT shift the input row down", run: async (mn) => { await mn.executeScript(ENSURE_EXPANDED_DRAWER);
await require_gjoa_css_bang(mn);
const rest = await mn.executeScript(MEASURE_RESTING);
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(rest.error)))) {
  (() => { throw new Error(("".concat("MEASURE-RESTING error: ", JSON.stringify(rest)))); })();
}
if ((!(!($$bc$equiv(rest.inputContainerTop, null))))) {
  (() => { throw new Error("no .urlbar-input-container at rest"); })();
}
const ext = await mn.executeScript(MEASURE_EXTENDED);
const __ = await mn.executeScript(RESET_URLBAR);
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(ext.error)))) {
  (() => { throw new Error(("".concat("MEASURE-EXTENDED error: ", JSON.stringify(ext)))); })();
}
if ((!(!($$bc$equiv(ext.inputContainerTop, null))))) {
  (() => { throw new Error("no .urlbar-input-container under [breakout-extend]"); })();
}
const ext_top = Number(ext.inputContainerTop);
const rest_top = Number(rest.inputContainerTop);
const jump = Math.abs((ext_top - rest_top));
if ((!(jump <= 1.5))) {
  return (() => { throw new Error(("".concat("input row JUMPED on focus by ", jump.toFixed(2), "px ", "(rest top=", Number(rest.inputContainerTop).toFixed(2), ", extend top=", Number(ext.inputContainerTop).toFixed(2), ") — breathing-room padding leaked onto the input again. ", "rest=", JSON.stringify(rest), " ext=", JSON.stringify(ext)))); })();
} }}, {name: "urlbar — the resting ghost keeps the engine chip while the palette floats", run: async (mn) => { await mn.executeScript(ENSURE_EXPANDED_DRAWER);
await require_gjoa_css_bang(mn);
const pop0 = await mn.executeScript(CAPTURE_POPOVER);
const c0 = await mn.executeScript(MEASURE_CHIP);
await mn.executeScript(SUMMON_FLOATING);
await await dsl.wait_for(mn, ("".concat("const d = document.documentElement;", "return d.hasAttribute('gjoa-urlbar-floating')", " && !d.hasAttribute('gjoa-urlbar-arming');")), 3000);
const g0 = await mn.executeScript(MEASURE_GHOST_BOXES);
await mn.executeScript(DISMISS_FLOATING);
await await dsl.wait_for(mn, FLOATING_TORN_DOWN, 2000);
assert_ghost_chip_bang(c0, g0, "default state");
const sm = await mn.executeScript(ENTER_SEARCHMODE);
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(sm.error)))) {
  (() => { throw new Error(("".concat("could not enter search mode: ", JSON.stringify(sm)))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(sm.searchmode))) {
  (() => { throw new Error(("".concat("#urlbar has no [searchmode]: ", JSON.stringify(sm)))); })();
}
const c1 = await mn.executeScript(MEASURE_CHIP);
await mn.executeScript(SUMMON_FLOATING);
await await dsl.wait_for(mn, ("".concat("const d = document.documentElement;", "return d.hasAttribute('gjoa-urlbar-floating')", " && !d.hasAttribute('gjoa-urlbar-arming');")), 3000);
const g1 = await mn.executeScript(MEASURE_GHOST_BOXES);
await mn.executeScript(DISMISS_FLOATING);
await await dsl.wait_for(mn, FLOATING_TORN_DOWN, 2000);
await mn.executeScript(EXIT_SEARCHMODE);
await mn.executeScript(RESET_URLBAR);
await mn.executeScript(RESTORE_POPOVER, [pop0.manual, pop0.open]);
if ((!((_truthy) => _truthy !== false && _truthy != null)(c1.searchmode))) {
  (() => { throw new Error(("".concat("search mode did not reach #urlbar: ", JSON.stringify(c1)))); })();
}
return assert_ghost_chip_bang(c1, g1, "searchmode with text"); }}, {name: "urlbar — the drawer's resting anchors survive every float/dismiss cycle", run: async (mn) => { await mn.executeScript(ENSURE_EXPANDED_DRAWER);
await require_gjoa_css_bang(mn);
const pop0 = await mn.executeScript(CAPTURE_POPOVER);
const rest0 = await mn.executeScript(MEASURE_ANCHOR);
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(rest0.error)))) {
  (() => { throw new Error(("".concat("MEASURE-ANCHOR error before any summon: ", JSON.stringify(rest0)))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(((rest0.panelTop > 0) && (rest0.panelHeight > 0))))) {
  (() => { throw new Error(("".concat("no laid-out #gjoa-tab-panel to anchor against — the assertions below ", "would pass vacuously. ", JSON.stringify(rest0)))); })();
}
await (async () => { for (const mode of ["escape", "backdrop", "resummon"]) {
  await mn.executeScript(ARM_TEARDOWN_WATCH);
  await mn.executeScript(SUMMON_FLOATING);
  await await dsl.wait_for(mn, FLOATING_ARMED, 3000);
  if (($$bc$equiv(mode, "resummon"))) {
    const r = await mn.executeAsyncScript(DISMISS_THEN_RESUMMON);
    if ((!((_truthy) => _truthy !== false && _truthy != null)(r.staged))) {
      (() => { throw new Error(("".concat("the re-summon did not land inside the dismiss fade (#urlbar ", "already back in its slot), so this case asserts nothing: ", JSON.stringify(r)))); })();
    }
    if ((!(!($$bc$equiv(r.paletteH, ""))))) {
      (() => { throw new Error(("".concat("the palette never got a re-measured --urlbar-height, so there is ", "no floating value for the re-summon to mistake for the resting ", "one: ", JSON.stringify(r)))); })();
    }
    null;
  } else {
    await mn.executeScript((($$bc$equiv(mode, "backdrop")) ? DISMISS_VIA_BACKDROP : DISMISS_FLOATING));
  }
  await await dsl.wait_for(mn, FLOATING_TORN_DOWN, 3000);
  await await dsl.wait_for(mn, SNAP_RELEASED, 2000);
  assert_resting_anchor_bang(await mn.executeScript(MEASURE_ANCHOR), await mn.executeScript(READ_TEARDOWN_WATCH), rest0, mode);
} })();
await mn.executeScript(RESET_URLBAR);
return await mn.executeScript(RESTORE_POPOVER, [pop0.manual, pop0.open]); }}, {name: "urlbar — HORIZONTAL: every summon vector floats centred, the nav-bar row holds, the urlbar comes home", run: async (mn) => { await mn.executeScript(ENSURE_HORIZONTAL);
await await dsl.wait_for(mn, "return document.documentElement.hasAttribute('gjoa-horizontal-tabs');", 5000);
await require_gjoa_css_bang(mn);
const orig = await mn.executeScript("return { w: window.outerWidth, h: window.outerHeight };");
await mn.executeScript("window.resizeTo(1400, 900); return true;");
await await dsl.wait_for(mn, "return window.innerWidth === 1400;", 3000);
await await dsl.wait_for(mn, ("".concat("const c = document.getElementById('urlbar-container');", "return !!c && c.getBoundingClientRect().width > 200;")), 5000);
const rest0 = await mn.executeScript(MEASURE_ROW);
if ((!((_truthy) => _truthy !== false && _truthy != null)(rest0.horizontal))) {
  (() => { throw new Error(("".concat("not in horizontal tab mode. ", JSON.stringify(rest0)))); })();
}
if ((!($$bc$equiv(rest0.urlbarParent, "urlbar-container")))) {
  (() => { throw new Error(("".concat("#urlbar is not in #urlbar-container at rest — the drawer never gave the ", "bar back to the nav-bar row. ", JSON.stringify(rest0)))); })();
}
await (async () => { for (const vector of ["event", "ctrl-l", "click"]) {
  await mn.executeScript(SUMMON_VECTOR, [vector]);
  if (($$bc$equiv(vector, "click"))) {
    await await dsl.wait_for(mn, ("".concat("const u = document.getElementById('urlbar');", "return u.hasAttribute('breakout-extend');")), 3000);
    const c = await mn.executeScript(MEASURE_ROW);
    if ((!(!((_truthy) => _truthy !== false && _truthy != null)(c.floating)))) {
      (() => { throw new Error(("".concat("horizontal click-to-focus entered the FLOATING path — clicking ", "must expand the bar in place. ", JSON.stringify(c)))); })();
    }
    if ((!($$bc$equiv(c.urlbarParent, "urlbar-container")))) {
      (() => { throw new Error(("".concat("horizontal click-to-focus moved #urlbar out of the toolbar row ", "(now under #", c.urlbarParent, ") — the bar disappears from the ", "row instead of expanding in it. ", JSON.stringify(c)))); })();
    }
    if ((!(c.urlbar[2] > 0))) {
      (() => { throw new Error(("".concat("horizontal click-to-focus collapsed #urlbar to zero width. ", JSON.stringify(c)))); })();
    }
    assert_row_held_bang(rest0, c, vector, "click-expand");
    await mn.executeScript(RESET_URLBAR);
  } else {
    await await dsl.wait_for(mn, FLOATING_ARMED, 3000);
    const f = await mn.executeScript(MEASURE_ROW);
    assert_horizontal_palette_bang(f, vector);
    assert_row_held_bang(rest0, f, vector, "floating");
    (() => { [0, 1, 2, 3].forEach((i) => {
  const ghost_edge = f.ghostRect[i];
  const resting_edge = rest0.urlbar[i];
  if ((!(Math.abs((ghost_edge - resting_edge)) <= 2))) {
    (() => { throw new Error(("".concat("horizontal ghost (", vector, "): slot ", RECT_EDGE[i], " is ", ghost_edge, ", the resting urlbar's was ", resting_edge, " — the stand-in does not fill the slot. ", JSON.stringify(f)))); })();
  }
}); })();
    await mn.executeScript(DISMISS_FLOATING);
    await await dsl.wait_for(mn, FLOATING_TORN_DOWN, 3000);
    await await dsl.wait_for(mn, SNAP_RELEASED, 2000);
  }
  const a = await mn.executeScript(MEASURE_ROW);
  assert_row_held_bang(rest0, a, vector, "after dismiss");
  if ((!($$bc$equiv(a.urlbarParent, "urlbar-container")))) {
    (() => { throw new Error(("".concat("horizontal (", vector, "): #urlbar did not come home — it is under #", a.urlbarParent, ". ", JSON.stringify(a)))); })();
  }
  (() => { [0, 1, 2, 3].forEach((i) => {
  const now_edge = a.urlbar[i];
  const resting_edge = rest0.urlbar[i];
  if ((!(Math.abs((now_edge - resting_edge)) <= 2))) {
    (() => { throw new Error(("".concat("horizontal (", vector, "): the resting urlbar's ", RECT_EDGE[i], " is ", now_edge, ", was ", resting_edge, ". ", JSON.stringify(a)))); })();
  }
}); })();
  const __a____scope__55__1__3__5__4__6__5__4__4__5__1__0 = a.popoverAttr;
  const __e____scope__55__1__3__5__4__6__5__4__4__5__1__3 = rest0.popoverAttr;
  if ((!($$bc$equiv(__a____scope__55__1__3__5__4__6__5__4__4__5__1__0, __e____scope__55__1__3__5__4__6__5__4__4__5__1__3)))) {
    (() => { throw new Error(("".concat(("".concat("horizontal (", vector, "): the resting [popover] promotion was not restored")), " — expected ", __e____scope__55__1__3__5__4__6__5__4__4__5__1__3, ", got ", __a____scope__55__1__3__5__4__6__5__4__4__5__1__0))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(rest0.popoverOpen)) || a.popoverOpen)))) {
    (() => { throw new Error(("".concat("horizontal (", vector, "): the resting top-layer promotion was not ", "restored. ", JSON.stringify(a)))); })();
  }
} })();
await mn.executeScript(RESET_URLBAR);
await mn.executeScript("window.resizeTo(arguments[0], arguments[1]); return true;", [orig.w, orig.h]);
return await mn.executeScript(RESTORE_VERTICAL); }}, {name: "urlbar — an orientation flip while the bar is click-expanded does not latch the row height", run: async (mn) => { await (async () => { for (const mode of ["vertical", "sidebar-right", "compact-on"]) {
  await mn.executeScript(SET_DRAWER_MODE, [mode]);
  await mn.executeScript(ENSURE_EXPANDED_DRAWER);
  await require_gjoa_css_bang(mn);
  await await dsl.wait_for(mn, "return !!document.getElementById('gjoa-urlbar-toolbar');", 5000);
  await mn.executeScript(RESET_URLBAR);
  await mn.executeScript(ARM_FRAMES);
  await await dsl.wait_for(mn, FRAMES_DONE, 3000);
  const rest0 = await mn.executeScript(MEASURE_LATCH);
  if ((!(!((_truthy) => _truthy !== false && _truthy != null)(rest0.error)))) {
    (() => { throw new Error(("".concat(mode, ": MEASURE-LATCH error before the flip: ", JSON.stringify(rest0)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(rest0.containerParent, "gjoa-urlbar-toolbar")) : _logical))(rest0.vertical)))) {
    (() => { throw new Error(("".concat(mode, ": not in the expanded vertical drawer, so the flip below is not the ", "one under test. ", JSON.stringify(rest0)))); })();
  }
  await mn.executeScript(EXTEND_FLOATING);
  await await dsl.wait_for(mn, "return document.getElementById('urlbar').hasAttribute('breakout-extend');", 3000);
  await mn.executeScript(FLIP_ORIENTATION, [false]);
  await await dsl.wait_for(mn, "return document.documentElement.hasAttribute('gjoa-horizontal-tabs');", 5000);
  await mn.executeScript(FLIP_ORIENTATION, [true]);
  await await dsl.wait_for(mn, "return !!document.getElementById('gjoa-urlbar-toolbar');", 5000);
  await mn.executeScript(RESET_URLBAR);
  await await dsl.wait_for(mn, RELATCHED, 4000);
  await mn.executeScript(ARM_FRAMES);
  await await dsl.wait_for(mn, FRAMES_DONE, 3000);
  const a = await mn.executeScript(MEASURE_LATCH);
  if ((!(!((_truthy) => _truthy !== false && _truthy != null)(a.error)))) {
    (() => { throw new Error(("".concat(mode, ": MEASURE-LATCH error after the flip: ", JSON.stringify(a)))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(a.containerParent, "gjoa-urlbar-toolbar")) : _logical))(a.vertical)))) {
    (() => { throw new Error(("".concat(mode, ": the flip back did not restore the vertical drawer. ", JSON.stringify(a)))); })();
  }
  const __a____scope__55__1__3__6__4__3__9__14__4__1__0 = a.containerHInline;
  const __e____scope__55__1__3__6__4__3__9__14__4__1__3 = rest0.containerHInline;
  if ((!($$bc$equiv(__a____scope__55__1__3__6__4__3__9__14__4__1__0, __e____scope__55__1__3__6__4__3__9__14__4__1__3)))) {
    (() => { throw new Error(("".concat(("".concat(mode, ": the other mode's row height is latched INLINE on ", "#urlbar-container (--urlbar-container-height) — gjoa's !important pin ", "hides it here, and the next mode whose CSS does not out-rank it wears ", "it. after=", JSON.stringify(a))), " — expected ", __e____scope__55__1__3__6__4__3__9__14__4__1__3, ", got ", __a____scope__55__1__3__6__4__3__9__14__4__1__0))); })();
  }
  const __a____scope__55__1__3__6__4__3__9__14__5__1__0 = a.urlbarHInline;
  const __e____scope__55__1__3__6__4__3__9__14__5__1__3 = rest0.urlbarHInline;
  if ((!($$bc$equiv(__a____scope__55__1__3__6__4__3__9__14__5__1__0, __e____scope__55__1__3__6__4__3__9__14__5__1__3)))) {
    (() => { throw new Error(("".concat(("".concat(mode, ": --urlbar-height is latched INLINE on #urlbar. after=", JSON.stringify(a))), " — expected ", __e____scope__55__1__3__6__4__3__9__14__5__1__3, ", got ", __a____scope__55__1__3__6__4__3__9__14__5__1__0))); })();
  }
  const __a____scope__55__1__3__6__4__3__9__14__6__1__0 = a.containerHVar;
  const __e____scope__55__1__3__6__4__3__9__14__6__1__3 = rest0.containerHVar;
  if ((!($$bc$equiv(__a____scope__55__1__3__6__4__3__9__14__6__1__0, __e____scope__55__1__3__6__4__3__9__14__6__1__3)))) {
    (() => { throw new Error(("".concat(("".concat(mode, ": --urlbar-container-height latched across the orientation flip — ", "the other mode's row height is now pinned on #urlbar-container for the ", "life of this window. after=", JSON.stringify(a))), " — expected ", __e____scope__55__1__3__6__4__3__9__14__6__1__3, ", got ", __a____scope__55__1__3__6__4__3__9__14__6__1__0))); })();
  }
  const __a____scope__55__1__3__6__4__3__9__14__7__1__0 = a.urlbarHVar;
  const __e____scope__55__1__3__6__4__3__9__14__7__1__3 = rest0.urlbarHVar;
  if ((!($$bc$equiv(__a____scope__55__1__3__6__4__3__9__14__7__1__0, __e____scope__55__1__3__6__4__3__9__14__7__1__3)))) {
    (() => { throw new Error(("".concat(("".concat(mode, ": --urlbar-height latched across the orientation flip. after=", JSON.stringify(a))), " — expected ", __e____scope__55__1__3__6__4__3__9__14__7__1__3, ", got ", __a____scope__55__1__3__6__4__3__9__14__7__1__0))); })();
  }
  (() => { ["containerHeight", "urlbarHeight", "toolboxHeight", "panelTop"].forEach((k) => {
  const now = Number($$bc$get(a, k));
  const was = Number($$bc$get(rest0, k));
  const d = Math.abs((now - was));
  if ((!(d <= 2))) {
    (() => { throw new Error(("".concat(mode, ": ", k, " drifted ", d, "px across the orientation flip (", $$bc$get(rest0, k), " → ", $$bc$get(a, k), ") — the drawer column is ", "permanently displaced. after=", JSON.stringify(a)))); })();
  }
}); })();
} })();
await mn.executeScript(SET_DRAWER_MODE, ["vertical"]);
return await mn.executeScript(RESTORE_VERTICAL); }}, {name: "urlbar — the palette renders and takes focus in browser fullscreen", run: async (mn) => { await mn.executeScript(ENSURE_EXPANDED_DRAWER);
await require_gjoa_css_bang(mn);
const pop0 = await mn.executeScript(CAPTURE_POPOVER);
await mn.executeScript(TOGGLE_FULLSCREEN);
await await dsl.wait_for(mn, IN_FULLSCREEN, 5000);
await mn.executeScript(SUMMON_FLOATING);
await await dsl.wait_for(mn, FLOATING_ARMED, 3000);
const f = await mn.executeScript(MEASURE_FULLSCREEN);
await mn.executeScript(DISMISS_FLOATING);
await await dsl.wait_for(mn, FLOATING_TORN_DOWN, 3000);
await mn.executeScript(TOGGLE_FULLSCREEN);
await await dsl.wait_for(mn, OUT_OF_FULLSCREEN, 5000);
await mn.executeScript(RESET_URLBAR);
await mn.executeScript(RESTORE_POPOVER, [pop0.manual, pop0.open]);
if ((!((_truthy) => _truthy !== false && _truthy != null)(f.inFullscreen))) {
  (() => { throw new Error(("".concat("the window never entered browser fullscreen, so this case asserts ", "nothing. ", JSON.stringify(f)))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? f.staged : _logical))(f.floating)))) {
  (() => { throw new Error(("".concat("the palette never engaged in fullscreen. ", JSON.stringify(f)))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(f.stageVis, "collapse"))) && ($$bc$equiv(f.urlbarVis, "visible")))))) {
  (() => { throw new Error(("".concat("the staged palette computes stage visibility=", f.stageVis, ", urlbar visibility=", f.urlbarVis, " — it lays out but paints nothing. ", JSON.stringify(f)))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? f.hitRight.inUrlbar : _logical))(f.hitMid.inUrlbar) : _logical))(f.hitLeft.inUrlbar)))) {
  (() => { throw new Error(("".concat("the fullscreen palette is not hit-testable (left→", f.hitLeft.id, ", mid→", f.hitMid.id, ", right→", f.hitRight.id, "). ", JSON.stringify(f)))); })();
}
const left = f.left;
const right = f.right;
const window_width = f.windowWidth;
const off = Math.abs((((left + right) / 2) - (window_width / 2)));
if ((!(off <= 8))) {
  (() => { throw new Error(("".concat("the fullscreen palette is off-centre by ", off.toFixed(1), "px. ", JSON.stringify(f)))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(f.isInput))) {
  return (() => { throw new Error(("".concat("focus did not land in the urlbar input in fullscreen — it is on ", f.activeId, ", which a collapsed box cannot take. ", JSON.stringify(f)))); })();
} }}, {name: "urlbar — Firefox's unconditional showPopover() cannot throw at a Gjoa-demoted bar", run: async (mn) => { await mn.executeScript(ENSURE_EXPANDED_DRAWER);
await require_gjoa_css_bang(mn);
const pop0 = await mn.executeScript(CAPTURE_POPOVER);
const p = await mn.executeScript(POPOVER_DEMOTED_PROBE);
await mn.executeScript(RESET_URLBAR);
await mn.executeScript(RESTORE_POPOVER, [pop0.manual, pop0.open]);
if ((!((_truthy) => _truthy !== false && _truthy != null)(p.shimmed))) {
  (() => { throw new Error(("".concat("drawer/urlbar.bjs never installed the showPopover shim on #urlbar, so ", "every breakout re-measure taken while gjoa holds the bar demoted throws ", "into the window uncaught. ", JSON.stringify(p)))); })();
}
if ((!(p.threw == null))) {
  return (() => { throw new Error(("".concat("showPopover() on a gjoa-demoted #urlbar threw: ", p.threw, " — UrlbarInput#updateLayoutBreakoutDimensions calls it unconditionally, ", "so this aborts the rest of that frame's layout work. ", JSON.stringify(p)))); })();
} }}];

export default tests;
