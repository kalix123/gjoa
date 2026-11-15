import { wait_for } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const ENSURE_EXPANDED_WIDE = "\n  Services.prefs.setBoolPref('sidebar.verticalTabs', true);\n  Services.prefs.setBoolPref('sidebar.revamp', true);\n  Services.prefs.setIntPref('gjoa.sidebar.width', 320);\n  const sm = document.getElementById('sidebar-container');\n  if (sm && !sm.hasAttribute('sidebar-launcher-expanded')) {\n    sm.setAttribute('sidebar-launcher-expanded', '');\n  }\n  return { hasSidebarMain: !!sm,\n           hasToolbar: !!document.getElementById('gjoa-urlbar-toolbar'),\n           hasGjoaTest: !!window.gjoaTest };\n";

const DRIVE_COLLAPSE = "\n  const sm = document.getElementById('sidebar-container');\n  if (!sm) return false;\n  sm.removeAttribute('sidebar-launcher-expanded');\n  return true;\n";

const DRIVE_EXPAND = "\n  const sm = document.getElementById('sidebar-container');\n  if (!sm) return false;\n  sm.setAttribute('sidebar-launcher-expanded', '');\n  return true;\n";

const MEASURE_SIDEBAR = "\n  const sm = document.getElementById('sidebar-container');\n  if (!sm) return { error: 'no #sidebar-container' };\n  const r = sm.getBoundingClientRect();\n  return {\n    width: r.width,\n    inlineWidth: sm.style.width,          // '' when removeProperty cleared it\n    hasInlineWidth: sm.style.width !== '',\n    expandedAttr: sm.hasAttribute('sidebar-launcher-expanded'),\n  };\n";

const FOOTER_BTN_JS = "\n  const sideMain = document.querySelector('#sidebar-container sidebar-main');\n  const root = sideMain ? (sideMain.shadowRoot || sideMain) : null;\n  const hs = (root ? Array.from(root.querySelectorAll('moz-button')) : [])\n    .map(b => b.getBoundingClientRect().height).filter(h => h > 0);\n  const footerBtnHeight = hs.length ? Math.max(...hs) : null;\n";

const MEASURE_RAIL_RHYTHM = ("".concat("\n  const panel = document.getElementById('gjoa-tab-panel');\n  if (!panel || !panel.hasAttribute('gjoa-icons-only')) return { error: 'not icons-only' };\n  const panelTop = panel.getBoundingClientRect().top;\n  const rows = Array.from(panel.querySelectorAll('.gjoa-tab-row:not([hidden])'));\n  if (rows.length < 2) return { error: 'need >=2 tabs to measure spacing' };\n  const r0 = rows[0].getBoundingClientRect();\n  const r1 = rows[1].getBoundingClientRect();\n  const glyphOf = (el) => {\n    for (const c of el.querySelectorAll('img, image, .gjoa-favicon, .button-icon')) {\n      const r = c.getBoundingClientRect();\n      if (r.width > 0 && r.height > 0) return r;\n    }\n    return null;\n  };\n", FOOTER_BTN_JS, "\n  const byTop = (a, b) => a.top - b.top;\n  const tabGlyphs = rows.map(glyphOf).filter(Boolean).sort(byTop);\n  const toolGlyphs = (root ? Array.from(root.querySelectorAll('moz-button')) : [])\n    .filter(b => b.getBoundingClientRect().height > 0)\n    .map(b => b.shadowRoot && b.shadowRoot.querySelector('img'))\n    .filter(Boolean).map(i => i.getBoundingClientRect())\n    .filter(r => r.height > 0).sort(byTop);\n  const gapsOf = (rs) => rs.slice(1).map((r, i) => Math.round((r.top - rs[i].bottom) * 10) / 10);\n  const tabGaps = gapsOf(tabGlyphs);\n  const toolGaps = gapsOf(toolGlyphs);\n  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;\n  return {\n    firstTabOffset: r0.top - panelTop,\n    interTabGap: r1.top - r0.bottom,\n    tabRowHeight: r0.height,\n    rowPitch: r1.top - r0.top,\n    footerBtnHeight,\n    tabGaps, toolGaps,\n    tabGapSpread: tabGaps.length ? Math.max(...tabGaps) - Math.min(...tabGaps) : null,\n    toolGapSpread: toolGaps.length ? Math.max(...toolGaps) - Math.min(...toolGaps) : null,\n    clusterGapDelta: (tabGaps.length && toolGaps.length)\n      ? Math.abs(mean(tabGaps) - mean(toolGaps)) : null,\n  };\n"));

