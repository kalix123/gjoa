import { wait_for, NAV_JS } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const TOP = "http://127.0.0.1:8975/";

const LIGHT_TOP = "http://127.0.0.1:8975/light";

const DARK_JS = ("".concat("Services.prefs.setBoolPref('gjoa.darkmode.enabled', true);", " Services.prefs.setStringPref('gjoa.darkmode.mode', 'dark');", " Services.prefs.setBoolPref('gjoa.darkmode.invert.enabled', false);", " return 'dark';"));

const INJECT_BOX = ("".concat("const d=document.createElement('div'); d.id='dm-hy';", " d.style.backgroundColor='rgb(255,255,255)'; d.style.color='rgb(0,0,0)';", " document.body.appendChild(d); return 'injected';"));

const DARK_PREPAINT_JS = ("".concat("Services.prefs.setBoolPref('gjoa.darkmode.enabled', true);", " Services.prefs.setStringPref('gjoa.darkmode.mode', 'dark');", " Services.prefs.setBoolPref('gjoa.darkmode.invert.enabled', false);", " Services.prefs.setBoolPref('gjoa.darkmode.hybrid.default-invert', true);", " return 'dark-prepaint';"));

const DARK_TOP = "http://127.0.0.1:8975/dark";

const INJECT_WHITE = ("".concat("const d=document.createElement('div'); d.id='dm-w';", " d.style.backgroundColor='rgb(255,255,255)';", " document.body.appendChild(d); return 'injected';"));

const SETTLE_JS = "const r=arguments[arguments.length-1]; setTimeout(()=>r(1), 700);";

function render_lum_js(url, px, py) {
  return ("".concat("const done = arguments[arguments.length-1];", "(async () => { try {", "  const win = Services.wm.getMostRecentWindow('navigator:browser');", "  const b = win.gBrowser.selectedBrowser;", "  b.loadURI(Services.io.newURI('", url, "'), {triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()});", "  await new Promise(r => win.setTimeout(r, 3500));", "  const wg = b.browsingContext.currentWindowGlobal;", "  const bm = await wg.drawSnapshot(new win.DOMRect(0,0,300,200), 1, 'rgb(128,128,128)');", "  const c = new win.OffscreenCanvas(300,200); const x = c.getContext('2d'); x.drawImage(bm,0,0);", "  const d = x.getImageData(", px, ",", py, ",1,1).data;", "  done(String(Math.round(0.2126*d[0] + 0.7152*d[1] + 0.0722*d[2])));", "} catch(e){ done('ERR:'+(e&&e.message||e)); } })();"));
}

