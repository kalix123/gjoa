
function render_lum_js(url) {
  return ("".concat("const done = arguments[arguments.length-1];", "(async () => { try {", "  const win = Services.wm.getMostRecentWindow('navigator:browser');", "  const b = win.gBrowser.selectedBrowser;", "  b.loadURI(Services.io.newURI('", url, "'), {triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()});", "  await new Promise(r => win.setTimeout(r, 3500));", "  const wg = b.browsingContext.currentWindowGlobal;", "  const bm = await wg.drawSnapshot(new win.DOMRect(0,0,300,200), 1, 'rgb(128,128,128)');", "  const c = new win.OffscreenCanvas(300,200); const x = c.getContext('2d'); x.drawImage(bm,0,0);", "  const d = x.getImageData(150,100,1,1).data;", "  done(String(Math.round(0.2126*d[0] + 0.7152*d[1] + 0.0722*d[2])));", "} catch(e){ done('ERR:'+(e&&e.message||e)); } })();"));
}

function set_dm(mn, on) {
  return mn.executeScript(("".concat("Services.prefs.setBoolPref('gjoa.darkmode.enabled', ", (on ? "true" : "false"), ");", " Services.prefs.setCharPref('gjoa.darkmode.mode','dark'); return 'ok';")));
}

export const tests = [{name: "darkmode render: dark mode inverts a themeless-light page (chrome-side)", run: async (mn, ctx) => { await mn.setContext("chrome");
await set_dm(mn, true);
const lum = await mn.executeAsyncScript(render_lum_js("http://127.0.0.1:8975/light"), []);
console.log(("".concat("[darkmode-render] dark-ON themeless-light center-lum=", lum)));
if ((!(Number(lum) < 80))) {
  return (() => { throw new Error(("".concat("themeless-light should render DARK; got lum=", lum))); })();
} }}, {name: "darkmode render: OFF leaves a themeless-light page light (control)", run: async (mn, ctx) => { await mn.setContext("chrome");
await set_dm(mn, false);
const lum = await mn.executeAsyncScript(render_lum_js("http://127.0.0.1:8975/light"), []);
console.log(("".concat("[darkmode-render] OFF themeless-light center-lum=", lum)));
if ((!(Number(lum) > 150))) {
  return (() => { throw new Error(("".concat("themeless-light should render LIGHT when darkmode off; got lum=", lum))); })();
} }}];

export default tests;
