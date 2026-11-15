import { wait_for } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const SETTLE = "\n  const a = document.activeElement;\n  if (window.__gjoaFocusSettle && window.__gjoaFocusSettle.el === a) {\n    return Date.now() - window.__gjoaFocusSettle.t > 400;\n  }\n  window.__gjoaFocusSettle = { el: a, t: Date.now() };\n  return false;\n";

const ENSURE_EXPANDED = "\n  Services.prefs.setBoolPref('sidebar.verticalTabs', true);\n  Services.prefs.setBoolPref('sidebar.revamp', true);\n  const sm = document.getElementById('sidebar-container');\n  if (sm && !sm.hasAttribute('sidebar-launcher-expanded')) {\n    sm.setAttribute('sidebar-launcher-expanded', '');\n  }\n  return !!document.getElementById('urlbar');\n";

const SETUP = "\n  gURLBar.value = 'gjoa.test/init-focus';\n  try { if (document.activeElement) document.activeElement.blur(); } catch (e) {}\n  gURLBar.blur();\n  const r = gURLBar.inputField.getBoundingClientRect();\n  return JSON.stringify({ x: Math.round(r.left + r.width / 2),\n                          y: Math.round(r.top + r.height / 2) });\n";

function arm_js(off) {
  return ("".concat("\n  const sm = document.getElementById('sidebar-container');\n  const inp = gURLBar.inputField;\n  window.__gjoaInitFocus = { done: false,\n    start: inp.selectionStart, end: inp.selectionEnd,\n    active: document.activeElement === inp };\n  setTimeout(() => {\n    sm.removeAttribute('sidebar-launcher-expanded');\n    setTimeout(() => {\n      sm.setAttribute('sidebar-launcher-expanded', '');\n      setTimeout(() => { window.__gjoaInitFocus.done = true; }, 60);\n    }, 40);\n  }, ", off, ");\n  return JSON.stringify(window.__gjoaInitFocus);\n"));
}

const READ = "\n  const inp = gURLBar.inputField;\n  const armed = window.__gjoaInitFocus;\n  return JSON.stringify({\n    isInput: document.activeElement === inp,\n    activeId: document.activeElement ? (document.activeElement.id ||\n              document.activeElement.localName) : null,\n    start: inp.selectionStart, end: inp.selectionEnd,\n    armedStart: armed.start, armedEnd: armed.end, armedActive: armed.active,\n    toolbar: !!document.getElementById('gjoa-urlbar-toolbar'),\n  });\n";

const CONTENT_POINT = "\n  const r = gBrowser.selectedBrowser.getBoundingClientRect();\n  return JSON.stringify({ x: Math.round(r.left + r.width / 2),\n                          y: Math.round(r.top + r.height / 2) });\n";

const FOUR_FRAMES = "\n  window.__gjoaFrames = 0;\n  const tick = () => { window.__gjoaFrames++;\n    if (window.__gjoaFrames < 4) requestAnimationFrame(tick); };\n  requestAnimationFrame(tick);\n  return 1;\n";

const CTRL = String.fromCharCode(57353);

function click_actions(x, y) {
  return [{type: "pointer", id: "m", parameters: {pointerType: "mouse"}, actions: [{type: "pointerMove", duration: 0, origin: "viewport", x: x, y: y}, {type: "pointerDown", button: 0}, {type: "pause", duration: 20}, {type: "pointerUp", button: 0}]}];
}

const ctrl_l_actions = [{type: "key", id: "kbd", actions: [{type: "keyDown", value: CTRL}, {type: "keyDown", value: "l"}, {type: "keyUp", value: "l"}, {type: "keyUp", value: CTRL}]}];

const VECTORS = ["native", "click", "ctrl-l"];

const OFFSETS = [0, 16, 48, 140];

