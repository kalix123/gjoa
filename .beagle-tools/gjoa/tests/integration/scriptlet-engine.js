
const DRIVE = ("".concat("\n", "  const [resolve] = arguments;\n", "  (async () => {\n", "    try {\n", "      const svc = Cc['@mozilla.org/content-classifier-service;1']\n", "        .getService(Ci.nsIContentClassifierService);\n", "      // Self-isolate: clear any test-list mode a prior test left, and pin\n", "      // list_names so our easylist override actually builds an engine.\n", "      try { Services.prefs.setBoolPref('privacy.trackingprotection.content.testing', false); } catch(e){}\n", "      try { Services.prefs.clearUserPref('privacy.trackingprotection.content.protection.test_list_urls'); } catch(e){}\n", "      try { Services.prefs.setCharPref('privacy.trackingprotection.content.protection.list_names', 'easylist,gjoa-allow'); } catch(e){}\n", "      const resJson = await (await fetch('resource://gre/modules/scriptlet-resources.json')).text();\n", "      // The service initializes async at startup; retry until it accepts calls.\n", "      let ready = false;\n", "      for (let i = 0; i < 60; i++) {\n", "        try { svc.setScriptletResources(resJson); ready = true; break; }\n", "        catch (e) { await new Promise(r => setTimeout(r, 100)); }\n", "      }\n", "      // Put a single youtube +js rule into a list that's in list_names.\n", "      const rule = 'youtube.com##+js(json-prune, playerResponse.adPlacements adPlacements adSlots)\\n';\n", "      svc.setFilterListData('easylist', new TextEncoder().encode(rule));\n", "      svc.applyFilterLists();\n", "      const hide={}, proc={}, exc={}, injected={}, gh={};\n", "      svc.getUrlCosmeticResources('https://www.youtube.com/watch?v=x', hide, proc, exc, injected, gh);\n", "      const inj = injected.value || '';\n", "      resolve({ ready, len: inj.length,\n", "                hasPrune: inj.indexOf('Prune') >= 0 || inj.indexOf('adPlacements') >= 0 });\n", "    } catch (e) { resolve({ err: String(e) }); }\n", "  })();\n"));

export const tests = [{name: "engine scriptlets: a +js() rule + the resource library yields injected_script", run: async (mn) => { await mn.setContext("chrome");
const r = await mn.executeAsyncScript(DRIVE);
if (((_truthy) => _truthy !== false && _truthy != null)(r.err)) {
  (() => { throw new Error(("".concat("engine scriptlet path errored: ", r.err))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.ready))) {
  (() => { throw new Error("content-classifier service must initialize"); })();
}
if ((!(r.len > 0))) {
  (() => { throw new Error(("".concat("engine must produce a non-empty injected_script for the youtube +js rule (len=", r.len, ")"))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.hasPrune))) {
  return (() => { throw new Error("injected_script must contain the json-prune scriptlet body"); })();
} }}];

export default tests;
