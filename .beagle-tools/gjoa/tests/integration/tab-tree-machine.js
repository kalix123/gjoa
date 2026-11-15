import { wait_for, sleep } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

async function reset_bang(mn) {
  await mn.executeScript(("".concat("    try { Services.prefs.setBoolPref(\"sidebar.verticalTabs\", true); } catch {}\n", "    if (window.Spaces) {\n", "      const main = window.Spaces.list().find(s => s.name === \"Main\") || window.Spaces.list()[0];\n", "      window.Spaces.setActive(main.id);\n", "      for (const s of [...window.Spaces.list()]) {\n", "        if (s.id !== main.id) window.Spaces.delete(s.id);\n", "      }\n", "    }\n", "    const marked = [...gBrowser.tabs].filter(t => t.getAttribute && t.getAttribute(\"gjoa-test-marker\"));\n", "    if (marked.length < gBrowser.tabs.length) {\n", "      for (const t of marked) { try { gBrowser.removeTab(t); } catch {} }\n", "    }\n", "  ")));
  return await dsl.wait_for(mn, "return !document.getElementById(\"gjoa-tab-panel\").hasAttribute(\"gjoa-horizontal\");", 3000);
}

async function to_horizontal_bang(mn) {
  await mn.executeScript("Services.prefs.setBoolPref(\"sidebar.verticalTabs\", false);");
  return await dsl.wait_for(mn, "return document.getElementById(\"gjoa-tab-panel\").hasAttribute(\"gjoa-horizontal\");", 3000);
}

async function to_vertical_bang(mn) {
  await mn.executeScript("Services.prefs.setBoolPref(\"sidebar.verticalTabs\", true);");
  return await dsl.wait_for(mn, "return !document.getElementById(\"gjoa-tab-panel\").hasAttribute(\"gjoa-horizontal\");", 3000);
}

function build_roots_js(stamp, n) {
  return ("".concat("\n    const principal = Services.scriptSecurityManager.getSystemPrincipal();\n    const T = window.gjoaTest.treeOf;\n    const out = [];\n    for (let i = 0; i < ", n, "; i++) {\n      const t = gBrowser.addTab(\"about:blank\", { triggeringPrincipal: principal });\n      t.setAttribute(\"gjoa-test-marker\", \"", stamp, "-r\" + i);\n      T.get(t).parentId = null;\n      out.push(\"", stamp, "-r\" + i);\n    }\n    window.gjoaTest.rows.scheduleTreeResync();\n    window.gjoaTest.rows.updateVisibility();\n    return out;"));
}

function nest_js(child, parent) {
  return ("".concat("\n    const T = window.gjoaTest.treeOf;\n    const find = m => [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === m);\n    const c = find(\"", child, "\"), p = find(\"", parent, "\");\n    if (!c || !p) throw new Error(\"nest: missing child/parent\");\n    T.get(c).parentId = T.get(p).id;\n    T.get(p).collapsed = false;\n    window.gjoaTest.rows.scheduleTreeResync();\n    window.gjoaTest.rows.updateVisibility();\n    return true;"));
}

function await_marker_js(marker) {
  return ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute(\"gjoa-test-marker\") === \"", marker, "\");"));
}

const INVARIANTS_JS = "\n  const T = window.gjoaTest.treeOf;\n  const rows = [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row, #gjoa-tab-panel .gjoa-group-row\")];\n  const lvl = r => Math.max(0, Math.round(((parseFloat(r.style.paddingInlineStart || \"0\") || 0) - 8) / 14));\n  const nodes = rows.map((r, i) => {\n    const tab = r._tab || null;\n    const grp = r._group || null;\n    const isGroup = r.classList.contains(\"gjoa-group-row\");\n    const td = isGroup ? grp : (tab ? T.get(tab) : null);\n    return {\n      i, isGroup,\n      rawId: td ? td.id : null,\n      parentId: td ? (td.parentId == null ? null : td.parentId) : null,\n      level: lvl(r),\n      label: r.querySelector(\".gjoa-tab-label, .gjoa-group-name\")?.textContent ?? \"\",\n    };\n  });\n  const byId = new Map();\n  for (const n of nodes) if (n.rawId != null) byId.set(String(n.rawId), n);\n  const viol = [];\n  const nameOf = n => n.label || String(n.rawId);\n  // I2 parentId integrity\n  for (const n of nodes) {\n    if (n.parentId == null) continue;\n    if (!byId.has(String(n.parentId))) viol.push(\"I2:dangling parentId \" + n.parentId + \" on \" + nameOf(n));\n  }\n  // I3 acyclic + I5 level==depth (one walk, bounded)\n  for (const n of nodes) {\n    let cur = n, depth = 0, steps = 0; const seen = new Set();\n    while (cur && cur.parentId != null) {\n      if (seen.has(String(cur.rawId))) { viol.push(\"I3:cycle at \" + nameOf(n)); break; }\n      seen.add(String(cur.rawId));\n      const p = byId.get(String(cur.parentId));\n      if (!p) break;\n      depth++; cur = p;\n      if (++steps > 64) { viol.push(\"I3:depth>64 at \" + nameOf(n)); break; }\n    }\n    if (n.level !== depth) viol.push(\"I5:level \" + n.level + \" != depth \" + depth + \" on \" + nameOf(n));\n  }\n  // I4 DOM pre-order: parent row precedes child row\n  for (const n of nodes) {\n    if (n.parentId == null) continue;\n    const p = byId.get(String(n.parentId));\n    if (p && p.i > n.i) viol.push(\"I4:child \" + nameOf(n) + \" before parent \" + nameOf(p));\n  }\n  return { ok: viol.length === 0, viol, count: nodes.length };";