export const tests = [{name: "darkmode: actor inverts a themeless light page (painted, chrome-side)", run: async (mn, ctx) => { await mn.setContext("chrome");
await mn.executeScript(DARK_JS);
const lum = await mn.executeAsyncScript(render_lum_js(LIGHT_TOP, 150, 100), []);
console.log(("".concat("[darkmode] actor /light center-lum=", lum)));
if ((!(Number(lum) < 80))) {
  return (() => { throw new Error(("".concat("themeless-light should invert to dark; lum=", lum))); })();
} }}, {name: "darkmode: engine default-invert darkens a themeless page (painted)", run: async (mn, ctx) => { await mn.setContext("chrome");
await mn.executeScript(DARK_PREPAINT_JS);
const lum = await mn.executeAsyncScript(render_lum_js(LIGHT_TOP, 150, 100), []);
console.log(("".concat("[darkmode] dark /light center-lum=", lum)));
if ((!(Number(lum) < 80))) {
  return (() => { throw new Error(("".concat("themeless-light should invert to DARK under dark-mode default-invert; lum=", lum))); })();
} }}, {name: "darkmode: native-dark page keeps its theme — white probe stays white (painted)", run: async (mn, ctx) => { await mn.setContext("chrome");
await mn.executeScript(DARK_PREPAINT_JS);
const lum = await mn.executeAsyncScript(render_lum_js(DARK_TOP, 40, 40), []);
console.log(("".concat("[darkmode] dark /dark white-probe-lum=", lum)));
if ((!(Number(lum) > 150))) {
  return (() => { throw new Error(("".concat("native-dark must NOT invert: the white probe should stay WHITE; lum=", lum))); })();
} }}, {name: "darkmode: default-invert follows the selected appearance", run: async (mn, ctx) => { await mn.setContext("chrome");
await mn.executeScript(("".concat("Services.prefs.setBoolPref('gjoa.darkmode.enabled', true);", " Services.prefs.setStringPref('gjoa.darkmode.mode', 'dark');", " return 'dark';")));
await mn.executeScript("Services.prefs.setIntPref('ui.systemUsesDarkTheme', 0); return 'os-light';");
await await dsl.wait_for(mn, "return Services.prefs.getBoolPref('gjoa.darkmode.hybrid.default-invert', false) === true;", 4000);
await mn.executeScript("Services.prefs.setIntPref('ui.systemUsesDarkTheme', 1); return 'os-dark';");
await await dsl.wait_for(mn, "return Services.prefs.getBoolPref('gjoa.darkmode.hybrid.default-invert', false) === true;", 4000);
await mn.executeScript("Services.prefs.setStringPref('gjoa.darkmode.mode', 'system'); return 'system';");
await mn.executeScript("Services.prefs.setIntPref('ui.systemUsesDarkTheme', 0); return 'os-light';");
await await dsl.wait_for(mn, "return Services.prefs.getBoolPref('gjoa.darkmode.hybrid.default-invert', false) === false;", 4000);
await mn.executeScript("Services.prefs.setIntPref('ui.systemUsesDarkTheme', 1); return 'os-dark';");
return await await dsl.wait_for(mn, "return Services.prefs.getBoolPref('gjoa.darkmode.hybrid.default-invert', false) === true;", 4000); }}, {name: "darkmode #49: explicit override pre-empts the engine flip (sync, pre-paint)", run: async (mn, ctx) => { await mn.setContext("chrome");
await mn.executeScript(("".concat("Services.prefs.setBoolPref('gjoa.darkmode.enabled', true);", " Services.prefs.setStringPref('gjoa.darkmode.mode', 'dark');", " Services.prefs.setBoolPref('gjoa.darkmode.invert.enabled', false);", " Services.prefs.setBoolPref('gjoa.darkmode.hybrid.default-invert', true);", " Services.prefs.setStringPref('gjoa.darkmode.user.off', '127.0.0.1');", " Services.prefs.savePrefFile(null);", " return 'seeded';")));
const client = await ctx.restartGjoa();
await client.setContext("chrome");
await client.executeAsyncScript("const [r]=arguments; setTimeout(()=>r(1), 1500);", []);
const navOk = await client.executeAsyncScript(NAV_JS, [LIGHT_TOP]);
if ((!navOk)) {
  (() => { throw new Error("light fixture loaded after restart"); })();
}
await client.executeAsyncScript(SETTLE_JS, []);
await client.setContext("content");
const box = await client.executeAsyncScript(("".concat("const [resolve]=arguments;", " const d=document.createElement('div'); d.id='dm-w';", " d.style.backgroundColor='rgb(255,255,255)';", " document.body.appendChild(d);", " setTimeout(()=>resolve(getComputedStyle(d).backgroundColor), 300);")), []);
const __a____scope__12__1__3__4__4__5__4__5__2__1__0 = box;
const __e____scope__12__1__3__4__4__5__4__5__2__1__3 = "rgb(255, 255, 255)";
if ((!($$bc$equiv(__a____scope__12__1__3__4__4__5__4__5__2__1__0, __e____scope__12__1__3__4__4__5__4__5__2__1__3)))) {
  (() => { throw new Error(("".concat(("".concat("explicit override (inactive) did not pre-empt the engine flip; box=", box)), " — expected ", __e____scope__12__1__3__4__4__5__4__5__2__1__3, ", got ", __a____scope__12__1__3__4__4__5__4__5__2__1__0))); })();
}
await client.setContext("chrome");
return await client.executeScript(("".concat("Services.prefs.clearUserPref('gjoa.darkmode.user.off');", " Services.prefs.clearUserPref('gjoa.darkmode.hybrid.default-invert');", " Services.prefs.clearUserPref('gjoa.darkmode.mode');", " Services.prefs.clearUserPref('gjoa.darkmode.enabled');", " Services.prefs.clearUserPref('gjoa.darkmode.invert.enabled');", " Services.prefs.savePrefFile(null);")), []); }}, {name: "darkmode override: user.force-native keeps a themeless-light page light (painted)", run: async (mn, ctx) => { await mn.setContext("chrome");
await mn.executeScript(DARK_PREPAINT_JS);
await mn.executeScript("Services.prefs.setCharPref('gjoa.darkmode.user.force-native', '127.0.0.1'); return 'fn';");
const lum = await mn.executeAsyncScript(render_lum_js(LIGHT_TOP, 150, 100), []);
console.log(("".concat("[dm-override] force-native /light center-lum=", lum)));
if ((!(Number(lum) > 150))) {
  (() => { throw new Error(("".concat("force-native must KEEP themeless-light un-inverted (light); lum=", lum))); })();
}
return await mn.executeScript("Services.prefs.clearUserPref('gjoa.darkmode.user.force-native'); return 'clean';"); }}, {name: "darkmode override: user.force-invert inverts a native-dark page (painted)", run: async (mn, ctx) => { await mn.setContext("chrome");
await mn.executeScript(DARK_PREPAINT_JS);
await mn.executeScript("Services.prefs.setCharPref('gjoa.darkmode.user.force-invert', '127.0.0.1'); return 'fi';");
const lum = await mn.executeAsyncScript(render_lum_js(DARK_TOP, 150, 100), []);
console.log(("".concat("[dm-override] force-invert /dark center-lum=", lum)));
if ((!(Number(lum) > 150))) {
  (() => { throw new Error(("".concat("force-invert must invert the native-dark page (#111 -> light center); lum=", lum))); })();
}
return await mn.executeScript("Services.prefs.clearUserPref('gjoa.darkmode.user.force-invert'); return 'clean';"); }}];

export default tests;
