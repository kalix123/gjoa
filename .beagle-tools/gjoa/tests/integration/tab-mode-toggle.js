import { wait_for } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

async function reset_bang(mn) {
  await mn.executeScript(("".concat("    try { Services.prefs.setBoolPref(\"sidebar.verticalTabs\", true); } catch {}\n", "    if (window.Spaces) {\n", "      const main = window.Spaces.list().find(s => s.name === \"Main\") || window.Spaces.list()[0];\n", "      window.Spaces.setActive(main.id);\n", "      for (const s of [...window.Spaces.list()]) {\n", "        if (s.id !== main.id) window.Spaces.delete(s.id);\n", "      }\n", "    }\n", "    const marked = [...gBrowser.tabs].filter(t => t.getAttribute && t.getAttribute(\"gjoa-test-marker\"));\n", "    if (marked.length < gBrowser.tabs.length) {\n", "      for (const t of marked) { try { gBrowser.removeTab(t); } catch {} }\n", "    }\n", "  ")));
  return await dsl.wait_for(mn, "return !document.getElementById(\"gjoa-tab-panel\").hasAttribute(\"gjoa-horizontal\");", 3000);
}

function build_tree_js(stamp, key) {
  return ("".concat("    const principal = Services.scriptSecurityManager.getSystemPrincipal();\n", "    const T = window.gjoaTest.treeOf;\n", "    const root = gBrowser.addTab(\"about:blank\", { triggeringPrincipal: principal });\n", "    root.setAttribute(\"gjoa-test-marker\", \"", stamp, "-", key, "\");\n", "    const c1 = gBrowser.addTab(\"about:blank\", { triggeringPrincipal: principal, ownerTab: root });\n", "    c1.setAttribute(\"gjoa-test-marker\", \"", stamp, "-", key, "-c1\");\n", "    const c2 = gBrowser.addTab(\"about:blank\", { triggeringPrincipal: principal, ownerTab: root });\n", "    c2.setAttribute(\"gjoa-test-marker\", \"", stamp, "-", key, "-c2\");\n", "    T.get(c1).parentId = T.get(root).id;\n", "    T.get(c2).parentId = T.get(root).id;\n", "    T.get(root).collapsed = false;\n", "    window.gjoaTest.rows.scheduleTreeResync();\n"));
}

function read_root_js(stamp, key) {
  return ("".concat("    const t = [...gBrowser.tabs].find(x => x.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-", key, "\");\n", "    if (!t) return null;\n", "    const td = window.gjoaTest.treeOf.get(t);\n", "    const row = [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row\")].find(r => r._tab === t);\n", "    return { collapsed: !!td.collapsed, layoutCollapsed: !!td.layoutCollapsed,\n", "             caret: row ? row.hasAttribute(\"gjoa-collapsed\") : null };\n"));
}

async function to_horizontal_bang(mn) {
  await mn.executeScript("Services.prefs.setBoolPref(\"sidebar.verticalTabs\", false);");
  return await dsl.wait_for(mn, "return document.getElementById(\"gjoa-tab-panel\").hasAttribute(\"gjoa-horizontal\");", 3000);
}

async function to_vertical_bang(mn) {
  await mn.executeScript("Services.prefs.setBoolPref(\"sidebar.verticalTabs\", true);");
  return await dsl.wait_for(mn, "return !document.getElementById(\"gjoa-tab-panel\").hasAttribute(\"gjoa-horizontal\");", 3000);
}