async function assert_sound(mn, where) {
  const r = await mn.executeScript(INVARIANTS_JS);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(r.ok))) {
    (() => { throw new Error(("".concat("tree invariants violated (", where, "): ", JSON.stringify(r.viol)))); })();
  }
  return null;
}

const ROWS_JS = "\n  const T = window.gjoaTest.treeOf;\n  return [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row, #gjoa-tab-panel .gjoa-group-row\")]\n    .map(r => {\n      const tab = r._tab || null;\n      const td = r.classList.contains(\"gjoa-group-row\") ? r._group : (tab ? T.get(tab) : null);\n      return {\n        kind: r.classList.contains(\"gjoa-group-row\") ? \"group\" : \"tab\",\n        marker: (tab && tab.getAttribute) ? (tab.getAttribute(\"gjoa-test-marker\") || \"\") : \"\",\n        parentId: td ? (td.parentId == null ? null : td.parentId) : null,\n        level: Math.max(0, Math.round(((parseFloat(r.style.paddingInlineStart || \"0\") || 0) - 8) / 14)),\n        label: r.querySelector(\".gjoa-tab-label, .gjoa-group-name\")?.textContent ?? \"\",\n      };\n    });";

function drag_script(src, tgt, fx, fy) {
  return ("".concat("\n    const rows = [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row, #gjoa-tab-panel .gjoa-group-row\")];\n    const source = rows[", src, "]; const target = rows[", tgt, "];\n    if (!source || !target) throw new Error(\"row missing src=", src, " tgt=", tgt, " len=\" + rows.length);\n    const tR = target.getBoundingClientRect();\n    const dx = tR.left + tR.width * ", fx, "; const dy = tR.top + tR.height * ", fy, ";\n    const dt = new DataTransfer();\n    const fire = (el, type, x, y) => el.dispatchEvent(new DragEvent(type, { bubbles:true, cancelable:true, view:window, clientX:x, clientY:y, dataTransfer:dt }));\n    const sR = source.getBoundingClientRect();\n    fire(source, \"dragstart\", sR.left + 5, sR.top + 5);\n    fire(target, \"dragenter\", dx, dy); fire(target, \"dragover\", dx, dy);\n    fire(target, \"drop\", dx, dy); fire(source, \"dragend\", dx, dy);\n    return true;"));
}

async function settle() {
  await new Promise((r) => setTimeout(() => r(), 250));
  return null;
}

