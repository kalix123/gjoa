import { wait_for, sleep } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

async function reset_bang(mn) {
  await mn.executeScript(("".concat("    try { Services.prefs.setBoolPref(\"sidebar.verticalTabs\", true); } catch {}\n", "    try { Services.prefs.setBoolPref(\"gjoa.keys.useLeader\", false); } catch {}\n", "    const marked = [...gBrowser.tabs].filter(t => t.getAttribute && t.getAttribute(\"gjoa-test-marker\"));\n", "    if (marked.length < gBrowser.tabs.length) {\n", "      for (const t of marked) { try { gBrowser.removeTab(t); } catch {} }\n", "    }\n", "  ")));
  return await dsl.wait_for(mn, "return !document.getElementById(\"gjoa-tab-panel\").hasAttribute(\"gjoa-horizontal\");", 3000);
}

async function to_horizontal_bang(mn) {
  await mn.executeScript("Services.prefs.setBoolPref(\"sidebar.verticalTabs\", false); return true;");
  return await dsl.wait_for(mn, "return document.getElementById(\"gjoa-tab-panel\").hasAttribute(\"gjoa-horizontal\");", 3000);
}

function build_roots_js(stamp) {
  return ("".concat("\n    const principal = Services.scriptSecurityManager.getSystemPrincipal();\n    const T = window.gjoaTest.treeOf;\n    for (const key of [\"a\", \"b\", \"c\"]) {\n      const t = gBrowser.addTab(\"about:blank\", { triggeringPrincipal: principal });\n      t.setAttribute(\"gjoa-test-marker\", \"", stamp, "-\" + key);\n      T.get(t).parentId = null;\n    }\n    window.gjoaTest.rows.scheduleTreeResync();\n    window.gjoaTest.rows.updateVisibility();\n    return true;"));
}

function nest_c_under_b_js(stamp) {
  return ("".concat("\n    const T = window.gjoaTest.treeOf;\n    const find = m => [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === m);\n    const b = find(\"", stamp, "-b\"), c = find(\"", stamp, "-c\");\n    if (!b || !c) throw new Error(\"nest: missing b/c\");\n    T.get(c).parentId = T.get(b).id;\n    T.get(b).collapsed = false;\n    window.gjoaTest.rows.scheduleTreeResync();\n    window.gjoaTest.rows.updateVisibility();\n    return true;"));
}

function await_marker_js(marker) {
  return ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute(\"gjoa-test-marker\") === \"", marker, "\");"));
}

function focus_b_js(stamp) {
  return ("".concat("\n    const find = m => [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === m);\n    const b = find(\"", stamp, "-b\");\n    gBrowser.selectedTab = b;\n    const row = window.gjoaTest.rowOf.get(b);\n    if (window.gjoaTest.vim && window.gjoaTest.vim.setCursor && row) {\n      window.gjoaTest.vim.setCursor(row);\n    }\n    const panel = document.getElementById(\"gjoa-tab-panel\");\n    if (panel) { panel.setAttribute(\"tabindex\", \"0\"); panel.focus(); }\n    return !!panel;"));
}

function c_parent_js(stamp) {
  return ("".concat("\n    const T = window.gjoaTest.treeOf;\n    const c = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-c\");\n    const pid = T.get(c).parentId;\n    return pid == null ? \"null\" : String(pid);"));
}

function b_id_js(stamp) {
  return ("".concat("\n    const T = window.gjoaTest.treeOf;\n    const b = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-b\");\n    return String(T.get(b).id);"));
}

function key_action(ch) {
  return [{type: "key", id: "kbd", actions: [{type: "keyDown", value: ch}, {type: "keyUp", value: ch}]}];
}

export const tests = [{name: "horizontal: j/k cursor nav does NOT reparent a nested child (#144)", run: async (mn) => { await dsl.wait_for(mn, "return !!(window.gjoaTest && window.gjoaTest.treeOf && window.gjoaTest.vim);", 10000);
await reset_bang(mn);
const stamp = ("".concat("hjk-", Date.now()));
await mn.executeScript(build_roots_js(stamp));
await dsl.wait_for(mn, await_marker_js(("".concat(stamp, "-c"))), 3000);
await mn.executeScript(nest_c_under_b_js(stamp));
const b_id = await mn.executeScript(b_id_js(stamp));
await dsl.wait_for(mn, ("".concat("return (", c_parent_js(stamp), ") === \"", b_id, "\";")), 3000);
await to_horizontal_bang(mn);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(focus_b_js(stamp))))) {
  (() => { throw new Error("no #gjoa-tab-panel to focus for vim keys"); })();
}
await mn.performActions(key_action("j"));
await mn.performActions(key_action("k"));
await sleep(200);
const c_parent = await mn.executeScript(c_parent_js(stamp));
const __a____scope__11__1__3__0__4__5__5__8__2__1__0 = c_parent;
const __e____scope__11__1__3__0__4__5__5__8__2__1__3 = b_id;
if ((!($$bc$equiv(__a____scope__11__1__3__0__4__5__5__8__2__1__0, __e____scope__11__1__3__0__4__5__5__8__2__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("j/k cursor nav reparented c (#144 regression): c.parentId must ", "stay b (", b_id, "), got ", c_parent, (($$bc$equiv(c_parent, "null")) ? " (relocated to ROOT)" : ""))), " — expected ", __e____scope__11__1__3__0__4__5__5__8__2__1__3, ", got ", __a____scope__11__1__3__0__4__5__5__8__2__1__0))); })();
} }}];

export default tests;
