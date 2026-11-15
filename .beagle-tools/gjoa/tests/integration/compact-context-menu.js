import { wait_for, sleep } from '../dsl.js';

const ENABLE_COMPACT = "\n  Services.prefs.setBoolPref('sidebar.verticalTabs', true);\n  Services.prefs.setBoolPref('gjoa.sidebar.compact', true);\n  return true;\n";

const OPEN_MENU_AND_LEAVE = "\n  const XUL='http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';\n  const sb=document.getElementById('sidebar-container');\n  if(!sb) return {error:'no sidebar-main'};\n  sb.setAttribute('gjoa-has-hover','true');\n  let m=document.getElementById('gjoa-test-ctxmenu');\n  if(!m){ m=document.createElementNS(XUL,'menupopup'); m.id='gjoa-test-ctxmenu'; document.documentElement.appendChild(m); }\n  m.setAttribute('state','showing');\n  sb.dispatchEvent(new MouseEvent('mouseleave',{relatedTarget:document.body}));\n  return { menuLive: !!document.querySelector(\"menupopup[state='showing'],menupopup[state='open']\") };\n";

const CLOSE_MENU_AND_LEAVE = "\n  const sb=document.getElementById('sidebar-container');\n  const m=document.getElementById('gjoa-test-ctxmenu');\n  if(m) m.setAttribute('state','closed');\n  sb.dispatchEvent(new MouseEvent('mouseleave',{relatedTarget:document.body}));\n  return true;\n";

const DISABLE_COMPACT = "\n  Services.prefs.clearUserPref('gjoa.sidebar.compact');\n  return true;\n";

const HAS_HOVER = "return document.getElementById('sidebar-container').hasAttribute('gjoa-has-hover');";

const PIN_THEN_MENU_AND_LEAVE = "\n  const XUL='http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';\n  const sb=document.getElementById('sidebar-container');\n  if(!sb) return {error:'no sidebar-main'};\n  sb.setAttribute('gjoa-has-hover','true');\n  sb.setAttribute('gjoa-pinned','true');\n  let m=document.getElementById('gjoa-test-ctxmenu');\n  if(!m){ m=document.createElementNS(XUL,'menupopup'); m.id='gjoa-test-ctxmenu'; document.documentElement.appendChild(m); }\n  m.setAttribute('state','showing');\n  const pinnedBefore = sb.hasAttribute('gjoa-pinned');\n  sb.dispatchEvent(new MouseEvent('mouseleave',{relatedTarget:document.body}));\n  return { menuLive: !!document.querySelector(\"menupopup[state='showing'],menupopup[state='open']\"),\n           pinnedBefore, pinnedAfter: sb.hasAttribute('gjoa-pinned'),\n           hasHover: sb.hasAttribute('gjoa-has-hover') };\n";

export const tests = [{name: "compact — sidebar stays expanded while a context menu is open (#88)", run: async (mn) => { await await mn.executeScript(ENABLE_COMPACT);
await await dsl.wait_for(mn, "return !!document.querySelector('#sidebar-container[data-gjoa-compact]');", 4000);
const r = await await mn.executeScript(OPEN_MENU_AND_LEAVE);
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.menuLive))) {
  (() => { throw new Error("precondition: a live menupopup[state=showing] should exist"); })();
}
await sleep(400);
const held = await await mn.executeScript(HAS_HOVER);
if ((!held)) {
  (() => { throw new Error("sidebar collapsed while a context menu was open"); })();
}
await await mn.executeScript(CLOSE_MENU_AND_LEAVE);
await await dsl.wait_for(mn, "return !document.getElementById('sidebar-container').hasAttribute('gjoa-has-hover');", 3000);
await await mn.executeScript(DISABLE_COMPACT);
return await await dsl.wait_for(mn, "return !document.querySelector('#sidebar-container[data-gjoa-compact]');", 4000); }}, {name: "compact — an `e`-pinned drawer survives a context menu opening", run: async (mn) => { await await mn.executeScript(ENABLE_COMPACT);
await await dsl.wait_for(mn, "return !!document.querySelector('#sidebar-container[data-gjoa-compact]');", 4000);
const r = await await mn.executeScript(PIN_THEN_MENU_AND_LEAVE);
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.menuLive))) {
  (() => { throw new Error("precondition: a live menupopup[state=showing] should exist"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.pinnedBefore))) {
  (() => { throw new Error("precondition: [gjoa-pinned] should be set before the leave"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.pinnedAfter))) {
  (() => { throw new Error(("".concat("[gjoa-pinned] was stripped by mouseleave while a ", "context menu was open — the compact drawer dismisses on right-click. ", JSON.stringify(r)))); })();
}
await await mn.executeScript(CLOSE_MENU_AND_LEAVE);
await await dsl.wait_for(mn, ("".concat("const sb = document.getElementById('sidebar-container');", "return !sb.hasAttribute('gjoa-pinned') && !sb.hasAttribute('gjoa-has-hover');")), 3000);
await await mn.executeScript(DISABLE_COMPACT);
return await await dsl.wait_for(mn, "return !document.querySelector('#sidebar-container[data-gjoa-compact]');", 4000); }}];

export default tests;
