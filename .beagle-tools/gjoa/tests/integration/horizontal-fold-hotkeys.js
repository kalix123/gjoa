import { wait_for } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

async function reset_bang(mn) {
  await mn.executeScript(("".concat("    try { Services.prefs.setBoolPref(\"sidebar.verticalTabs\", true); } catch {}\n", "    const marked = [...gBrowser.tabs].filter(t => t.getAttribute && t.getAttribute(\"gjoa-test-marker\"));\n", "    if (marked.length < gBrowser.tabs.length) { for (const t of marked) { try { gBrowser.removeTab(t); } catch {} } }\n", "  ")));
  return await dsl.wait_for(mn, "return !document.getElementById('gjoa-tab-panel').hasAttribute('gjoa-horizontal');", 3000);
}

async function to_horizontal_bang(mn) {
  await mn.executeScript("Services.prefs.setBoolPref('sidebar.verticalTabs', false);");
  return await dsl.wait_for(mn, "return document.getElementById('gjoa-tab-panel').hasAttribute('gjoa-horizontal');", 3000);
}

function key_alt(ch) {
  return [{type: "key", id: "kbd", actions: [{type: "keyDown", value: ""}, {type: "keyDown", value: ch}, {type: "keyUp", value: ch}, {type: "keyUp", value: ""}]}];
}

function build_roots_js(stamp, n) {
  return ("".concat("\n    const p = Services.scriptSecurityManager.getSystemPrincipal();\n    const T = window.gjoaTest.treeOf;\n    for (let i = 0; i < ", n, "; i++) {\n      const t = gBrowser.addTab('about:blank', { triggeringPrincipal: p });\n      t.setAttribute('gjoa-test-marker', '", stamp, "-r' + i);\n      T.get(t).parentId = null;\n    }\n    window.gjoaTest.rows.scheduleTreeResync();\n    window.gjoaTest.rows.updateVisibility();\n    return true;"));
}

