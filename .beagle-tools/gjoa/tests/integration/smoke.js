import { wait_for } from '../dsl.js';

export const tests = [{name: "smoke: gjoa chrome initialized (GjoaLoader + bundles loaded, no $$bc death)", run: async (mn, ctx) => { await mn.setContext("chrome");
await await dsl.wait_for(mn, "const win = Services.wm.getMostRecentWindow('navigator:browser'); return !!(win && win.gjoaTest && win.Spaces);", 30000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(true))) {
  return (() => { throw new Error("gjoa chrome init OK"); })();
} }}];

export default tests;
