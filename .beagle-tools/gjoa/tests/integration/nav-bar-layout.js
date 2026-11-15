import { wait_for } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const orderCheckFn = "\n  function checkOrder(ids) {\n    const rects = [];\n    for (const spec of ids) {\n      let el = null, foundId = null;\n      for (const id of spec.split('|')) {\n        const e = document.getElementById(id);\n        if (!e) continue;\n        const cs = getComputedStyle(e);\n        if (cs.display === 'none' || cs.visibility === 'hidden') continue;\n        if (e.getBoundingClientRect().width < 1) continue;\n        el = e; foundId = id; break;\n      }\n      if (!el) return { ok: false, msg: 'missing/hidden icon: ' + spec };\n      const r = el.getBoundingClientRect();\n      rects.push({ id: foundId, left: Math.round(r.left), right: Math.round(r.right) });\n    }\n    for (let i = 1; i < rects.length; i++) {\n      const prev = rects[i - 1], cur = rects[i];\n      if (!(cur.left > prev.left) || cur.left < prev.right - 2) {\n        return { ok: false, msg: 'order violated at index ' + i + ' (' + prev.id + ' -> ' + cur.id + '): ' + JSON.stringify(rects) };\n      }\n    }\n    return { ok: true, rects: rects };\n  }\n";

const verticalOrderIds = ("".concat(orderCheckFn, "return checkOrder(['PanelUI-button', 'unified-extensions-button', ", "'gjoa-sidebar-button|sidebar-button', 'back-button', 'forward-button', 'stop-reload-button']);"));

const horizontalOrderIds = ("".concat(orderCheckFn, "return checkOrder(['back-button', 'forward-button', 'stop-reload-button', 'urlbar-container', ", "'gjoa-sidebar-button|sidebar-button', 'unified-extensions-button', 'PanelUI-button']);"));

const springPressureCheck = ("".concat(orderCheckFn, "\n  const target = document.getElementById('nav-bar-customization-target');\n  const uc = document.getElementById('urlbar-container');\n  if (!target || !uc || uc.parentElement !== target) {\n    return { skip: true, reason: 'no #urlbar-container inside #nav-bar-customization-target' };\n  }\n  const mk = () => { const s = document.createXULElement('toolbarspring');\n                     s.className = 'gjoa-test-spring'; return s; };\n  const a = mk(), b = mk();\n  let out;\n  try {\n    target.insertBefore(a, uc);\n    uc.after(b);\n    out = checkOrder(['back-button', 'forward-button', 'stop-reload-button', 'urlbar-container',\n                      'gjoa-sidebar-button|sidebar-button', 'unified-extensions-button', 'PanelUI-button']);\n    out.springWidths = [a.getBoundingClientRect().width, b.getBoundingClientRect().width];\n    out.springFlexGrow = getComputedStyle(a).flexGrow;\n  } finally { a.remove(); b.remove(); }\n  return out;\n"));

const allIconYCheck = "\n  // Collect every visible icon in nav-bar (any depth — including inside\n  // customization-target). Report each by id+ancestry+top-position so a\n  // failure can pinpoint the misaligned widget.\n  const navBar = document.getElementById(\"nav-bar\");\n  if (!navBar) return { error: \"no #nav-bar\" };\n  const icons = navBar.querySelectorAll(\"toolbarbutton .toolbarbutton-icon, toolbarbutton image\");\n  const hits = [];\n  for (const ic of icons) {\n    const r = ic.getBoundingClientRect();\n    if (r.width <= 0 || r.height <= 0) continue;\n    // Walk up to first parent with an id.\n    let p = ic.parentElement;\n    let id = \"\";\n    while (p && p !== navBar) {\n      if (p.id) { id = p.id; break; }\n      p = p.parentElement;\n    }\n    hits.push({ id, top: r.top, bottom: r.bottom, left: r.left });\n  }\n  return { hits };\n";

