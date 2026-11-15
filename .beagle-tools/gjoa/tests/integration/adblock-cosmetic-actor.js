import { wait_for, NAV_JS } from '../dsl.js';

const TOP = "http://127.0.0.1:8975/";

const SETUP_JS = ("".concat("\n", "  const svc = Cc['@mozilla.org/content-classifier-service;1']\n", "    .getService(Ci.nsIContentClassifierService);\n", "  const bytes = Array.from(new TextEncoder().encode('##.gjoa-probe-static\\n##.gjoa-probe-dynamic\\n'));\n", "  svc.setFilterListData('gjoa-cosmetic-test', bytes);\n", "  Services.prefs.setCharPref('privacy.trackingprotection.content.protection.list_names', 'gjoa-cosmetic-test');\n", "  svc.applyFilterLists();\n", "  Services.prefs.setBoolPref('gjoa.contentblock.enabled', true);\n", "  Services.prefs.setBoolPref('privacy.trackingprotection.content.protection.enabled', true);\n", "  Services.prefs.setCharPref('gjoa.contentblock.user.allow-hosts', '');\n", "  return 'setup-ok';\n"));

const STATIC_HIDDEN = "const s=document.getElementById('static'); return !!(s && getComputedStyle(s).display === 'none');";

const KEEP_VISIBLE = "const k=document.getElementById('keep'); return !!(k && getComputedStyle(k).display !== 'none');";

const INJECT_DYN = "const d=document.createElement('div'); d.className='gjoa-probe-dynamic'; d.id='dyn'; d.textContent='x'; document.body.appendChild(d); return 'ok';";

const DYN_HIDDEN = "const d=document.getElementById('dyn'); return !!(d && getComputedStyle(d).display === 'none');";

export const tests = [{name: "adblock M2 actor: at-load + dynamic elements hidden, control kept", run: async (mn, ctx) => { await mn.setContext("chrome");
await mn.executeScript(SETUP_JS);
const navOk = await mn.executeAsyncScript(NAV_JS, [TOP]);
if ((!navOk)) {
  (() => { throw new Error(("".concat("local fixture ", TOP, " did not load — is cosmetic-fixture-server.mjs running on :8975?"))); })();
}
await mn.setContext("content");
await dsl.wait_for(mn, STATIC_HIDDEN, 8000);
console.log("\n[M2-ACTOR] at-load .gjoa-probe-static hidden");
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(KEEP_VISIBLE)))) {
  (() => { throw new Error("control .gjoa-keep was hidden — cosmetic over-hiding"); })();
}
await mn.executeScript(INJECT_DYN);
await dsl.wait_for(mn, DYN_HIDDEN, 8000);
return console.log("[M2-ACTOR] dynamically-added .gjoa-probe-dynamic hidden"); }}];

export default tests;
