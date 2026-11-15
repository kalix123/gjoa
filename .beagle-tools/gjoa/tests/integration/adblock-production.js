import { equivV as $$bc$equiv } from 'beagle/core.js';

const TOP = "https://example.com/";

const MUST_BLOCK = ["https://www.googletagservices.com/favicon.ico", "https://www.google-analytics.com/favicon.ico"];

const MUST_SKIP = ["https://doubleclick.net/favicon.ico", "https://pagead2.googlesyndication.com/favicon.ico"];

const ALLOWED = ["https://example.net/favicon.ico", "https://upload.wikimedia.org/favicon.ico"];

const PROBE_JS = ("".concat("\n", "  const [u, resolve] = arguments;\n", "  const t = setTimeout(() => resolve('timeout'), 15000);\n", "  fetch(u, { mode: 'no-cors', cache: 'no-store' })\n", "    .then(() => { clearTimeout(t); resolve('loaded'); })\n", "    .catch(() => { clearTimeout(t); resolve('blocked'); });\n"));

const NAV_JS = ("".concat("\n", "  const [url, resolve] = arguments;\n", "  let done = false; const finish = v => { if (!done) { done = true; resolve(v); } };\n", "  const win = Services.wm.getMostRecentWindow('navigator:browser');\n", "  const b = win.gBrowser.selectedBrowser;\n", "  b.loadURI(Services.io.newURI(url), { triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() });\n", "  const l = { QueryInterface: ChromeUtils.generateQI(['nsIWebProgressListener','nsISupportsWeakReference']),\n", "    onStateChange(wp, req, flags) { const S = Ci.nsIWebProgressListener;\n", "      if ((flags & S.STATE_STOP) && (flags & S.STATE_IS_WINDOW)) { try { b.removeProgressListener(l); } catch {} finish(true); } } };\n", "  b.addProgressListener(l, Ci.nsIWebProgress.NOTIFY_STATE_ALL);\n", "  setTimeout(() => finish(false), 25000);\n"));