const MEASURE_FOOTER_BTN = ("".concat(FOOTER_BTN_JS, " return { footerBtnHeight };"));

export const tests = [{name: "sidebar — collapse narrows to favicon strip (no inline width pins it wide); expand restores (#833c5b9)", run: async (mn) => { const pre = await mn.executeScript(ENSURE_EXPANDED_WIDE);
if ((!((_truthy) => _truthy !== false && _truthy != null)(pre.hasSidebarMain))) {
  (() => { throw new Error("no #sidebar-container — not a gjoa chrome window"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? pre.hasGjoaTest : _logical))(pre.hasToolbar)))) {
  (() => { throw new Error(("".concat("gjoa drawer chrome did not initialize (#gjoa-urlbar-toolbar / ", "window.gjoaTest missing) — e.g. GjoaLoader $$bc-runtime mismatch in a ", "stale binary. Rebuild the bundle/binary; this test needs live gjoa ", "chrome to exercise expand/collapse. ", JSON.stringify(pre)))); })();
}
await await dsl.wait_for(mn, ("".concat("const sm = document.getElementById('sidebar-container');", "if (!sm) return false;", "return sm.hasAttribute('sidebar-launcher-expanded') &&", "       sm.getBoundingClientRect().width > 200;")), 5000);
const exp = await mn.executeScript(MEASURE_SIDEBAR);
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(exp.error)))) {
  (() => { throw new Error(("".concat("MEASURE-SIDEBAR (expanded) error: ", JSON.stringify(exp)))); })();
}
if ((!(Number(exp.width) > 200))) {
  (() => { throw new Error(("".concat("expanded sidebar not wide — width ", Number(exp.width).toFixed(1), "px (expected > 200; expand() should pin the 320px persisted width). ", JSON.stringify(exp)))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(exp.hasInlineWidth))) {
  (() => { throw new Error(("".concat("expand() did not pin an inline width on #sidebar-container — the ", "expanded-width contract is missing (collapse would have nothing ", "to clear). ", JSON.stringify(exp)))); })();
}
await mn.executeScript(DRIVE_COLLAPSE);
await await dsl.wait_for(mn, ("".concat("const sm = document.getElementById('sidebar-container');", "if (!sm || sm.hasAttribute('sidebar-launcher-expanded')) return false;", "const w = sm.getBoundingClientRect().width;", "return w > 0 && w < 80 && sm.style.width === '';")), 5000);
const col = await mn.executeScript(MEASURE_SIDEBAR);
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(col.error)))) {
  (() => { throw new Error(("".concat("MEASURE-SIDEBAR (collapsed) error: ", JSON.stringify(col)))); })();
}
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(col.expandedAttr)))) {
  (() => { throw new Error(("".concat("sidebar still has [sidebar-launcher-expanded] after collapse — measured ", "the wrong state. ", JSON.stringify(col)))); })();
}
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(col.hasInlineWidth)))) {
  (() => { throw new Error(("".concat("collapsed #sidebar-container STILL has an inline width style ('", col.inlineWidth, "') — collapse() did not removeProperty('width'); ", "this inline width pins the strip wide. ", JSON.stringify(col)))); })();
}
if ((!(Number(col.width) < 80))) {
  (() => { throw new Error(("".concat("collapsed sidebar did not narrow to the favicon strip — width ", Number(col.width).toFixed(1), "px (expected < 80px). ", JSON.stringify(col)))); })();
}
await mn.executeScript("\n        const p = Services.scriptSecurityManager.getSystemPrincipal();\n        const t = gBrowser.addTab('about:blank', { triggeringPrincipal: p });\n        t.setAttribute('gjoa-test-marker', 'rail-rhythm');\n        window.gjoaTest.rows.scheduleTreeResync();\n        window.gjoaTest.rows.updateVisibility();\n        return true;");
await dsl.wait_for(mn, "return document.querySelectorAll('#gjoa-tab-panel .gjoa-tab-row').length >= 2;", 3000);
const rhythm = await mn.executeScript(MEASURE_RAIL_RHYTHM);
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(rhythm.error)))) {
  (() => { throw new Error(("".concat("MEASURE-RAIL-RHYTHM error: ", JSON.stringify(rhythm)))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(((Number(rhythm.firstTabOffset) >= 10) && (Number(rhythm.firstTabOffset) <= 14))))) {
  (() => { throw new Error(("".concat("first-tab top offset must sit in the 10–14px band (10px container padding ", "+ 2px row margin) — below it the first favicon reads as jammed against the ", "panel edge. ", JSON.stringify(rhythm)))); })();
}
if ((!(Number(rhythm.rowPitch) <= 28))) {
  (() => { throw new Error(("".concat("collapsed row pitch must be <= 28px (24px row + 2x2px margin) — ", JSON.stringify(rhythm)))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(((rhythm.tabGaps.length > 0) && (rhythm.toolGaps.length > 0))))) {
  (() => { throw new Error(("".concat("rhythm probe found no adjacent icon pair to measure in one of the clusters ", "— the uniformity assertion below would pass vacuously. ", JSON.stringify(rhythm)))); })();
}
if ((!(Number(rhythm.tabGapSpread) <= 3))) {
  (() => { throw new Error(("".concat("tab-cluster icon gaps are not uniform (spread ", rhythm.tabGapSpread, "px > 3px): ", JSON.stringify(rhythm.tabGaps)))); })();
}
if ((!(Number(rhythm.toolGapSpread) <= 3))) {
  (() => { throw new Error(("".concat("tool-cluster icon gaps are not uniform (spread ", rhythm.toolGapSpread, "px > 3px): ", JSON.stringify(rhythm.toolGaps)))); })();
}
if ((!(Number(rhythm.clusterGapDelta) <= 3))) {
  (() => { throw new Error(("".concat("the two clusters run different rhythms (delta ", rhythm.clusterGapDelta, "px > 3px) — tabs ", JSON.stringify(rhythm.tabGaps), " vs tools ", JSON.stringify(rhythm.toolGaps), ". The collapsed rail must read as one ", "beat top to bottom; --tab-min-height and --button-min-height both size the ", "tool box, so they must equal the tab-row box. ", JSON.stringify(rhythm)))); })();
}
await mn.executeScript("\n          const t = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === 'rail-rhythm');\n          if (t) { try { gBrowser.removeTab(t); } catch {} }\n          return true;");
await mn.executeScript(DRIVE_EXPAND);
await await dsl.wait_for(mn, ("".concat("const sm = document.getElementById('sidebar-container');", "if (!sm || !sm.hasAttribute('sidebar-launcher-expanded')) return false;", "return sm.style.width !== '' && sm.getBoundingClientRect().width > 200;")), 5000);
const re = await mn.executeScript(MEASURE_SIDEBAR);
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(re.error)))) {
  (() => { throw new Error(("".concat("MEASURE-SIDEBAR (re-expanded) error: ", JSON.stringify(re)))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (Number(re.width) > 200) : _logical))(re.hasInlineWidth)))) {
  (() => { throw new Error(("".concat("re-expand did not restore the persisted width — width ", Number(re.width).toFixed(1), "px, inline '", re.inlineWidth, "' (expected wide + inline 320px). ", JSON.stringify(re)))); })();
}
const exp_footer = await mn.executeScript(MEASURE_FOOTER_BTN);
if ((!(!($$bc$equiv(exp_footer.footerBtnHeight, rhythm.footerBtnHeight))))) {
  return (() => { throw new Error(("".concat("expanded footer button height (", exp_footer.footerBtnHeight, ") must differ from the collapsed height (", rhythm.footerBtnHeight, ") — the collapsed-only --tab-min-height override is leaking."))); })();
} }}];

export default tests;