export const tests = [{name: "mode toggle — an expanded tree is still expanded after horizontal<->vertical", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest && !!document.getElementById(\"gjoa-tab-panel\");", 3000);
await reset_bang(mn);
const stamp = ("".concat("mt-expand-", Date.now()));
await mn.executeScript(build_tree_js(stamp, "A"));
await dsl.wait_for(mn, ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-A-c2\");")), 3000);
await mn.executeScript(("".concat("gBrowser.selectedTab = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-A-c1\");")));
await to_horizontal_bang(mn);
await to_vertical_bang(mn);
const r = await mn.executeScript(read_root_js(stamp, "A"));
const __a____scope__7__1__3__0__4__5__7__2__1__0 = r.collapsed;
const __e____scope__7__1__3__0__4__5__7__2__1__3 = false;
if ((!($$bc$equiv(__a____scope__7__1__3__0__4__5__7__2__1__0, __e____scope__7__1__3__0__4__5__7__2__1__3)))) {
  (() => { throw new Error(("".concat("persisted collapsed must stay false after a round-trip", " — expected ", __e____scope__7__1__3__0__4__5__7__2__1__3, ", got ", __a____scope__7__1__3__0__4__5__7__2__1__0))); })();
}
const __a____scope__7__1__3__0__4__5__7__3__1__0 = r.layoutCollapsed;
const __e____scope__7__1__3__0__4__5__7__3__1__3 = false;
if ((!($$bc$equiv(__a____scope__7__1__3__0__4__5__7__3__1__0, __e____scope__7__1__3__0__4__5__7__3__1__3)))) {
  (() => { throw new Error(("".concat("layoutCollapsed must be cleared in vertical", " — expected ", __e____scope__7__1__3__0__4__5__7__3__1__3, ", got ", __a____scope__7__1__3__0__4__5__7__3__1__0))); })();
}
const __a____scope__7__1__3__0__4__5__7__4__1__0 = r.caret;
const __e____scope__7__1__3__0__4__5__7__4__1__3 = false;
if ((!($$bc$equiv(__a____scope__7__1__3__0__4__5__7__4__1__0, __e____scope__7__1__3__0__4__5__7__4__1__3)))) {
  return (() => { throw new Error(("".concat("caret must show expanded", " — expected ", __e____scope__7__1__3__0__4__5__7__4__1__3, ", got ", __a____scope__7__1__3__0__4__5__7__4__1__0))); })();
} }}, {name: "mode toggle — a user-collapsed tree stays collapsed (persisted state preserved)", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 3000);
await reset_bang(mn);
const stamp = ("".concat("mt-collapsed-", Date.now()));
await mn.executeScript(build_tree_js(stamp, "A"));
await dsl.wait_for(mn, ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-A-c2\");")), 3000);
await mn.executeScript(("".concat("    const root = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-A\");\n", "    window.gjoaTest.treeOf.get(root).collapsed = true;\n", "    window.gjoaTest.rows.scheduleTreeResync();\n", "    window.gjoaTest.rows.updateVisibility();\n")));
await to_horizontal_bang(mn);
await to_vertical_bang(mn);
const r = await mn.executeScript(read_root_js(stamp, "A"));
const __a____scope__7__1__3__1__4__5__7__2__1__0 = r.collapsed;
const __e____scope__7__1__3__1__4__5__7__2__1__3 = true;
if ((!($$bc$equiv(__a____scope__7__1__3__1__4__5__7__2__1__0, __e____scope__7__1__3__1__4__5__7__2__1__3)))) {
  return (() => { throw new Error(("".concat("user collapse must survive a mode round-trip", " — expected ", __e____scope__7__1__3__1__4__5__7__2__1__3, ", got ", __a____scope__7__1__3__1__4__5__7__2__1__0))); })();
} }}, {name: "mode toggle — does not collapse trees in other spaces", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest && !!window.Spaces;", 3000);
await reset_bang(mn);
const stamp = ("".concat("mt-spaces-", Date.now()));
await mn.executeScript(build_tree_js(stamp, "main"));
await mn.executeScript(("".concat("    const w = window.Spaces.create(\"Work\");\n", "    window.__mtWork = w.id;\n", "    window.Spaces.setActive(w.id);\n")));
await dsl.wait_for(mn, "return window.Spaces.active().name === \"Work\";", 3000);
await mn.executeScript(build_tree_js(stamp, "work"));
await dsl.wait_for(mn, ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-work-c2\");")), 3000);
await mn.executeScript(("".concat("    const main = window.Spaces.list().find(s => s.name === \"Main\");\n", "    window.Spaces.setActive(main.id);\n", "    gBrowser.selectedTab = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-main-c1\");\n")));
await dsl.wait_for(mn, "return window.Spaces.active().name === \"Main\";", 3000);
await to_horizontal_bang(mn);
await to_vertical_bang(mn);
const w = await mn.executeScript(read_root_js(stamp, "work"));
const __a____scope__7__1__3__2__4__5__11__2__1__0 = w.collapsed;
const __e____scope__7__1__3__2__4__5__11__2__1__3 = false;
if ((!($$bc$equiv(__a____scope__7__1__3__2__4__5__11__2__1__0, __e____scope__7__1__3__2__4__5__11__2__1__3)))) {
  return (() => { throw new Error(("".concat("a tree in a non-active space must never be collapsed by a toggle", " — expected ", __e____scope__7__1__3__2__4__5__11__2__1__3, ", got ", __a____scope__7__1__3__2__4__5__11__2__1__0))); })();
} }}, {name: "mode toggle — horizontal layout-collapse is transient, never written to the saved tree", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 3000);
await reset_bang(mn);
const stamp = ("".concat("mt-transient-", Date.now()));
await mn.executeScript(build_tree_js(stamp, "A"));
await mn.executeScript(build_tree_js(stamp, "B"));
await dsl.wait_for(mn, ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-B-c2\");")), 3000);
await mn.executeScript(("".concat("gBrowser.selectedTab = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-A-c1\");")));
await to_horizontal_bang(mn);
const b = await mn.executeScript(read_root_js(stamp, "B"));
const __a____scope__7__1__3__3__4__5__7__2__1__0 = b.layoutCollapsed;
const __e____scope__7__1__3__3__4__5__7__2__1__3 = true;
if ((!($$bc$equiv(__a____scope__7__1__3__3__4__5__7__2__1__0, __e____scope__7__1__3__3__4__5__7__2__1__3)))) {
  (() => { throw new Error(("".concat("inactive tree should be layout-collapsed in horizontal", " — expected ", __e____scope__7__1__3__3__4__5__7__2__1__3, ", got ", __a____scope__7__1__3__3__4__5__7__2__1__0))); })();
}
const __a____scope__7__1__3__3__4__5__7__3__1__0 = b.collapsed;
const __e____scope__7__1__3__3__4__5__7__3__1__3 = false;
if ((!($$bc$equiv(__a____scope__7__1__3__3__4__5__7__3__1__0, __e____scope__7__1__3__3__4__5__7__3__1__3)))) {
  (() => { throw new Error(("".concat("but the saved/persisted collapsed must stay false", " — expected ", __e____scope__7__1__3__3__4__5__7__3__1__3, ", got ", __a____scope__7__1__3__3__4__5__7__3__1__0))); })();
}
const saved = await mn.executeScript(("".concat("    const t = [...gBrowser.tabs].find(x => x.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-B\");\n", "    const id = window.gjoaTest.treeOf.get(t).id;\n", "    const snap = window.gjoaTest.snapshotTree().find(e => e.id === id);\n", "    return snap ? !!snap.collapsed : null;\n")));
const __a____scope__7__1__3__3__4__5__8__2__1__0 = saved;
const __e____scope__7__1__3__3__4__5__8__2__1__3 = false;
if ((!($$bc$equiv(__a____scope__7__1__3__3__4__5__8__2__1__0, __e____scope__7__1__3__3__4__5__8__2__1__3)))) {
  (() => { throw new Error(("".concat("the persisted snapshot must record collapsed=false for a layout-collapsed tree", " — expected ", __e____scope__7__1__3__3__4__5__8__2__1__3, ", got ", __a____scope__7__1__3__3__4__5__8__2__1__0))); })();
}
return await to_vertical_bang(mn); }}, {name: "mode toggle — selected tab stays selected and visible", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 3000);
await reset_bang(mn);
const stamp = ("".concat("mt-select-", Date.now()));
await mn.executeScript(build_tree_js(stamp, "A"));
await dsl.wait_for(mn, ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-A-c2\");")), 3000);
await mn.executeScript(("".concat("    const sel = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-A-c1\");\n", "    gBrowser.selectedTab = sel;\n", "    window.__mtSelId = window.gjoaTest.treeOf.get(sel).id;\n")));
await to_horizontal_bang(mn);
await to_vertical_bang(mn);
const r = await mn.executeScript(("".concat("    const sel = gBrowser.selectedTab;\n", "    const id = window.gjoaTest.treeOf.get(sel) ? window.gjoaTest.treeOf.get(sel).id : null;\n", "    const row = [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row\")].find(x => x._tab === sel);\n", "    return { sameId: id === window.__mtSelId, hidden: row ? row.hidden : true };\n")));
const __a____scope__7__1__3__4__4__5__7__2__1__0 = r.sameId;
const __e____scope__7__1__3__4__4__5__7__2__1__3 = true;
if ((!($$bc$equiv(__a____scope__7__1__3__4__4__5__7__2__1__0, __e____scope__7__1__3__4__4__5__7__2__1__3)))) {
  (() => { throw new Error(("".concat("the same tab must remain selected after a round-trip", " — expected ", __e____scope__7__1__3__4__4__5__7__2__1__3, ", got ", __a____scope__7__1__3__4__4__5__7__2__1__0))); })();
}
const __a____scope__7__1__3__4__4__5__7__3__1__0 = r.hidden;
const __e____scope__7__1__3__4__4__5__7__3__1__3 = false;
if ((!($$bc$equiv(__a____scope__7__1__3__4__4__5__7__3__1__0, __e____scope__7__1__3__4__4__5__7__3__1__3)))) {
  return (() => { throw new Error(("".concat("the selected tab's row must be visible", " — expected ", __e____scope__7__1__3__4__4__5__7__3__1__3, ", got ", __a____scope__7__1__3__4__4__5__7__3__1__0))); })();
} }}, {name: "mode toggle — repeated toggling is idempotent (collapsed map unchanged)", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 3000);
await reset_bang(mn);
const stamp = ("".concat("mt-idem-", Date.now()));
await mn.executeScript(build_tree_js(stamp, "A"));
await mn.executeScript(build_tree_js(stamp, "B"));
await mn.executeScript(build_tree_js(stamp, "C"));
await dsl.wait_for(mn, ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-C-c2\");")), 3000);
await mn.executeScript(("".concat("gBrowser.selectedTab = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-A-c1\");")));
const snap_js = ("".concat("    return [...gBrowser.tabs]\n", "      .filter(t => t.getAttribute && (t.getAttribute(\"gjoa-test-marker\")||\"\").startsWith(\"", stamp, "\"))\n", "      .map(t => [window.gjoaTest.treeOf.get(t).id, !!window.gjoaTest.treeOf.get(t).collapsed])\n", "      .sort((a,b) => a[0]-b[0]);\n"));
const before = await mn.executeScript(snap_js);
await to_horizontal_bang(mn);
await to_vertical_bang(mn);
await to_horizontal_bang(mn);
await to_vertical_bang(mn);
await to_horizontal_bang(mn);
await to_vertical_bang(mn);
const after = await mn.executeScript(snap_js);
const __a____scope__7__1__3__5__4__5__7__8__2__1__0 = JSON.stringify(after);
const __e____scope__7__1__3__5__4__5__7__8__2__1__3 = JSON.stringify(before);
if ((!($$bc$equiv(__a____scope__7__1__3__5__4__5__7__8__2__1__0, __e____scope__7__1__3__5__4__5__7__8__2__1__3)))) {
  return (() => { throw new Error(("".concat("persisted collapsed map must be identical after repeated toggles", " — expected ", __e____scope__7__1__3__5__4__5__7__8__2__1__3, ", got ", __a____scope__7__1__3__5__4__5__7__8__2__1__0))); })();
} }}];

export default tests;
