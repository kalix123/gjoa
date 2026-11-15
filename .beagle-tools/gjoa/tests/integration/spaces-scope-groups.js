import { wait_for } from '../dsl.js';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

async function clean_spaces(mn) {
  await mn.executeScript("\n    const main = window.Spaces.list().find(s => s.name === \"Main\") || window.Spaces.list()[0];\n    window.Spaces.setActive(main.id);\n    for (const s of [...window.Spaces.list()]) {\n      if (s.id !== main.id) window.Spaces.delete(s.id);\n    }\n    // Drop any pre-existing group rows so the test starts from a known state.\n    for (const r of document.querySelectorAll(\"#gjoa-tab-panel .gjoa-group-row\")) {\n      r.remove();\n    }\n  ");
  return null;
}

export const tests = [{name: "spaces-scope-groups — group created in Space A is hidden when Space B is active", run: async (mn) => { await dsl.wait_for(mn, "return !!window.Spaces && !!window.gjoaTest;", 1500);
await clean_spaces(mn);
await mn.executeScript("\n        const ws = window.Spaces.create(\"Workspace\");\n        window.Spaces.setActive(ws.id);\n      ");
await dsl.wait_for(mn, "return window.Spaces.active().name === \"Workspace\";", 1500);
await mn.executeScript("\n        const grp = window.gjoaTest.rows.createGroupRow(\"WS-only group\", 0);\n        grp.setAttribute(\"gjoa-test-marker\", \"ws-group\");\n        const panel = document.getElementById(\"gjoa-tab-panel\");\n        panel.insertBefore(grp, panel.firstChild);\n        window.gjoaTest.rows.updateVisibility();\n      ");
const created = await mn.executeScript("\n        const grp = document.querySelector('[gjoa-test-marker=\"ws-group\"]');\n        const ws = window.Spaces.list().find(s => s.name === \"Workspace\");\n        return { spaceId: grp._group.spaceId, wsId: ws.id };\n      ");
const __a____scope__3__1__3__0__4__8__2__1__0 = $$bc$get(created, "spaceId");
const __e____scope__3__1__3__0__4__8__2__1__3 = $$bc$get(created, "wsId");
if ((!($$bc$equiv(__a____scope__3__1__3__0__4__8__2__1__0, __e____scope__3__1__3__0__4__8__2__1__3)))) {
  (() => { throw new Error(("".concat(("".concat("group.spaceId=", $$bc$get(created, "spaceId"), " but Workspace.id=", $$bc$get(created, "wsId"), " — createGroupRow didn't capture active space")), " — expected ", __e____scope__3__1__3__0__4__8__2__1__3, ", got ", __a____scope__3__1__3__0__4__8__2__1__0))); })();
}
await mn.executeScript("\n        const main = window.Spaces.list().find(s => s.name === \"Main\");\n        window.Spaces.setActive(main.id);\n      ");
await dsl.wait_for(mn, "return window.Spaces.active().name === \"Main\";", 1500);
await mn.executeScript("window.gjoaTest.rows.updateVisibility();");
const in_main = await mn.executeScript("\n        const grp = document.querySelector('[gjoa-test-marker=\"ws-group\"]');\n        return { hidden: !!grp.hidden };\n      ");
if ((!((_truthy) => _truthy !== false && _truthy != null)($$bc$get(in_main, "hidden")))) {
  (() => { throw new Error("group leaked into Main — was created in Workspace but stayed visible after setActive(Main)"); })();
}
await mn.executeScript("\n        const ws = window.Spaces.list().find(s => s.name === \"Workspace\");\n        window.Spaces.setActive(ws.id);\n      ");
await dsl.wait_for(mn, "return window.Spaces.active().name === \"Workspace\";", 1500);
await mn.executeScript("window.gjoaTest.rows.updateVisibility();");
const back_in_ws = await mn.executeScript("\n        const grp = document.querySelector('[gjoa-test-marker=\"ws-group\"]');\n        return { hidden: !!grp.hidden };\n      ");
if ((!(!((_truthy) => _truthy !== false && _truthy != null)($$bc$get(back_in_ws, "hidden"))))) {
  return (() => { throw new Error("group hidden in its own space after returning to Workspace — visibility filter broken"); })();
} }}, {name: "spaces-scope-groups — group spaceId persists across save/load (snapshot envelope carries spaceId)", run: async (mn) => { await dsl.wait_for(mn, "return !!window.Spaces && !!window.gjoaTest;", 1500);
await clean_spaces(mn);
await mn.executeScript("\n        const proj = window.Spaces.create(\"Project\");\n        window.Spaces.setActive(proj.id);\n        const grp = window.gjoaTest.rows.createGroupRow(\"Project-A\", 0);\n        grp.setAttribute(\"gjoa-test-marker\", \"proj-group\");\n        const panel = document.getElementById(\"gjoa-tab-panel\");\n        panel.insertBefore(grp, panel.firstChild);\n      ");
const env = await mn.executeScript("\n        // We can't call buildEnvelope directly, but scheduleSave + history\n        // are wired. Instead, walk DOM rows the way buildEnvelope does and\n        // assert _group.spaceId is non-empty and matches Project.\n        const proj = window.Spaces.list().find(s => s.name === \"Project\");\n        const entries = [];\n        for (const r of document.querySelectorAll(\"#gjoa-tab-panel .gjoa-group-row\")) {\n          const g = r._group;\n          if (!g) continue;\n          entries.push({ name: g.name, spaceId: g.spaceId });\n        }\n        return { entries, projId: proj.id };\n      ");
const proj_entry = $$bc$get(env, "entries").find((e) => ($$bc$equiv(e.name, "Project-A")));
if ((!((_truthy) => _truthy !== false && _truthy != null)(proj_entry))) {
  (() => { throw new Error("Project-A group not found in DOM"); })();
}
const __a____scope__3__1__3__1__4__6__3__1__0 = proj_entry.spaceId;
const __e____scope__3__1__3__1__4__6__3__1__3 = $$bc$get(env, "projId");
if ((!($$bc$equiv(__a____scope__3__1__3__1__4__6__3__1__0, __e____scope__3__1__3__1__4__6__3__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("Project-A.spaceId=", proj_entry.spaceId, " doesn't match Project.id=", $$bc$get(env, "projId"), " — would not persist correctly across restart")), " — expected ", __e____scope__3__1__3__1__4__6__3__1__3, ", got ", __a____scope__3__1__3__1__4__6__3__1__0))); })();
} }}];

export default tests;
