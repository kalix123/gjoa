import { equivV as $$bc$equiv } from 'beagle/core.js';

const NEWTAB_URL = "chrome://gjoa-newtab/content/newtab.html";

export const tests = [{name: "newtab: the gjoa new-tab page is the home page too", run: async (mn, ctx) => { await mn.setContext("chrome");
const home = await mn.executeScript("return Services.prefs.getDefaultBranch('').getCharPref('browser.startup.homepage', '');");
const __a____scope__3__1__3__0__4__4__2__1__0 = home;
const __e____scope__3__1__3__0__4__4__2__1__3 = "about:newtab";
if ((!($$bc$equiv(__a____scope__3__1__3__0__4__4__2__1__0, __e____scope__3__1__3__0__4__4__2__1__3)))) {
  (() => { throw new Error(("".concat("browser.startup.homepage default should be about:newtab", " — expected ", __e____scope__3__1__3__0__4__4__2__1__3, ", got ", __a____scope__3__1__3__0__4__4__2__1__0))); })();
}
const ntu = await mn.executeScript(("".concat("const {AboutNewTab}=ChromeUtils.importESModule('resource:///modules/AboutNewTab.sys.mjs');", " return AboutNewTab.newTabURL;")));
const __a____scope__3__1__3__0__4__5__2__1__0 = ntu;
const __e____scope__3__1__3__0__4__5__2__1__3 = NEWTAB_URL;
if ((!($$bc$equiv(__a____scope__3__1__3__0__4__5__2__1__0, __e____scope__3__1__3__0__4__5__2__1__3)))) {
  return (() => { throw new Error(("".concat("AboutNewTab.newTabURL should be the gjoa new-tab page", " — expected ", __e____scope__3__1__3__0__4__5__2__1__3, ", got ", __a____scope__3__1__3__0__4__5__2__1__0))); })();
} }}];

export default tests;
