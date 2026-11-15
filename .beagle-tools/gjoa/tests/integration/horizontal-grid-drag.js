import { wait_for, sleep } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

async function to_horizontal_bang(mn) {
  await mn.executeScript("Services.prefs.setBoolPref('sidebar.verticalTabs', false); return true;");
  return await dsl.wait_for(mn, "return document.getElementById('gjoa-tab-panel').hasAttribute('gjoa-horizontal');", 3000);
}

function build_roots_js(stamp, n) {
  return ("".concat("\n    const p = Services.scriptSecurityManager.getSystemPrincipal();\n    const T = window.gjoaTest.treeOf;\n    for (let i = 0; i < ", n, "; i++) {\n      const t = gBrowser.addTab('about:blank', { triggeringPrincipal: p });\n      t.setAttribute('gjoa-test-marker', '", stamp, "-r' + i);\n      T.get(t).parentId = null;\n    }\n    window.gjoaTest.rows.scheduleTreeResync();\n    window.gjoaTest.rows.updateVisibility();\n    window.gjoaTest.rows.updateHorizontalGrid();\n    return true;"));
}

function find_tab_js(stamp, key) {
  return ("".concat("[...gBrowser.tabs].find(t => t.getAttribute('gjoa-test-marker') === '", stamp, "-", key, "')"));
}

function synth_drag_js(stamp, src_key, tgt_key, fx, fy) {
  return ("".concat("\n    const srcTab = ", find_tab_js(stamp, src_key), ";\n    const tgtTab = ", find_tab_js(stamp, tgt_key), ";\n    const src = window.gjoaTest.rowOf.get(srcTab);\n    const tgt = window.gjoaTest.rowOf.get(tgtTab);\n    const tr = tgt.getBoundingClientRect();\n    const cx = tr.left + tr.width * ", fx, ";\n    const cy = tr.top + tr.height * ", fy, ";\n    const sr = src.getBoundingClientRect();\n    const dt = new DataTransfer();\n    const fire = (el, type, x, y) => el.dispatchEvent(new DragEvent(type, {\n      bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, dataTransfer: dt }));\n    fire(src, 'dragstart', sr.left + 5, sr.top + 5);\n    fire(tgt, 'dragenter', cx, cy);\n    fire(tgt, 'dragover',  cx, cy);\n    fire(tgt, 'drop',      cx, cy);\n    fire(src, 'dragend',   cx, cy);\n    window.gjoaTest.rows.scheduleTreeResync();\n    window.gjoaTest.rows.updateHorizontalGrid();\n    return true;"));
}

function grid_col_js(stamp, key) {
  return ("".concat("\n    const t = ", find_tab_js(stamp, key), ";\n    return getComputedStyle(window.gjoaTest.rowOf.get(t)).gridColumnStart;"));
}

function parent_of_js(stamp, key) {
  return ("".concat("\n    const t = ", find_tab_js(stamp, key), ";\n    const pid = window.gjoaTest.treeOf.get(t).parentId;\n    return pid == null ? 'null' : String(pid);"));
}

function id_of_js(stamp, key) {
  return ("".concat("\n    const t = ", find_tab_js(stamp, key), ";\n    return String(window.gjoaTest.treeOf.get(t).id);"));
}

