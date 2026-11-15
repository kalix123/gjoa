import { wait_for, sleep } from '../dsl.js';

export const tests = [{name: "dynamic orientation pref defaults ON", run: async (mn) => { await dsl.wait_for(mn, "return !!gBrowser;", 5000);
const dyn = await mn.executeScript("return Services.prefs.getBoolPref('gjoa.layout.dynamicOrientation', false);");
if ((!dyn)) {
  return (() => { throw new Error("gjoa.layout.dynamicOrientation must default ON"); })();
} }}, {name: "narrow window crosses threshold → horizontal; wide → vertical", run: async (mn) => { await dsl.wait_for(mn, "return !!gBrowser;", 5000);
const threshold = await mn.executeScript("return Services.prefs.getIntPref('gjoa.layout.narrowThreshold', 1000);");
await mn.executeScript(("".concat("window.resizeTo(", (threshold - 200), ", 800); return true;")));
await sleep(600);
const narrow = await mn.executeScript("return { w: window.innerWidth, vertical: Services.prefs.getBoolPref('sidebar.verticalTabs', true) };");
console.log(("".concat("NARROW=", JSON.stringify(narrow))));
await mn.executeScript(("".concat("window.resizeTo(", (threshold + 400), ", 800); return true;")));
await sleep(600);
const wide = await mn.executeScript("return { w: window.innerWidth, vertical: Services.prefs.getBoolPref('sidebar.verticalTabs', true) };");
console.log(("".concat("WIDE=", JSON.stringify(wide))));
if ((narrow.w < threshold)) {
  if ((!(!((_truthy) => _truthy !== false && _truthy != null)(narrow.vertical)))) {
    (() => { throw new Error(("".concat("narrow (", narrow.w, "px < ", threshold, ") must be horizontal (verticalTabs=false)"))); })();
  }
}
if ((wide.w > threshold)) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(wide.vertical))) {
    return (() => { throw new Error(("".concat("wide (", wide.w, "px > ", threshold, ") must be vertical (verticalTabs=true)"))); })();
  }
} }}];

export default tests;
