import { equivV as $$bc$equiv } from 'beagle/core.js';

const LIST = "##.gjoa-probe\nexample.com##.sponsored\n###gjoa-id-probe\n";

const EVAL_JS = ("".concat("\n", "  const svc = Cc['@mozilla.org/content-classifier-service;1']\n", "    .getService(Ci.nsIContentClassifierService);\n", "  const bytes = Array.from(new TextEncoder().encode(", JSON.stringify(LIST), "));\n", "  svc.setFilterListData('gjoa-cosmetic-test', bytes);\n", "  Services.prefs.setCharPref(\n", "    'privacy.trackingprotection.content.protection.list_names',\n", "    'gjoa-cosmetic-test');\n", "  svc.applyFilterLists();\n", "  const sel = {};\n", "  svc.getHiddenClassIdSelectors(['gjoa-probe'], ['gjoa-id-probe'], [], sel);\n", "  const hide = {}, proc = {}, exc = {}, inj = {}, gh = {};\n", "  svc.getUrlCosmeticResources('https://example.com/', hide, proc, exc, inj, gh);\n", "  return JSON.stringify({\n", "    generic: sel.value || [],\n", "    specific: hide.value || [],\n", "    generichide: !!gh.value,\n", "  });\n"));

export const tests = [{name: "adblock M2: cosmetic selectors flow through the native service", run: async (mn, ctx) => { await mn.setContext("chrome");
const r = await mn.executeScript(EVAL_JS);
const d = JSON.parse(r);
console.log(("".concat("\n[M2-COSMETIC] ", r)));
if ((!((_truthy) => _truthy !== false && _truthy != null)(d.generic.includes(".gjoa-probe")))) {
  (() => { throw new Error("generic class rule ##.gjoa-probe did not come back from getHiddenClassIdSelectors"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(d.generic.includes("#gjoa-id-probe")))) {
  (() => { throw new Error("generic id rule ###gjoa-id-probe did not come back from getHiddenClassIdSelectors"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(d.specific.includes(".sponsored")))) {
  (() => { throw new Error("domain rule example.com##.sponsored did not come back from getUrlCosmeticResources"); })();
}
const __a____scope__4__1__3__0__4__4__6__1__0 = d.generichide;
const __e____scope__4__1__3__0__4__4__6__1__3 = false;
if ((!($$bc$equiv(__a____scope__4__1__3__0__4__4__6__1__0, __e____scope__4__1__3__0__4__4__6__1__3)))) {
  return (() => { throw new Error(("".concat("generichide should be false for example.com (no $generichide exception in the list)", " — expected ", __e____scope__4__1__3__0__4__4__6__1__3, ", got ", __a____scope__4__1__3__0__4__4__6__1__0))); })();
} }}];

export default tests;
