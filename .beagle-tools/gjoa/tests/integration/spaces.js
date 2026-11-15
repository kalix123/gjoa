import { wait_for } from '../dsl.js';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

function visible_tab_rows() {
  return "\n    return [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row, #gjoa-tab-panel-pinned .gjoa-tab-row\")]\n      .filter(r => !r.hidden).length;\n  ";
}

export const tests = [{name: "Spaces — window.Spaces is exposed with a default 'Main' space", run: async (mn) => { await dsl.wait_for(mn, "return !!window.Spaces && window.Spaces.list().length >= 1;");
const list = await mn.executeScript("return window.Spaces.list().map(s => ({ name: s.name }));");
if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(list[0].name, "Main")) : _logical))(list.length)))) {
  (() => { throw new Error(("".concat("expected default 'Main', got ", JSON.stringify(list)))); })();
}
const __a____scope__3__1__3__0__4__5__1__0 = await mn.executeScript("return window.Spaces.active().name;");
const __e____scope__3__1__3__0__4__5__1__3 = "Main";
if ((!($$bc$equiv(__a____scope__3__1__3__0__4__5__1__0, __e____scope__3__1__3__0__4__5__1__3)))) {
  return (() => { throw new Error(("".concat("active space", " — expected ", __e____scope__3__1__3__0__4__5__1__3, ", got ", __a____scope__3__1__3__0__4__5__1__0))); })();
} }}, {name: "Spaces — creating + switching hides original tabs and shows new-space tabs", run: async (mn) => { await dsl.wait_for(mn, "return !!window.Spaces;");
const before = await mn.executeScript(visible_tab_rows());
await mn.executeScript("\n        const s = window.Spaces.create(\"Work\");\n        window.Spaces.setActive(s.id);\n      ");
await dsl.wait_for(mn, "return window.Spaces.active().name === \"Work\";");
await dsl.wait_for(mn, ("".concat(visible_tab_rows().replace("return ", "const c = "), "; return c === 0;")));
const __a____scope__3__1__3__1__4__4__5__1__0 = await mn.executeScript(visible_tab_rows());
const __e____scope__3__1__3__1__4__4__5__1__3 = 0;
if ((!($$bc$equiv(__a____scope__3__1__3__1__4__4__5__1__0, __e____scope__3__1__3__1__4__4__5__1__3)))) {
  (() => { throw new Error(("".concat(("".concat("after switching to Work, expected 0 visible tabs (baseline ", before, ")")), " — expected ", __e____scope__3__1__3__1__4__4__5__1__3, ", got ", __a____scope__3__1__3__1__4__4__5__1__0))); })();
}
await mn.executeScript("\n        gBrowser.addTab(\"https://example.com/work-tab\", {\n          triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),\n        });\n      ");
await dsl.wait_for(mn, ("".concat(visible_tab_rows().replace("return ", "const c = "), "; return c >= 1;")), 8000);
await mn.executeScript("\n        const main = window.Spaces.list().find(s => s.name === \"Main\");\n        window.Spaces.setActive(main.id);\n      ");
await dsl.wait_for(mn, "return window.Spaces.active().name === \"Main\";");
return await dsl.wait_for(mn, ("".concat(visible_tab_rows().replace("return ", "const c = "), "; return c === ", before, ";")), 5000); }}, {name: "Spaces — assignTab moves a tab between spaces (visibility follows)", run: async (mn) => { await dsl.wait_for(mn, "return !!window.Spaces;");
await mn.executeScript("\n        const work = window.Spaces.list().find(s => s.name === \"Work\")\n          || window.Spaces.create(\"Work\");\n        window.Spaces._testWorkId = work.id;\n        const main = window.Spaces.list().find(s => s.name === \"Main\");\n        window.Spaces.setActive(main.id);\n      ");
await mn.executeScript("\n        const t = gBrowser.addTab(\"https://example.com/movable\", {\n          triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),\n        });\n        window.Spaces._testMovableTab = t;\n      ");
await dsl.wait_for(mn, "return window.Spaces._testMovableTab != null;");
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript("\n        const t = window.Spaces._testMovableTab;\n        return window.Spaces.isVisible(t);\n      ")))) {
  (() => { throw new Error("freshly-opened tab should be visible on Main"); })();
}
await mn.executeScript("\n        window.Spaces.assignTab(window.Spaces._testMovableTab, window.Spaces._testWorkId);\n      ");
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript("\n        const t = window.Spaces._testMovableTab;\n        return window.Spaces.isVisible(t);\n      "))))) {
  (() => { throw new Error("tab moved to Work should not be visible on Main"); })();
}
await mn.executeScript("\n        window.Spaces.setActive(window.Spaces._testWorkId);\n      ");
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript("\n        return window.Spaces.isVisible(window.Spaces._testMovableTab);\n      ")))) {
  return (() => { throw new Error("tab in Work should be visible while Work is active"); })();
} }}, {name: "Spaces — deleting an active space falls back to default; orphan tabs surface", run: async (mn) => { await dsl.wait_for(mn, "return !!window.Spaces;");
await mn.executeScript("\n        const doomed = window.Spaces.create(\"Doomed\");\n        window.Spaces.setActive(doomed.id);\n        const t = gBrowser.addTab(\"https://example.com/orphan-test\", {\n          triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),\n        });\n        window.Spaces._testOrphanTab = t;\n        window.Spaces._testDoomedId = doomed.id;\n      ");
await dsl.wait_for(mn, "return window.Spaces._testOrphanTab != null;");
await mn.executeScript("\n        window.Spaces.delete(window.Spaces._testDoomedId);\n      ");
const __a____scope__3__1__3__3__4__7__1__0 = await mn.executeScript("return window.Spaces.active().name;");
const __e____scope__3__1__3__3__4__7__1__3 = "Main";
if ((!($$bc$equiv(__a____scope__3__1__3__3__4__7__1__0, __e____scope__3__1__3__3__4__7__1__3)))) {
  (() => { throw new Error(("".concat("active space after deleting Doomed", " — expected ", __e____scope__3__1__3__3__4__7__1__3, ", got ", __a____scope__3__1__3__3__4__7__1__0))); })();
}
const orphan = await mn.executeScript("\n        const t = window.Spaces._testOrphanTab;\n        const def = window.Spaces.list()[0].id;\n        return { vis: window.Spaces.isVisible(t), sid: window.Spaces.spaceOf(t), defId: def };\n      ");
if ((!((_truthy) => _truthy !== false && _truthy != null)($$bc$get(orphan, "vis")))) {
  (() => { throw new Error(("".concat("orphan tab should be visible (default-fallback), state=", JSON.stringify(orphan)))); })();
}
const __a____scope__3__1__3__3__4__8__3__1__0 = $$bc$get(orphan, "sid");
const __e____scope__3__1__3__3__4__8__3__1__3 = $$bc$get(orphan, "defId");
if ((!($$bc$equiv(__a____scope__3__1__3__3__4__8__3__1__0, __e____scope__3__1__3__3__4__8__3__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("orphan should surface in default space, state=", JSON.stringify(orphan))), " — expected ", __e____scope__3__1__3__3__4__8__3__1__3, ", got ", __a____scope__3__1__3__3__4__8__3__1__0))); })();
} }}];

export default tests;