function assert_even_rhythm_bang(r, phase) {
  const rects = r.rects;
  const gap = (i) => { const left = rects[i].left;
const prev_right = rects[(i - 1)].right;
return (left - prev_right); };
  const max_tight = [gap(1), gap(2), gap(5), gap(6)].reduce((a, b) => Math.max(a, b), 0);
  const ceiling = (max_tight + 15);
  [3, 4].forEach((i) => {
  if ((!(gap(i) <= ceiling))) {
    (() => { throw new Error(("".concat("nav-bar (", phase, "): gap before ", rects[i].id, " is ", gap(i), "px vs a ", ceiling, "px ceiling (tightest-cluster max ", max_tight, "px + 15) — a toolbarspring around #urlbar-container is uncapped. ", JSON.stringify(r)))); })();
  }
});
}

const tests = [{name: "nav-bar — gjoa-sidebar-button (if present) lives in nav-bar, immediately right of extensions", run: async (mn) => { const r = await mn.executeScript("\n        const navBar = document.getElementById(\"nav-bar\");\n        const pui = document.getElementById(\"PanelUI-button\");\n        if (!pui) throw new Error(\"no PanelUI-button\");\n        const gj = document.getElementById(\"gjoa-sidebar-button\");\n        const ext = document.getElementById(\"unified-extensions-button\");\n        const puiR = pui.getBoundingClientRect();\n        const gjR = gj ? gj.getBoundingClientRect() : null;\n        const extR = ext ? ext.getBoundingClientRect() : null;\n        return {\n          gjoaBtn: gj ? {\n            parentId: gj.parentElement ? (gj.parentElement.id || gj.parentElement.tagName) : \"\",\n            inNavBar: navBar ? navBar.contains(gj) : false,\n            left: gjR.left, right: gjR.right, top: gjR.top,\n          } : null,\n          ext: extR ? { left: extR.left, right: extR.right } : null,\n          panelUI: { left: puiR.left, right: puiR.right, top: puiR.top },\n        };\n      ");
if (((_truthy) => _truthy !== false && _truthy != null)(r.gjoaBtn)) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(r.gjoaBtn.inNavBar))) {
    (() => { throw new Error(("".concat("#gjoa-sidebar-button must live inside the #nav-bar subtree, found under \"", r.gjoaBtn.parentId, "\". ", "(install! in src/gjoa/chrome/bjs/drawer/sidebar-button.bjs didn't run)"))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(r.gjoaBtn.parentId, "nav-bar-customization-target")) || ($$bc$equiv(r.gjoaBtn.parentId, "nav-bar")))))) {
    (() => { throw new Error(("".concat("#gjoa-sidebar-button parent must be #nav-bar-customization-target ", "(or #nav-bar in the no-refresh fallback), got \"", r.gjoaBtn.parentId, "\"."))); })();
  }
  const anchor = (((_truthy) => _truthy !== false && _truthy != null)(r.ext) ? r.ext : r.panelUI);
  const anchor_name = (((_truthy) => _truthy !== false && _truthy != null)(r.ext) ? "unified-extensions-button" : "PanelUI-button");
  const btn_left = r.gjoaBtn.left;
  const anchor_right = anchor.right;
  const gap = (btn_left - anchor_right);
  if ((!(!((_truthy) => _truthy !== false && _truthy != null)(((gap < -2) || (gap > 50)))))) {
    return (() => { throw new Error(("".concat("#gjoa-sidebar-button not adjacent to #", anchor_name, ": ", anchor_name, ".right=", anchor.right, " gjoaBtn.left=", r.gjoaBtn.left, " gap=", gap, "px ", "(expected -2 to 50px)."))); })();
  }
} }}, {name: "nav-bar — all visible top-row icons share the same vertical CENTER (±2px)", run: async (mn) => { const r = await mn.executeScript(allIconYCheck);
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(r.error)))) {
  (() => { throw new Error(r.error); })();
}
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (r.hits.length >= 2) : _logical))(r.hits))) {
  const center = (h) => { const top = h.top;
const bottom = h.bottom;
return ((top + bottom) / 2); };
  const ref = ((_logical) => (_logical !== false && _logical != null ? _logical : r.hits[0]))(r.hits.find((h) => (($$bc$equiv(h.id, "PanelUI-button")) || ($$bc$equiv(h.id, "PanelUI-menu-button")))));
  const refC = center(ref);
  const TOL = 2;
  r.hits.forEach((h) => {
  const c = center(h);
  if ((!(!(Math.abs((c - refC)) > TOL)))) {
    (() => { throw new Error(("".concat("Top-row icon center misaligned: id=\"", h.id, "\" center=", c.toFixed(1), " ", "vs ref=\"", ref.id, "\" center=", refC.toFixed(1), " ", "(diff=", (c - refC).toFixed(1), "px, tolerance ±", TOL, ").\n", "All hits: ", JSON.stringify(r.hits, null, 2)))); })();
  }
});
} }}, {name: "nav-bar — full owner-spec icon order, fresh vertical init: hamburger,ext,sidebar,gap,back,forward,refresh", run: async (mn) => { await mn.executeScript("Services.prefs.setBoolPref('gjoa.layout.dynamicOrientation', false); Services.prefs.setBoolPref('sidebar.verticalTabs', true); return true;");
await dsl.wait_for(mn, "return !document.documentElement.hasAttribute('gjoa-horizontal-tabs');", 4000);
const r = await mn.executeScript(verticalOrderIds);
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.ok))) {
  return (() => { throw new Error(r.msg); })();
} }}, {name: "nav-bar — full icon order, fresh horizontal init: back,forward,refresh,urlbar,sidebar,ext,hamburger", run: async (mn) => { await mn.executeScript("Services.prefs.setBoolPref('gjoa.layout.dynamicOrientation', false); Services.prefs.setBoolPref('sidebar.verticalTabs', false); return true;");
await dsl.wait_for(mn, "return document.documentElement.hasAttribute('gjoa-horizontal-tabs');", 4000);
const r = await mn.executeScript(horizontalOrderIds);
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.ok))) {
  (() => { throw new Error(r.msg); })();
}
assert_even_rhythm_bang(r, "default profile");
const sp = await mn.executeScript(springPressureCheck);
if ((!((_truthy) => _truthy !== false && _truthy != null)(sp.skip))) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(sp.ok))) {
    (() => { throw new Error(("".concat("with toolbarsprings injected: ", sp.msg))); })();
  }
  return assert_even_rhythm_bang(sp, "toolbarsprings injected");
} }}, {name: "nav-bar — full icon order survives live vertical<->horizontal flips", run: async (mn) => { await mn.executeScript("Services.prefs.setBoolPref('gjoa.layout.dynamicOrientation', false); Services.prefs.setBoolPref('sidebar.verticalTabs', true); return true;");
await dsl.wait_for(mn, "return !document.documentElement.hasAttribute('gjoa-horizontal-tabs');", 4000);
const r1 = await mn.executeScript(verticalOrderIds);
if ((!((_truthy) => _truthy !== false && _truthy != null)(r1.ok))) {
  (() => { throw new Error(("".concat("before flip: ", r1.msg))); })();
}
await mn.executeScript("Services.prefs.setBoolPref('sidebar.verticalTabs', false); return true;");
await dsl.wait_for(mn, "return document.documentElement.hasAttribute('gjoa-horizontal-tabs');", 4000);
const r2 = await mn.executeScript(horizontalOrderIds);
if ((!((_truthy) => _truthy !== false && _truthy != null)(r2.ok))) {
  (() => { throw new Error(("".concat("after vertical->horizontal flip: ", r2.msg))); })();
}
await mn.executeScript("Services.prefs.setBoolPref('sidebar.verticalTabs', true); return true;");
await dsl.wait_for(mn, "return !document.documentElement.hasAttribute('gjoa-horizontal-tabs');", 4000);
const r3 = await mn.executeScript(verticalOrderIds);
if ((!((_truthy) => _truthy !== false && _truthy != null)(r3.ok))) {
  (() => { throw new Error(("".concat("after horizontal->vertical flip: ", r3.msg))); })();
}
return await mn.executeScript("Services.prefs.clearUserPref('gjoa.layout.dynamicOrientation'); return true;"); }}];

export default tests;
