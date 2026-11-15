import { wait_for } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const buttonsCheck = "\n  const want = {\n    'back-button': 'back', 'forward-button': 'forward', 'stop-reload-button': 'refresh',\n    'urlbar-container': 'urlbar', 'gjoa-sidebar-button|sidebar-button': 'sidebar',\n    'unified-extensions-button': 'extensions', 'PanelUI-button': 'hamburger'\n  };\n  const win = window;\n  const missing = [];\n  const visible = (e) => {\n    if (!e) return false;\n    const cs = win.getComputedStyle(e);\n    return cs.display !== 'none' && cs.visibility !== 'hidden' &&\n           e.getBoundingClientRect().width >= 1;\n  };\n  for (const key of Object.keys(want)) {\n    const ids = key.split('|');\n    if (ids.some(id => visible(document.getElementById(id)))) continue;\n    const why = ids.map(id => {\n      const e = document.getElementById(id);\n      if (!e) return '#' + id + ' ABSENT';\n      const cs = win.getComputedStyle(e);\n      return '#' + id + ' hidden display=' + cs.display +\n             ' w=' + Math.round(e.getBoundingClientRect().width);\n    }).join(' / ');\n    missing.push(want[key] + ' (' + why + ')');\n  }\n  return { horizontal: document.documentElement.hasAttribute('gjoa-horizontal-tabs'), missing: missing };\n";

function assert_full_toolbar(r, ctx) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(r.horizontal))) {
    (() => { throw new Error(("".concat(ctx, ": not in horizontal mode (gjoa-horizontal-tabs unset)"))); })();
  }
  if ((!($$bc$equiv(0, r.missing.length)))) {
    return (() => { throw new Error(("".concat(ctx, ": horizontal toolbar is missing expected icons: ", JSON.stringify(r.missing), ". ", "Expected left→right: back forward refresh urlbar sidebar extensions hamburger."))); })();
  }
}