export const tests = [{name: "horizontal: dragging a tab onto another's cell lands it as a precise sibling, not a child", run: async (mn) => { await dsl.wait_for(mn, "return !!(window.gjoaTest && window.gjoaTest.treeOf);", 5000);
const stamp = ("".concat("hgd-s-", Date.now()));
await mn.executeScript(build_roots_js(stamp, 3));
await dsl.wait_for(mn, ("".concat("return !!", find_tab_js(stamp, "r2"), ";")), 3000);
await to_horizontal_bang(mn);
await sleep(250);
const r1_col0 = await mn.executeScript(grid_col_js(stamp, "r1"));
const r2_col0 = await mn.executeScript(grid_col_js(stamp, "r2"));
if ((!(!(r1_col0 === r2_col0)))) {
  (() => { throw new Error(("".concat("setup: r1 and r2 must start in different columns (r1=", r1_col0, " r2=", r2_col0, ")"))); })();
}
await mn.executeScript(synth_drag_js(stamp, "r2", "r1", 0.3, 0.7));
await sleep(200);
const r1_id = await mn.executeScript(id_of_js(stamp, "r1"));
const r2_parent = await mn.executeScript(parent_of_js(stamp, "r2"));
const __a____scope__9__1__3__0__4__4__6__5__2__1__0 = r2_parent;
const __e____scope__9__1__3__0__4__4__6__5__2__1__3 = "null";
if ((!($$bc$equiv(__a____scope__9__1__3__0__4__4__6__5__2__1__0, __e____scope__9__1__3__0__4__4__6__5__2__1__3)))) {
  (() => { throw new Error(("".concat(("".concat("r2 dropped on r1's upper cell must remain a root sibling, not become child of r1 ", "(parentId ", r2_parent, " should be null, NOT r1 id ", r1_id, ")")), " — expected ", __e____scope__9__1__3__0__4__4__6__5__2__1__3, ", got ", __a____scope__9__1__3__0__4__4__6__5__2__1__0))); })();
}
const r1_col1 = await mn.executeScript(grid_col_js(stamp, "r1"));
const r2_col1 = await mn.executeScript(grid_col_js(stamp, "r2"));
const __a____scope__9__1__3__0__4__4__6__6__2__1__0 = r2_col1;
const __e____scope__9__1__3__0__4__4__6__6__2__1__3 = r1_col0;
if ((!($$bc$equiv(__a____scope__9__1__3__0__4__4__6__6__2__1__0, __e____scope__9__1__3__0__4__4__6__6__2__1__3)))) {
  (() => { throw new Error(("".concat(("".concat("r2 must take r1's old column ", r1_col0, " (got r2=", r2_col1, ")")), " — expected ", __e____scope__9__1__3__0__4__4__6__6__2__1__3, ", got ", __a____scope__9__1__3__0__4__4__6__6__2__1__0))); })();
}
if ((!(new Number(r1_col1) > new Number(r2_col1)))) {
  return (() => { throw new Error(("".concat("r1 must shift to a later column than r2 (r1=", r1_col1, " r2=", r2_col1, ")"))); })();
} }}, {name: "horizontal: dragging a tab onto another's lower strip still nests it as a child", run: async (mn) => { await dsl.wait_for(mn, "return !!(window.gjoaTest && window.gjoaTest.treeOf);", 5000);
const stamp = ("".concat("hgd-c-", Date.now()));
await mn.executeScript(build_roots_js(stamp, 3));
await dsl.wait_for(mn, ("".concat("return !!", find_tab_js(stamp, "r2"), ";")), 3000);
await to_horizontal_bang(mn);
await sleep(250);
await mn.executeScript(synth_drag_js(stamp, "r2", "r1", 0.5, 0.9));
await sleep(200);
const r1_id = await mn.executeScript(id_of_js(stamp, "r1"));
const r2_parent = await mn.executeScript(parent_of_js(stamp, "r2"));
const __a____scope__9__1__3__1__4__4__8__2__1__0 = r2_parent;
const __e____scope__9__1__3__1__4__4__8__2__1__3 = r1_id;
if ((!($$bc$equiv(__a____scope__9__1__3__1__4__4__8__2__1__0, __e____scope__9__1__3__1__4__4__8__2__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("r2 dropped on r1's lower strip must nest as a child of r1 ", "(parentId ", r2_parent, " should be r1 id ", r1_id, ")")), " — expected ", __e____scope__9__1__3__1__4__4__8__2__1__3, ", got ", __a____scope__9__1__3__1__4__4__8__2__1__0))); })();
} }}];

export default tests;
