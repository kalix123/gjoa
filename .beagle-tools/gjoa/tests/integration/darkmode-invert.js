
const LIGHT = "http://127.0.0.1:8975/light";

const TOP = "http://127.0.0.1:8975/";

function render_lum_js(url) {
  return ("".concat("const done = arguments[arguments.length-1];", "(async () => { try {", "  const win = Services.wm.getMostRecentWindow('navigator:browser');", "  const b = win.gBrowser.selectedBrowser;", "  b.loadURI(Services.io.newURI('", url, "'), {triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()});", "  await new Promise(r => win.setTimeout(r, 3500));", "  const wg = b.browsingContext.currentWindowGlobal;", "  const bm = await wg.drawSnapshot(new win.DOMRect(0,0,300,200), 1, 'rgb(128,128,128)');", "  const c = new win.OffscreenCanvas(300,200); const x = c.getContext('2d'); x.drawImage(bm,0,0);", "  const d = x.getImageData(150,100,1,1).data;", "  done(String(Math.round(0.2126*d[0] + 0.7152*d[1] + 0.0722*d[2])));", "} catch(e){ done('ERR:'+(e&&e.message||e)); } })();"));
}

const relum_js = ("".concat("const done = arguments[arguments.length-1];", "(async () => { try {", "  const win = Services.wm.getMostRecentWindow('navigator:browser');", "  const b = win.gBrowser.selectedBrowser;", "  await new Promise(r => win.setTimeout(r, 1500));", "  const wg = b.browsingContext.currentWindowGlobal;", "  const bm = await wg.drawSnapshot(new win.DOMRect(0,0,300,200), 1, 'rgb(128,128,128)');", "  const c = new win.OffscreenCanvas(300,200); const x = c.getContext('2d'); x.drawImage(bm,0,0);", "  const d = x.getImageData(150,100,1,1).data;", "  done(String(Math.round(0.2126*d[0] + 0.7152*d[1] + 0.0722*d[2])));", "} catch(e){ done('ERR:'+(e&&e.message||e)); } })();"));

function set_prefs(mn, js) {
  return mn.executeScript(js);
}

export const tests = [{name: "darkmode P0: engine inverts a themeless-light page (painted, chrome-side)", run: async (mn, ctx) => { await mn.setContext("chrome");
await set_prefs(mn, "Services.prefs.setBoolPref('gjoa.darkmode.enabled', false); Services.prefs.setBoolPref('gjoa.darkmode.invert.enabled', true); return 'on';");
const lum = await mn.executeAsyncScript(render_lum_js(LIGHT), []);
console.log(("".concat("[DM-P0] invert-ON /light center-lum=", lum)));
if ((!(Number(lum) < 80))) {
  return (() => { throw new Error(("".concat("themeless-light should render DARK under engine invert; lum=", lum))); })();
} }}, {name: "darkmode P0: flag off leaves a themeless-light page light (control)", run: async (mn, ctx) => { await mn.setContext("chrome");
await set_prefs(mn, "Services.prefs.setBoolPref('gjoa.darkmode.enabled', false); Services.prefs.setBoolPref('gjoa.darkmode.invert.enabled', false); return 'off';");
const lum = await mn.executeAsyncScript(render_lum_js(LIGHT), []);
console.log(("".concat("[DM-P0] invert-OFF /light center-lum=", lum)));
if ((!(Number(lum) > 150))) {
  return (() => { throw new Error(("".concat("flag off: themeless-light should stay LIGHT; lum=", lum))); })();
} }}, {name: "darkmode P1: live toggle restyles an already-loaded tab (painted)", run: async (mn, ctx) => { await mn.setContext("chrome");
await set_prefs(mn, "Services.prefs.setBoolPref('gjoa.darkmode.enabled', false); Services.prefs.setBoolPref('gjoa.darkmode.invert.enabled', false); return 'off';");
const before = await mn.executeAsyncScript(render_lum_js(LIGHT), []);
console.log(("".concat("[DM-P1] before-toggle lum=", before)));
if ((!(Number(before) > 150))) {
  (() => { throw new Error(("".concat("should start LIGHT; lum=", before))); })();
}
await set_prefs(mn, "Services.prefs.setBoolPref('gjoa.darkmode.invert.enabled', true); return 'on';");
const after = await mn.executeAsyncScript(relum_js, []);
console.log(("".concat("[DM-P1] after-toggle lum=", after)));
if ((!(Number(after) < 80))) {
  return (() => { throw new Error(("".concat("live toggle should restyle to DARK without reload; lum=", after))); })();
} }}, {name: "darkmode P2: system colors invert under full engine mode (painted)", run: async (mn, ctx) => { await mn.setContext("chrome");
await set_prefs(mn, "Services.prefs.setBoolPref('gjoa.darkmode.enabled', false); Services.prefs.setIntPref('layout.css.prefers-color-scheme.content-override', 1); Services.prefs.setBoolPref('gjoa.darkmode.invert.enabled', true); return 'engine';");
const lum = await mn.executeAsyncScript(render_lum_js(TOP), []);
console.log(("".concat("[DM-P2] full-engine / center-lum=", lum)));
if ((!(Number(lum) < 90))) {
  return (() => { throw new Error(("".concat("system colors (page bg) should invert to DARK; lum=", lum))); })();
} }}];

export default tests;