export const tests = [{name: "tree machine — invariants hold for flat roots, both modes", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest && !!document.getElementById(\"gjoa-tab-panel\");", 5000);
await reset_bang(mn);
const stamp = ("".concat("ttm-flat-", Date.now()));
await mn.executeScript(build_roots_js(stamp, 3));
await dsl.wait_for(mn, await_marker_js(("".concat(stamp, "-r2"))), 3000);
assert_sound(mn, "vertical/flat");
const rows = await mn.executeScript(ROWS_JS);
const roots = rows.filter((r) => r.marker);
if ((!(roots.length >= 3))) {
  (() => { throw new Error("expected >= 3 marker roots"); })();
}
roots.forEach((r) => { const __a____scope__13__1__3__0__4__5__5__3__3__3__1__0 = r.level;
const __e____scope__13__1__3__0__4__5__5__3__3__3__1__3 = 0;
if ((!($$bc$equiv(__a____scope__13__1__3__0__4__5__5__3__3__3__1__0, __e____scope__13__1__3__0__4__5__5__3__3__3__1__3)))) {
  return (() => { throw new Error(("".concat("flat roots must be level 0", " — expected ", __e____scope__13__1__3__0__4__5__5__3__3__3__1__3, ", got ", __a____scope__13__1__3__0__4__5__5__3__3__3__1__0))); })();
} });
await to_horizontal_bang(mn);
assert_sound(mn, "horizontal/flat");
return await to_vertical_bang(mn); }}, {name: "tree machine — compose/fold stays sound, both modes", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 5000);
await reset_bang(mn);
const stamp = ("".concat("ttm-fold-", Date.now()));
await mn.executeScript(build_roots_js(stamp, 3));
await dsl.wait_for(mn, await_marker_js(("".concat(stamp, "-r2"))), 3000);
await mn.executeScript(nest_js(("".concat(stamp, "-r1")), ("".concat(stamp, "-r0"))));
await mn.executeScript(nest_js(("".concat(stamp, "-r2")), ("".concat(stamp, "-r1"))));
await settle();
assert_sound(mn, "vertical/nested");
const rows = await mn.executeScript(ROWS_JS);
const r0 = rows.find((r) => ($$bc$equiv(r.marker, ("".concat(stamp, "-r0")))));
const r1 = rows.find((r) => ($$bc$equiv(r.marker, ("".concat(stamp, "-r1")))));
const r2 = rows.find((r) => ($$bc$equiv(r.marker, ("".concat(stamp, "-r2")))));
if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? r2 : _logical))(r1) : _logical))(r0)))) {
  (() => { throw new Error("nested markers must all be present"); })();
}
const __a____scope__13__1__3__1__4__5__8__3__1__0 = r0.level;
const __e____scope__13__1__3__1__4__5__8__3__1__3 = 0;
if ((!($$bc$equiv(__a____scope__13__1__3__1__4__5__8__3__1__0, __e____scope__13__1__3__1__4__5__8__3__1__3)))) {
  (() => { throw new Error(("".concat("r0 root level 0", " — expected ", __e____scope__13__1__3__1__4__5__8__3__1__3, ", got ", __a____scope__13__1__3__1__4__5__8__3__1__0))); })();
}
const __a____scope__13__1__3__1__4__5__8__4__1__0 = r1.level;
const __e____scope__13__1__3__1__4__5__8__4__1__3 = 1;
if ((!($$bc$equiv(__a____scope__13__1__3__1__4__5__8__4__1__0, __e____scope__13__1__3__1__4__5__8__4__1__3)))) {
  (() => { throw new Error(("".concat("r1 child level 1", " — expected ", __e____scope__13__1__3__1__4__5__8__4__1__3, ", got ", __a____scope__13__1__3__1__4__5__8__4__1__0))); })();
}
const __a____scope__13__1__3__1__4__5__8__5__1__0 = r2.level;
const __e____scope__13__1__3__1__4__5__8__5__1__3 = 2;
if ((!($$bc$equiv(__a____scope__13__1__3__1__4__5__8__5__1__0, __e____scope__13__1__3__1__4__5__8__5__1__3)))) {
  (() => { throw new Error(("".concat("r2 grandchild level 2", " — expected ", __e____scope__13__1__3__1__4__5__8__5__1__3, ", got ", __a____scope__13__1__3__1__4__5__8__5__1__0))); })();
}
await to_horizontal_bang(mn);
assert_sound(mn, "horizontal/nested");
await to_vertical_bang(mn);
return assert_sound(mn, "vertical/nested-after-roundtrip"); }}, {name: "tree machine — selecting a tab keeps the tree sound, both modes", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 5000);
await reset_bang(mn);
const stamp = ("".concat("ttm-sel-", Date.now()));
await mn.executeScript(build_roots_js(stamp, 3));
await dsl.wait_for(mn, await_marker_js(("".concat(stamp, "-r2"))), 3000);
await mn.executeScript(nest_js(("".concat(stamp, "-r1")), ("".concat(stamp, "-r0"))));
await settle();
await to_horizontal_bang(mn);
await mn.executeScript(("".concat("gBrowser.selectedTab = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-r1\"); return true;")));
await settle();
assert_sound(mn, "horizontal/after-select");
const sel = await mn.executeScript(("".concat("return gBrowser.selectedTab.getAttribute(\"gjoa-test-marker\");")));
const __a____scope__13__1__3__2__4__5__10__2__1__0 = sel;
const __e____scope__13__1__3__2__4__5__10__2__1__3 = ("".concat(stamp, "-r1"));
if ((!($$bc$equiv(__a____scope__13__1__3__2__4__5__10__2__1__0, __e____scope__13__1__3__2__4__5__10__2__1__3)))) {
  (() => { throw new Error(("".concat("selection must land on the chosen child", " — expected ", __e____scope__13__1__3__2__4__5__10__2__1__3, ", got ", __a____scope__13__1__3__2__4__5__10__2__1__0))); })();
}
return await to_vertical_bang(mn); }}, {name: "tree machine — horizontal move does NOT skip a tab to the leftmost column", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 5000);
await reset_bang(mn);
const stamp = ("".concat("ttm-skip-", Date.now()));
await mn.executeScript(build_roots_js(stamp, 4));
await dsl.wait_for(mn, await_marker_js(("".concat(stamp, "-r3"))), 3000);
await mn.executeScript(nest_js(("".concat(stamp, "-r3")), ("".concat(stamp, "-r1"))));
await settle();
await to_horizontal_bang(mn);
await settle();
const before = await mn.executeScript(ROWS_JS);
const first_root_before = before.find((r) => (($$bc$equiv(r.kind, "tab")) && ($$bc$equiv(r.level, 0)))).marker;
const idx_c = before.findIndex((r) => ($$bc$equiv(r.marker, ("".concat(stamp, "-r2")))));
const idx_b = before.findIndex((r) => ($$bc$equiv(r.marker, ("".concat(stamp, "-r1")))));
if ((!((_truthy) => _truthy !== false && _truthy != null)(((idx_c >= 0) && (idx_b >= 0))))) {
  (() => { throw new Error(("".concat("setup rows: idxC=", idx_c, " idxB=", idx_b))); })();
}
await mn.executeScript(drag_script(idx_c, idx_b, 0.8, 0.2));
await settle();
assert_sound(mn, "horizontal/after-move");
const after = await mn.executeScript(ROWS_JS);
const first_root_after = after.find((r) => (($$bc$equiv(r.kind, "tab")) && ($$bc$equiv(r.level, 0)))).marker;
const __a____scope__13__1__3__3__4__5__8__6__2__1__0 = first_root_after;
const __e____scope__13__1__3__3__4__5__8__6__2__1__3 = first_root_before;
if ((!($$bc$equiv(__a____scope__13__1__3__3__4__5__8__6__2__1__0, __e____scope__13__1__3__3__4__5__8__6__2__1__3)))) {
  (() => { throw new Error(("".concat(("".concat("moved tab skipped to leftmost: firstRoot ", first_root_before, " -> ", first_root_after)), " — expected ", __e____scope__13__1__3__3__4__5__8__6__2__1__3, ", got ", __a____scope__13__1__3__3__4__5__8__6__2__1__0))); })();
}
if ((!(!($$bc$equiv(first_root_after, ("".concat(stamp, "-r2"))))))) {
  (() => { throw new Error("the moved tab (C) must not become the leftmost root"); })();
}
return await to_vertical_bang(mn); }}, {name: "tree machine — create-group adopts the whole multiselection (#95)", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 5000);
await reset_bang(mn);
const stamp = ("".concat("ttm-grp-", Date.now()));
await mn.executeScript(build_roots_js(stamp, 3));
await dsl.wait_for(mn, await_marker_js(("".concat(stamp, "-r2"))), 3000);
await mn.executeScript(("".concat("\n         const find = m => [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === m);\n         const a = find(\"", stamp, "-r0\"), b = find(\"", stamp, "-r1\");\n         gBrowser.selectedTab = a;\n         gBrowser.addToMultiSelectedTabs(b);\n         window.gjoaTest.state.contextTab = a;\n         const row = [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row\")].find(r => r._tab === a);\n         const rect = row.getBoundingClientRect();\n         row.dispatchEvent(new MouseEvent(\"contextmenu\", { bubbles:true, cancelable:true, button:2, clientX:rect.left+4, clientY:rect.top+4 }));\n         const menu = document.getElementById(\"gjoa-tab-menu\");\n         const item = [...menu.querySelectorAll(\"menuitem\")].find(mi => mi.getAttribute(\"label\") === \"Create Group\");\n         if (!item) throw new Error(\"no Create Group menuitem\");\n         item.dispatchEvent(new Event(\"command\", { bubbles:true }));\n         return true;")));
await settle();
assert_sound(mn, "vertical/after-create-group");
const r = await mn.executeScript(("".concat("\n               const T = window.gjoaTest.treeOf;\n               const find = m => [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === m);\n               const a = find(\"", stamp, "-r0\"), b = find(\"", stamp, "-r1\");\n               const ap = T.get(a).parentId, bp = T.get(b).parentId;\n               return { ap: ap == null ? null : String(ap), bp: bp == null ? null : String(bp) };")));
if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? r.bp : _logical))(r.ap)))) {
  (() => { throw new Error(("".concat("both selected tabs must be adopted into a group (ap=", r.ap, " bp=", r.bp, ")"))); })();
}
const __a____scope__13__1__3__4__4__5__7__3__1__0 = r.ap;
const __e____scope__13__1__3__4__4__5__7__3__1__3 = r.bp;
if ((!($$bc$equiv(__a____scope__13__1__3__4__4__5__7__3__1__0, __e____scope__13__1__3__4__4__5__7__3__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("the whole multiselection must join the SAME group (ap=", r.ap, " bp=", r.bp, ")")), " — expected ", __e____scope__13__1__3__4__4__5__7__3__1__3, ", got ", __a____scope__13__1__3__4__4__5__7__3__1__0))); })();
} }}];

export default tests;