function place_cursor_js(stamp, key) {
  return ("".concat("\n    const t = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "-", key, "');\n    if (!t) throw new Error('no marker ", stamp, "-", key, "');\n    gBrowser.selectedTab = t;\n    const row = window.gjoaTest.rowOf.get(t);\n    window.gjoaTest.vim.activateVim(row);\n    return true;"));
}

function cursor_on_js(stamp, key) {
  return ("".concat("\n    const t = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "-", key, "');\n    if (!t) return false;\n    const row = window.gjoaTest.rowOf.get(t);\n    return !!row && row.getAttribute('gjoa-cursor') === 'true'\n      && gBrowser.selectedTab === t;"));
}

function row_ready_js(stamp, key) {
  return ("".concat("\n    const panel = document.getElementById('gjoa-tab-panel');\n    if (!panel || !panel.hasAttribute('gjoa-horizontal')) return false;\n    const rows = [...panel.querySelectorAll('.gjoa-tab-row')];\n    return rows.some(r => r._tab && r._tab.getAttribute('gjoa-test-marker') === '", stamp, "-", key, "');"));
}

function parent_of_js(stamp, key) {
  return ("".concat("\n    const t = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "-", key, "');\n    const pid = window.gjoaTest.treeOf.get(t).parentId;\n    return pid == null ? 'null' : String(pid);"));
}

function id_of_js(stamp, key) {
  return ("".concat("\n    const t = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "-", key, "');\n    return String(window.gjoaTest.treeOf.get(t).id);"));
}

function nest_js(stamp, child, parent) {
  return ("".concat("\n    const T = window.gjoaTest.treeOf;\n    const find = m => [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "-' + m);\n    const c = find('", child, "'), p = find('", parent, "');\n    T.get(c).parentId = T.get(p).id;\n    T.get(p).collapsed = false;\n    window.gjoaTest.rows.scheduleTreeResync();\n    window.gjoaTest.rows.updateVisibility();\n    return true;"));
}

function row_before_js(stamp, a, b) {
  return ("".concat("\n    const rows = [...document.querySelectorAll('#gjoa-tab-panel .gjoa-tab-row')];\n    const find = m => rows.findIndex(r => r._tab && r._tab.getAttribute('gjoa-test-marker') === '", stamp, "-' + m);\n    const ia = find('", a, "'), ib = find('", b, "');\n    return (ia >= 0 && ib >= 0 && ia < ib) ? 'true' : ('false ia=' + ia + ' ib=' + ib);"));
}

export const tests = [{name: "horizontal Alt+h folds the selected tab into its LEFT neighbour", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 5000);
await reset_bang(mn);
const stamp = ("".concat("hf-h-", Date.now()));
await mn.executeScript(build_roots_js(stamp, 2));
await dsl.wait_for(mn, ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute('gjoa-test-marker') === '", stamp, "-r1');")), 3000);
await to_horizontal_bang(mn);
await dsl.wait_for(mn, row_ready_js(stamp, "r1"), 3000);
await mn.executeScript(place_cursor_js(stamp, "r1"));
await dsl.wait_for(mn, cursor_on_js(stamp, "r1"));
await mn.performActions(key_alt("h"));
await dsl.wait_for(mn, ("".concat("const t = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "-r1');", " const a = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "-r0');", " return String(window.gjoaTest.treeOf.get(t).parentId) === String(window.gjoaTest.treeOf.get(a).id);")));
const parent_b = await mn.executeScript(parent_of_js(stamp, "r1"));
const id_a = await mn.executeScript(id_of_js(stamp, "r0"));
const __a____scope__13__1__3__0__4__5__10__2__1__0 = parent_b;
const __e____scope__13__1__3__0__4__5__10__2__1__3 = id_a;
if ((!($$bc$equiv(__a____scope__13__1__3__0__4__5__10__2__1__0, __e____scope__13__1__3__0__4__5__10__2__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("Alt+h must fold r1 into its left neighbour r0 (parentId ", parent_b, " should be r0 id ", id_a, ")")), " — expected ", __e____scope__13__1__3__0__4__5__10__2__1__3, ", got ", __a____scope__13__1__3__0__4__5__10__2__1__0))); })();
} }}, {name: "horizontal Alt+l folds the selected tab into its RIGHT neighbour", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 5000);
await reset_bang(mn);
const stamp = ("".concat("hf-l-", Date.now()));
await mn.executeScript(build_roots_js(stamp, 3));
await dsl.wait_for(mn, ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute('gjoa-test-marker') === '", stamp, "-r2');")), 3000);
await to_horizontal_bang(mn);
await dsl.wait_for(mn, row_ready_js(stamp, "r1"), 3000);
await mn.executeScript(place_cursor_js(stamp, "r1"));
await dsl.wait_for(mn, cursor_on_js(stamp, "r1"));
await mn.performActions(key_alt("l"));
await dsl.wait_for(mn, ("".concat("const t = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "-r1');", " const c = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "-r2');", " return String(window.gjoaTest.treeOf.get(t).parentId) === String(window.gjoaTest.treeOf.get(c).id);")));
const parent_b = await mn.executeScript(parent_of_js(stamp, "r1"));
const id_c = await mn.executeScript(id_of_js(stamp, "r2"));
const __a____scope__13__1__3__1__4__5__10__2__1__0 = parent_b;
const __e____scope__13__1__3__1__4__5__10__2__1__3 = id_c;
if ((!($$bc$equiv(__a____scope__13__1__3__1__4__5__10__2__1__0, __e____scope__13__1__3__1__4__5__10__2__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("Alt+l must fold r1 into its right neighbour r2 (parentId ", parent_b, " should be r2 id ", id_c, ")")), " — expected ", __e____scope__13__1__3__1__4__5__10__2__1__3, ", got ", __a____scope__13__1__3__1__4__5__10__2__1__0))); })();
} }}, {name: "horizontal Alt+l on a nested CHILD unfolds it out to a root", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 5000);
await reset_bang(mn);
const stamp = ("".concat("hf-u-", Date.now()));
await mn.executeScript(build_roots_js(stamp, 3));
await dsl.wait_for(mn, ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute('gjoa-test-marker') === '", stamp, "-r2');")), 3000);
await mn.executeScript(nest_js(stamp, "r1", "r0"));
await dsl.wait_for(mn, ("".concat("const c = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "-r1');", " const p = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "-r0');", " return String(window.gjoaTest.treeOf.get(c).parentId) === String(window.gjoaTest.treeOf.get(p).id);")));
await to_horizontal_bang(mn);
await dsl.wait_for(mn, row_ready_js(stamp, "r1"), 3000);
await mn.executeScript(place_cursor_js(stamp, "r1"));
await dsl.wait_for(mn, cursor_on_js(stamp, "r1"));
await mn.performActions(key_alt("l"));
await dsl.wait_for(mn, ("".concat("const t = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "-r1');", " return window.gjoaTest.treeOf.get(t).parentId == null;")));
const parent_r1 = await mn.executeScript(parent_of_js(stamp, "r1"));
const __a____scope__13__1__3__2__4__5__12__2__1__0 = parent_r1;
const __e____scope__13__1__3__2__4__5__12__2__1__3 = "null";
if ((!($$bc$equiv(__a____scope__13__1__3__2__4__5__12__2__1__0, __e____scope__13__1__3__2__4__5__12__2__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("Alt+l on nested child r1 must unfold it to a root (parentId ", parent_r1, " should be null)")), " — expected ", __e____scope__13__1__3__2__4__5__12__2__1__3, ", got ", __a____scope__13__1__3__2__4__5__12__2__1__0))); })();
} }}, {name: "horizontal Alt+h on a nested CHILD unfolds it out to a root BEFORE its parent", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 5000);
await reset_bang(mn);
const stamp = ("".concat("hf-uh-", Date.now()));
await mn.executeScript(build_roots_js(stamp, 3));
await dsl.wait_for(mn, ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute('gjoa-test-marker') === '", stamp, "-r2');")), 3000);
await mn.executeScript(nest_js(stamp, "r2", "r1"));
await dsl.wait_for(mn, ("".concat("const c = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "-r2');", " const p = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "-r1');", " return String(window.gjoaTest.treeOf.get(c).parentId) === String(window.gjoaTest.treeOf.get(p).id);")));
await to_horizontal_bang(mn);
await dsl.wait_for(mn, row_ready_js(stamp, "r2"), 3000);
await mn.executeScript(place_cursor_js(stamp, "r2"));
await dsl.wait_for(mn, cursor_on_js(stamp, "r2"));
await mn.performActions(key_alt("h"));
await dsl.wait_for(mn, ("".concat("const t = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "-r2');", " return window.gjoaTest.treeOf.get(t).parentId == null;")));
const parent_r2 = await mn.executeScript(parent_of_js(stamp, "r2"));
const before = await mn.executeScript(row_before_js(stamp, "r2", "r1"));
const __a____scope__13__1__3__3__4__5__12__2__1__0 = parent_r2;
const __e____scope__13__1__3__3__4__5__12__2__1__3 = "null";
if ((!($$bc$equiv(__a____scope__13__1__3__3__4__5__12__2__1__0, __e____scope__13__1__3__3__4__5__12__2__1__3)))) {
  (() => { throw new Error(("".concat(("".concat("Alt+h on nested child r2 must unfold it to a root (parentId ", parent_r2, ")")), " — expected ", __e____scope__13__1__3__3__4__5__12__2__1__3, ", got ", __a____scope__13__1__3__3__4__5__12__2__1__0))); })();
}
const __a____scope__13__1__3__3__4__5__12__3__1__0 = before;
const __e____scope__13__1__3__3__4__5__12__3__1__3 = "true";
if ((!($$bc$equiv(__a____scope__13__1__3__3__4__5__12__3__1__0, __e____scope__13__1__3__3__4__5__12__3__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("unfolded r2 must land BEFORE its former parent r1 (", before, ")")), " — expected ", __e____scope__13__1__3__3__4__5__12__3__1__3, ", got ", __a____scope__13__1__3__3__4__5__12__3__1__0))); })();
} }}];

export default tests;