const tests = [{name: "horizontal nav-bar keeps back/forward/refresh/urlbar/sidebar/ext/hamburger", run: async (mn) => { await mn.executeScript("Services.prefs.setBoolPref('gjoa.layout.dynamicOrientation', false); Services.prefs.setBoolPref('sidebar.verticalTabs', false); return true;");
await dsl.wait_for(mn, "return document.documentElement.hasAttribute('gjoa-horizontal-tabs');", 4000);
return assert_full_toolbar(await mn.executeScript(buttonsCheck), "fresh-horizontal"); }}, {name: "sidebar-button menu shows Hide/Show Strip only in horizontal mode", run: async (mn) => { await mn.executeScript("Services.prefs.setBoolPref('gjoa.layout.dynamicOrientation', false); Services.prefs.setBoolPref('sidebar.verticalTabs', true); return true;");
await dsl.wait_for(mn, "return !document.documentElement.hasAttribute('gjoa-horizontal-tabs');", 4000);
const r1 = await mn.executeScript("const m = document.getElementById('gjoa-sidebar-button-menu'); m.dispatchEvent(new Event('popupshowing')); const s = document.getElementById('gjoa-toggle-strip'); return { hidden: s.hidden };");
if ((!((_truthy) => _truthy !== false && _truthy != null)(r1.hidden))) {
  (() => { throw new Error("strip menu item should be hidden in vertical mode"); })();
}
await mn.executeScript("Services.prefs.setBoolPref('sidebar.verticalTabs', false); Services.prefs.setBoolPref('gjoa.layout.horizontalSidebarStrip', false); return true;");
await dsl.wait_for(mn, "return document.documentElement.hasAttribute('gjoa-horizontal-tabs');", 4000);
const r2 = await mn.executeScript("const m = document.getElementById('gjoa-sidebar-button-menu'); m.dispatchEvent(new Event('popupshowing')); const s = document.getElementById('gjoa-toggle-strip'); return { hidden: s.hidden, label: s.getAttribute('label') };");
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(r2.hidden)))) {
  (() => { throw new Error("strip menu item should be visible in horizontal mode"); })();
}
const __a____scope__4__3__1__4__8__3__1__0 = r2.label;
const __e____scope__4__3__1__4__8__3__1__3 = "Show Strip";
if ((!($$bc$equiv(__a____scope__4__3__1__4__8__3__1__0, __e____scope__4__3__1__4__8__3__1__3)))) {
  (() => { throw new Error(("".concat("label should read Show Strip when the strip pref is off", " — expected ", __e____scope__4__3__1__4__8__3__1__3, ", got ", __a____scope__4__3__1__4__8__3__1__0))); })();
}
await mn.executeScript("Services.prefs.setBoolPref('gjoa.layout.horizontalSidebarStrip', true); return true;");
const r3 = await mn.executeScript("const m = document.getElementById('gjoa-sidebar-button-menu'); m.dispatchEvent(new Event('popupshowing')); const s = document.getElementById('gjoa-toggle-strip'); return { label: s.getAttribute('label') };");
const __a____scope__4__3__1__4__10__2__1__0 = r3.label;
const __e____scope__4__3__1__4__10__2__1__3 = "Hide Strip";
if ((!($$bc$equiv(__a____scope__4__3__1__4__10__2__1__0, __e____scope__4__3__1__4__10__2__1__3)))) {
  (() => { throw new Error(("".concat("label should read Hide Strip when the strip pref is on", " — expected ", __e____scope__4__3__1__4__10__2__1__3, ", got ", __a____scope__4__3__1__4__10__2__1__0))); })();
}
return await mn.executeScript("Services.prefs.setBoolPref('sidebar.verticalTabs', true); Services.prefs.clearUserPref('gjoa.layout.horizontalSidebarStrip'); Services.prefs.clearUserPref('gjoa.layout.dynamicOrientation'); return true;"); }}, {name: "strip-hide button is horizontal-only and hides the strip on click", run: async (mn) => { await mn.executeScript("Services.prefs.setBoolPref('gjoa.layout.dynamicOrientation', false); Services.prefs.setBoolPref('sidebar.verticalTabs', true); return true;");
await dsl.wait_for(mn, "return !document.documentElement.hasAttribute('gjoa-horizontal-tabs');", 4000);
const r = await mn.executeScript("const b = document.getElementById('gjoa-strip-hide-button'); return { display: getComputedStyle(b).display };");
const __a____scope__4__3__2__4__5__2__1__0 = r.display;
const __e____scope__4__3__2__4__5__2__1__3 = "none";
if ((!($$bc$equiv(__a____scope__4__3__2__4__5__2__1__0, __e____scope__4__3__2__4__5__2__1__3)))) {
  (() => { throw new Error(("".concat("strip-hide button should be display:none in vertical mode", " — expected ", __e____scope__4__3__2__4__5__2__1__3, ", got ", __a____scope__4__3__2__4__5__2__1__0))); })();
}
await mn.executeScript("Services.prefs.setBoolPref('sidebar.verticalTabs', false); Services.prefs.setBoolPref('gjoa.layout.horizontalSidebarStrip', true); return true;");
await dsl.wait_for(mn, "return document.documentElement.hasAttribute('gjoa-horizontal-tabs');", 4000);
await dsl.wait_for(mn, "return getComputedStyle(document.getElementById('gjoa-strip-hide-button')).display !== 'none';", 4000);
await mn.executeScript("document.getElementById('gjoa-strip-hide-button').dispatchEvent(new MouseEvent('click', {bubbles: true})); return true;");
await dsl.wait_for(mn, "return Services.prefs.getBoolPref('gjoa.layout.horizontalSidebarStrip') === false;", 4000);
return await mn.executeScript("Services.prefs.setBoolPref('sidebar.verticalTabs', true); Services.prefs.clearUserPref('gjoa.layout.horizontalSidebarStrip'); Services.prefs.clearUserPref('gjoa.layout.dynamicOrientation'); return true;"); }}, {name: "horizontal toolbar survives a vertical→horizontal flip", run: async (mn) => { await mn.executeScript("Services.prefs.setBoolPref('gjoa.layout.dynamicOrientation', false); Services.prefs.setBoolPref('sidebar.verticalTabs', true); return true;");
await dsl.wait_for(mn, "return !document.documentElement.hasAttribute('gjoa-horizontal-tabs');", 4000);
await mn.executeScript("Services.prefs.setBoolPref('sidebar.verticalTabs', false); return true;");
await dsl.wait_for(mn, "return document.documentElement.hasAttribute('gjoa-horizontal-tabs');", 4000);
assert_full_toolbar(await mn.executeScript(buttonsCheck), "after-flip");
return await mn.executeScript("Services.prefs.setBoolPref('sidebar.verticalTabs', true); Services.prefs.clearUserPref('gjoa.layout.dynamicOrientation'); return true;"); }}];

export default tests;
