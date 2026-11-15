import { equivV as $$bc$equiv } from 'beagle/core.js';

export const tests = [{name: "adblock M1: blocking module + global toggle flips the engine gate", run: async (mn, ctx) => { await mn.setContext("chrome");
const r = await mn.executeScript(("".concat("\n", "  const w = Services.wm.getMostRecentWindow('navigator:browser');\n", "  const gb = w.gjoaBlocking;\n", "  const item = w.document.getElementById('gjoa-toggle-blocking');\n", "  const P = 'privacy.trackingprotection.content.protection.enabled';\n", "  const before = Services.prefs.getBoolPref(P, false);\n", "  if (gb) gb.toggle();\n", "  const after = Services.prefs.getBoolPref(P, false);\n", "  if (gb) gb.toggle();\n", "  const restored = Services.prefs.getBoolPref(P, false);\n", "  return JSON.stringify({ hasApi: !!gb, hasItem: !!item, before, after, restored });\n")));
const d = JSON.parse(r);
console.log(("".concat("\n[M1-UI] ", r, " (menu item is install!-gated on a native sidebar-button, absent headless — verified in the bundle instead)")));
if ((!((_truthy) => _truthy !== false && _truthy != null)(d.hasApi))) {
  (() => { throw new Error("window.gjoaBlocking missing — the gjoa-blocking chrome module did not load"); })();
}
const __a____scope__2__1__3__0__4__4__4__1__0 = d.before;
const __e____scope__2__1__3__0__4__4__4__1__3 = true;
if ((!($$bc$equiv(__a____scope__2__1__3__0__4__4__4__1__0, __e____scope__2__1__3__0__4__4__4__1__3)))) {
  (() => { throw new Error(("".concat("protection.enabled not ON before toggle", " — expected ", __e____scope__2__1__3__0__4__4__4__1__3, ", got ", __a____scope__2__1__3__0__4__4__4__1__0))); })();
}
const __a____scope__2__1__3__0__4__4__5__1__0 = d.after;
const __e____scope__2__1__3__0__4__4__5__1__3 = false;
if ((!($$bc$equiv(__a____scope__2__1__3__0__4__4__5__1__0, __e____scope__2__1__3__0__4__4__5__1__3)))) {
  (() => { throw new Error(("".concat("toggle did not turn the engine gate OFF — global toggle broken", " — expected ", __e____scope__2__1__3__0__4__4__5__1__3, ", got ", __a____scope__2__1__3__0__4__4__5__1__0))); })();
}
const __a____scope__2__1__3__0__4__4__6__1__0 = d.restored;
const __e____scope__2__1__3__0__4__4__6__1__3 = true;
if ((!($$bc$equiv(__a____scope__2__1__3__0__4__4__6__1__0, __e____scope__2__1__3__0__4__4__6__1__3)))) {
  return (() => { throw new Error(("".concat("second toggle did not restore the gate", " — expected ", __e____scope__2__1__3__0__4__4__6__1__3, ", got ", __a____scope__2__1__3__0__4__4__6__1__0))); })();
} }}];

export default tests;
