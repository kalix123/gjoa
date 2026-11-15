import { equivV as $$bc$equiv } from 'beagle/core.js';

const RESET_JS = ("".concat("\n", "  const S = window.Spaces;\n", "  const main = S.list().find(s => s.name === 'Main') || S.list()[0];\n", "  S.setActive(main.id);\n", "  for (const s of [...S.list()]) { if (s.id !== main.id) S.delete(s.id); }\n", "  const work = S.create('Work');\n", "  window.__workId = work.id;\n", "  window.__mainId = main.id;\n", "  return JSON.stringify({ work: work.id, main: main.id });\n"));

const RESTORE_PROBE_JS = ("".concat("\n", "  const S = window.Spaces;\n", "  const fakeTab = { getAttribute: (a) => a === 'gjoa-space-id' ? window.__workId : null };\n", "  const got = S.spaceOf(fakeTab);\n", "  return JSON.stringify({ isWork: got === window.__workId, isMain: got === window.__mainId });\n"));

const ASSIGN_PERSIST_JS = ("".concat("\n", "  const S = window.Spaces;\n", "  const t = gBrowser.addTab('https://example.com/assign', {\n", "    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() });\n", "  S.assignTab(t, window.__workId);\n", "  const attr = t.getAttribute('gjoa-space-id');\n", "  gBrowser.removeTab(t);\n", "  return attr;\n"));

const NO_ATTR_JS = ("".concat("\n", "  const S = window.Spaces;\n", "  const t = gBrowser.addTab('https://example.com/plain', {\n", "    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() });\n", "  const got = S.spaceOf(t);\n", "  const isMain = got === window.__mainId;\n", "  gBrowser.removeTab(t);\n", "  return JSON.stringify({ isMain });\n"));

export const tests = [{name: "spaces #40bug3: restored tab re-anchors via persisted gjoa-space-id (not Main)", run: async (mn, ctx) => { await mn.setContext("chrome");
await mn.executeScript(RESET_JS);
const parsed = JSON.parse(await mn.executeScript(RESTORE_PROBE_JS));
if ((!((_truthy) => _truthy !== false && _truthy != null)(parsed.isWork))) {
  (() => { throw new Error("restored tab with persisted gjoa-space-id resolves to Work"); })();
}
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(parsed.isMain)))) {
  return (() => { throw new Error("restored tab must NOT strand in Main"); })();
} }}, {name: "spaces #40bug3: assignTab persists gjoa-space-id on the tab", run: async (mn, ctx) => { await mn.setContext("chrome");
await mn.executeScript(RESET_JS);
const __a____scope__6__1__3__1__4__5__1__0 = await mn.executeScript(ASSIGN_PERSIST_JS);
const __e____scope__6__1__3__1__4__5__1__3 = await mn.executeScript("return window.__workId;");
if ((!($$bc$equiv(__a____scope__6__1__3__1__4__5__1__0, __e____scope__6__1__3__1__4__5__1__3)))) {
  return (() => { throw new Error(("".concat("assignTab writes the space id to the gjoa-space-id attribute", " — expected ", __e____scope__6__1__3__1__4__5__1__3, ", got ", __a____scope__6__1__3__1__4__5__1__0))); })();
} }}, {name: "spaces #40bug3: tab with no space attr still falls back to Main", run: async (mn, ctx) => { await mn.setContext("chrome");
await mn.executeScript(RESET_JS);
const parsed = JSON.parse(await mn.executeScript(NO_ATTR_JS));
if ((!((_truthy) => _truthy !== false && _truthy != null)(parsed.isMain))) {
  return (() => { throw new Error("a tab with no persisted space and no WeakMap entry defaults to Main"); })();
} }}];

export default tests;
