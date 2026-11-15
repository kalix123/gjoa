import { wait_for } from '../dsl.js';

function open_js(url, marker) {
  return ("".concat("\n    const p = Services.scriptSecurityManager.getSystemPrincipal();\n    const t = gBrowser.addTab('", url, "', { triggeringPrincipal: p });\n    t.setAttribute('gjoa-test-marker', '", marker, "');\n    gBrowser.selectedTab = t;\n    return true;"));
}

function icon_js(marker) {
  return ("".concat("\n    const t = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", marker, "');\n    const img = (t && t.image) || '';\n    if (t) { try { gBrowser.removeTab(t); } catch {} }\n    return img;"));
}

export const tests = [{name: "about:gjoa shows the gjoa sailboat favicon", run: async (mn) => { await dsl.wait_for(mn, "return !!gBrowser;", 5000);
await mn.executeScript(open_js("about:gjoa", "fav-gjoa"));
await dsl.wait_for(mn, "const t = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === 'fav-gjoa'); return !!(t && t.image && t.image.includes('gjoa.svg'));", 5000);
const img = await mn.executeScript(icon_js("fav-gjoa"));
if ((!((_truthy) => _truthy !== false && _truthy != null)(img.includes("gjoa.svg")))) {
  return (() => { throw new Error(("".concat("about:gjoa tab icon should be chrome://gjoa/content/gjoa.svg, got: ", img))); })();
} }}, {name: "the gjoa new-tab page shows the sailboat favicon", run: async (mn) => { await dsl.wait_for(mn, "return !!gBrowser;", 5000);
await mn.executeScript(open_js("about:newtab", "fav-newtab"));
await dsl.wait_for(mn, "const t = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === 'fav-newtab'); return !!(t && t.image && t.image.includes('gjoa.svg'));", 5000);
const img = await mn.executeScript(icon_js("fav-newtab"));
if ((!((_truthy) => _truthy !== false && _truthy != null)(img.includes("gjoa.svg")))) {
  return (() => { throw new Error(("".concat("new-tab tab icon should be chrome://gjoa/content/gjoa.svg, got: ", img))); })();
} }}];

export default tests;