export const tests = [{name: "adblock M1: production defaults block via the overlay (no test mode)", run: async (mn, ctx) => { await mn.setContext("chrome");
const seeded = await mn.executeAsyncScript(("".concat("\n", "  const [resolve] = arguments;\n", "  (async () => {\n", "    const testing = Services.prefs.getBoolPref('privacy.trackingprotection.content.testing', false);\n", "    const enabled = Services.prefs.getBoolPref('privacy.trackingprotection.content.protection.enabled', false);\n", "    const names = Services.prefs.getCharPref('privacy.trackingprotection.content.protection.list_names', '');\n", "    const dir = Services.dirsvc.get('ProfD', Ci.nsIFile).path;\n", "    const cache = PathUtils.join(dir, 'gjoa-adblock');\n", "    await IOUtils.makeDirectory(cache, { ignoreExisting: true });\n", "    for (const [name, src] of [['easylist','/tmp/gjoa-easylist.txt'],['easyprivacy','/tmp/gjoa-easyprivacy.txt']]) {\n", "      const bytes = await IOUtils.read(src);\n", "      const dst = PathUtils.join(cache, name + '.txt');\n", "      await IOUtils.write(dst, bytes);\n", "      const h = Cc['@mozilla.org/security/hash;1'].createInstance(Ci.nsICryptoHash);\n", "      h.init(Ci.nsICryptoHash.SHA256);\n", "      h.update(bytes, bytes.length);\n", "      const d = h.finish(false);\n", "      let hex = '';\n", "      for (let i = 0; i < d.length; i++) { hex += d.charCodeAt(i).toString(16).padStart(2, '0'); }\n", "      await IOUtils.writeUTF8(dst + '.sha256', hex);\n", "    }\n", "    resolve(JSON.stringify({ testing, enabled, names }));\n", "  })().catch(e => resolve('ERR:' + e));\n")));
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(seeded.startsWith("ERR:"))))) {
  (() => { throw new Error(("".concat("seed failed: ", seeded))); })();
}
console.log(("".concat("\n[M1-PROD] shipped prefs: ", seeded)));
const p = JSON.parse(seeded);
const __a____scope__8__1__3__0__4__4__4__2__1__0 = p.testing;
const __e____scope__8__1__3__0__4__4__4__2__1__3 = false;
if ((!($$bc$equiv(__a____scope__8__1__3__0__4__4__4__2__1__0, __e____scope__8__1__3__0__4__4__4__2__1__3)))) {
  (() => { throw new Error(("".concat("content.testing is set — not validating the PRODUCTION path", " — expected ", __e____scope__8__1__3__0__4__4__4__2__1__3, ", got ", __a____scope__8__1__3__0__4__4__4__2__1__0))); })();
}
const __a____scope__8__1__3__0__4__4__4__3__1__0 = p.enabled;
const __e____scope__8__1__3__0__4__4__4__3__1__3 = true;
if ((!($$bc$equiv(__a____scope__8__1__3__0__4__4__4__3__1__0, __e____scope__8__1__3__0__4__4__4__3__1__3)))) {
  (() => { throw new Error(("".concat("protection.enabled default is not ON — adblock-prefs not shipped", " — expected ", __e____scope__8__1__3__0__4__4__4__3__1__3, ", got ", __a____scope__8__1__3__0__4__4__4__3__1__0))); })();
}
if ((!(p.names.length > 0))) {
  (() => { throw new Error("protection.list_names default is empty — overlay would never run"); })();
}
const client = await ctx.restartGjoa();
await client.setContext("chrome");
await client.executeAsyncScript("const [r]=arguments; setTimeout(()=>r(true), 5000);");
const navOk = await client.executeAsyncScript(NAV_JS, [TOP]);
if ((!navOk)) {
  (() => { throw new Error(("".concat("top page ", TOP, " did not load (network?)"))); })();
}
await client.setContext("content");
const probe = (url) => client.executeAsyncScript(PROBE_JS, [url]);
const mustBlockR = await Promise.all(MUST_BLOCK.map(probe));
const mustSkipR = await Promise.all(MUST_SKIP.map(probe));
const allowedR = await Promise.all(ALLOWED.map(probe));
const blocked_p = (result) => ($$bc$equiv(result, "blocked"));
const nBlocked = mustBlockR.filter(blocked_p).length;
const nSkipBlocked = mustSkipR.filter(blocked_p).length;
const nOverblock = allowedR.filter(blocked_p).length;
console.log(("".concat("[M1-PROD] must-block -> ", JSON.stringify(mustBlockR), " (", nBlocked, "/", MUST_BLOCK.length, ")")));
console.log(("".concat("[M1-PROD] option-scoped must-skip -> ", JSON.stringify(mustSkipR))));
console.log(("".concat("[M1-PROD] controls -> ", JSON.stringify(allowedR))));
const __a____scope__8__1__3__0__4__4__5__4__4__5__1__0 = nBlocked;
const __e____scope__8__1__3__0__4__4__5__4__4__5__1__3 = MUST_BLOCK.length;
if ((!($$bc$equiv(__a____scope__8__1__3__0__4__4__5__4__4__5__1__0, __e____scope__8__1__3__0__4__4__5__4__4__5__1__3)))) {
  (() => { throw new Error(("".concat(("".concat("PRODUCTION path failed to block via overlay (defaults + setFilterListData): ", JSON.stringify(mustBlockR), " — the overlay/prefs/list_names wiring is broken, NOT the engine")), " — expected ", __e____scope__8__1__3__0__4__4__5__4__4__5__1__3, ", got ", __a____scope__8__1__3__0__4__4__5__4__4__5__1__0))); })();
}
const __a____scope__8__1__3__0__4__4__5__4__4__6__1__0 = nSkipBlocked;
const __e____scope__8__1__3__0__4__4__5__4__4__6__1__3 = 0;
if ((!($$bc$equiv(__a____scope__8__1__3__0__4__4__5__4__4__6__1__0, __e____scope__8__1__3__0__4__4__5__4__4__6__1__3)))) {
  (() => { throw new Error(("".concat(("".concat("over-applied option-scoped rule: ", JSON.stringify(mustSkipR))), " — expected ", __e____scope__8__1__3__0__4__4__5__4__4__6__1__3, ", got ", __a____scope__8__1__3__0__4__4__5__4__4__6__1__0))); })();
}
const __a____scope__8__1__3__0__4__4__5__4__4__7__1__0 = nOverblock;
const __e____scope__8__1__3__0__4__4__5__4__4__7__1__3 = 0;
if ((!($$bc$equiv(__a____scope__8__1__3__0__4__4__5__4__4__7__1__0, __e____scope__8__1__3__0__4__4__5__4__4__7__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("control over-blocked: ", JSON.stringify(allowedR))), " — expected ", __e____scope__8__1__3__0__4__4__5__4__4__7__1__3, ", got ", __a____scope__8__1__3__0__4__4__5__4__4__7__1__0))); })();
} }}];

export default tests;