export const tests = [{name: "urlbar activation survives the drawer reparent — every vector, swept across the surgery", run: async (mn) => { await dsl.wait_for(mn, "return !!document.getElementById('urlbar');", 5000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(ENSURE_EXPANDED)))) {
  (() => { throw new Error("no #urlbar in this window"); })();
}
await dsl.wait_for(mn, "return !!document.getElementById('gjoa-urlbar-toolbar');", 3000);
await dsl.wait_for(mn, SETTLE, 6000);
for (const vector of VECTORS) {
  await (async () => { for (const off of OFFSETS) {
  const pt = JSON.parse(await mn.executeScript(SETUP));
  if (($$bc$equiv(vector, "native"))) {
    await mn.executeScript("gURLBar.focus(); gURLBar.select(); return 1;");
  } else if (($$bc$equiv(vector, "click"))) {
    await mn.performActions(click_actions(pt.x, pt.y));
  } else {
    await mn.performActions(ctrl_l_actions);
  }
  const armed = JSON.parse(await mn.executeScript(arm_js(off)));
  if ((!((_truthy) => _truthy !== false && _truthy != null)(armed.active))) {
    (() => { throw new Error(("".concat(vector, " @", off, "ms: the activation itself never reached the urlbar input"))); })();
  }
  await dsl.wait_for(mn, "return !!(window.__gjoaInitFocus && window.__gjoaInitFocus.done);", 4000);
  const st = JSON.parse(await mn.executeScript(READ));
  if ((!((_truthy) => _truthy !== false && _truthy != null)(st.isInput))) {
    (() => { throw new Error(("".concat(vector, " @", off, "ms: the reparent took focus off the urlbar input — active=", st.activeId))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(st.start, st.armedStart)) && ($$bc$equiv(st.end, st.armedEnd)))))) {
    (() => { throw new Error(("".concat(vector, " @", off, "ms: selection lost across the reparent — armed [", st.armedStart, ",", st.armedEnd, "] became [", st.start, ",", st.end, "]"))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(st.toolbar))) {
    (() => { throw new Error(("".concat(vector, " @", off, "ms: #gjoa-urlbar-toolbar did not come back"))); })();
  }
} })();
  await mn.executeScript("document.dispatchEvent(new CustomEvent('gjoa-urlbar-deactivate')); return 1;");
  await dsl.wait_for(mn, "return !document.documentElement.hasAttribute('gjoa-urlbar-floating');", 2000);
} }}, {name: "init-window tripwire re-applies a urlbar activation that resolves elsewhere", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaFocusGuard;", 5000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(ENSURE_EXPANDED)))) {
  (() => { throw new Error("no #urlbar in this window"); })();
}
await dsl.wait_for(mn, "return !!document.getElementById('gjoa-urlbar-toolbar');", 3000);
await dsl.wait_for(mn, SETTLE, 6000);
const pt = JSON.parse(await mn.executeScript(SETUP));
const before = await mn.executeScript("\n            Services.prefs.setIntPref('gjoa.urlbar.focusRescues', 0);\n            window.gjoaFocusGuard.rearm();\n            return Services.prefs.getIntPref('gjoa.urlbar.focusRescues', 0);\n          ");
if ((!($$bc$equiv(before, 0)))) {
  (() => { throw new Error("rescue counter did not reset"); })();
}
await mn.performActions(click_actions(pt.x, pt.y));
await dsl.wait_for(mn, "return document.activeElement === gURLBar.inputField; /* click landed */", 2000);
await mn.executeScript("\n          window.__gjoaFrames = 0;\n          const tick = () => { window.__gjoaFrames++;\n            if (window.__gjoaFrames < 4) requestAnimationFrame(tick); };\n          document.getElementById('gjoa-tab-panel').focus();\n          requestAnimationFrame(tick);\n          return 1;\n        ");
await dsl.wait_for(mn, "return window.__gjoaFrames >= 4;", 2000);
const st = JSON.parse(await mn.executeScript("\n              return JSON.stringify({\n                active: document.activeElement ? (document.activeElement.id ||\n                        document.activeElement.localName) : null,\n                isInput: document.activeElement === gURLBar.inputField,\n                rescues: Services.prefs.getIntPref('gjoa.urlbar.focusRescues', 0),\n              });\n            "));
if ((!((_truthy) => _truthy !== false && _truthy != null)(st.isInput))) {
  (() => { throw new Error(("".concat("the tripwire left focus on ", st.active, " after a urlbar activation was stolen (rescues=", st.rescues, ")"))); })();
}
if ((!(st.rescues > 0))) {
  return (() => { throw new Error("focus was restored but the tripwire never counted it"); })();
} }}, {name: "tripwire hands focus over to content instead of fighting it", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaFocusGuard;", 5000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(ENSURE_EXPANDED)))) {
  (() => { throw new Error("no #urlbar in this window"); })();
}
await dsl.wait_for(mn, "return !!document.getElementById('gjoa-urlbar-toolbar');", 3000);
await dsl.wait_for(mn, SETTLE, 6000);
const pt = JSON.parse(await mn.executeScript(SETUP));
const cpt = JSON.parse(await mn.executeScript(CONTENT_POINT));
await mn.executeScript("\n          Services.prefs.setIntPref('gjoa.urlbar.focusRescues', 0);\n          window.gjoaFocusGuard.rearm();\n          return 1;\n        ");
await mn.performActions(click_actions(pt.x, pt.y));
await dsl.wait_for(mn, "return document.activeElement === gURLBar.inputField; /* click landed */", 2000);
await mn.performActions(click_actions(cpt.x, cpt.y));
await dsl.wait_for(mn, "return document.activeElement === gBrowser.selectedBrowser;", 2000);
await mn.executeScript(FOUR_FRAMES);
await dsl.wait_for(mn, "return window.__gjoaFrames >= 4;", 2000);
const st = JSON.parse(await mn.executeScript("\n              return JSON.stringify({\n                onBrowser: document.activeElement === gBrowser.selectedBrowser,\n                active: document.activeElement ? (document.activeElement.id ||\n                        document.activeElement.localName) : null,\n                rescues: Services.prefs.getIntPref('gjoa.urlbar.focusRescues', 0),\n              });\n            "));
if ((!((_truthy) => _truthy !== false && _truthy != null)(st.onBrowser))) {
  (() => { throw new Error(("".concat("the guard pulled focus back out of content after a real page click — ", "focus is on ", st.active))); })();
}
if ((!($$bc$equiv(st.rescues, 0)))) {
  return (() => { throw new Error("the guard counted a hand-off to content as a rescue"); })();
} }}, {name: "tripwire re-applies an activation a content-focus steal took, with no gesture", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaFocusGuard;", 5000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(ENSURE_EXPANDED)))) {
  (() => { throw new Error("no #urlbar in this window"); })();
}
await dsl.wait_for(mn, "return !!document.getElementById('gjoa-urlbar-toolbar');", 3000);
await dsl.wait_for(mn, SETTLE, 6000);
const pt = JSON.parse(await mn.executeScript(SETUP));
await mn.executeScript("\n          Services.prefs.setIntPref('gjoa.urlbar.focusRescues', 0);\n          window.gjoaFocusGuard.rearm();\n          return 1;\n        ");
await mn.performActions(click_actions(pt.x, pt.y));
await dsl.wait_for(mn, "return document.activeElement === gURLBar.inputField; /* click landed */", 2000);
await mn.executeScript(("".concat("gBrowser.selectedBrowser.focus();\n", FOUR_FRAMES)));
await dsl.wait_for(mn, "return window.__gjoaFrames >= 4;", 2000);
const st = JSON.parse(await mn.executeScript("\n              return JSON.stringify({\n                isInput: document.activeElement === gURLBar.inputField,\n                active: document.activeElement ? (document.activeElement.id ||\n                        document.activeElement.localName) : null,\n                rescues: Services.prefs.getIntPref('gjoa.urlbar.focusRescues', 0),\n              });\n            "));
if ((!((_truthy) => _truthy !== false && _truthy != null)(st.isInput))) {
  (() => { throw new Error(("".concat("a gesture-less content-focus steal took the caret out of the urlbar the ", "user had just aimed at, and the tripwire let it — focus is on ", st.active, " (rescues=", st.rescues, ")"))); })();
}
if ((!(st.rescues > 0))) {
  return (() => { throw new Error("focus stayed in the input but the tripwire never counted the rescue"); })();
} }}, {name: "tripwire keeps the caret when content steals it from an OPEN palette", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaFocusGuard;", 5000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(ENSURE_EXPANDED)))) {
  (() => { throw new Error("no #urlbar in this window"); })();
}
await dsl.wait_for(mn, "return !!document.getElementById('gjoa-urlbar-toolbar');", 3000);
await dsl.wait_for(mn, SETTLE, 6000);
await mn.executeScript(SETUP);
await mn.executeScript("\n        Services.prefs.setIntPref('gjoa.urlbar.focusRescues', 0);\n        window.gjoaFocusGuard.rearm();\n        return 1;\n      ");
await mn.performActions(ctrl_l_actions);
await dsl.wait_for(mn, ("".concat("const d = document.documentElement;", "return d.hasAttribute('gjoa-urlbar-floating')", " && !d.hasAttribute('gjoa-urlbar-arming')", " && document.activeElement === gURLBar.inputField;")), 3000);
await mn.executeScript("\n        window.__gjoaFrames = 0;\n        const tick = () => { window.__gjoaFrames++;\n          if (window.__gjoaFrames < 4) requestAnimationFrame(tick); };\n        gBrowser.selectedBrowser.focus();\n        requestAnimationFrame(tick);\n        return 1;\n      ");
await dsl.wait_for(mn, "return window.__gjoaFrames >= 4;", 2000);
const st = JSON.parse(await mn.executeScript("\n            return JSON.stringify({\n              active: document.activeElement ? (document.activeElement.id ||\n                      document.activeElement.localName) : null,\n              isInput: document.activeElement === gURLBar.inputField,\n              rescues: Services.prefs.getIntPref('gjoa.urlbar.focusRescues', 0),\n            });\n          "));
await mn.executeScript("document.dispatchEvent(new CustomEvent('gjoa-urlbar-deactivate')); return 1;");
await dsl.wait_for(mn, "return !document.documentElement.hasAttribute('gjoa-urlbar-floating');", 3000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(st.isInput))) {
  (() => { throw new Error(("".concat("content took the caret out of an OPEN palette and the tripwire let it — ", "focus is on ", st.active, " (rescues=", st.rescues, ")"))); })();
}
if ((!(st.rescues > 0))) {
  return (() => { throw new Error("focus stayed in the input but the tripwire never counted the rescue"); })();
} }}];

export default tests;
