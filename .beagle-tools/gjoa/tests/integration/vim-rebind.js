import { wait_for, sleep } from '../dsl.js';

const setup_js = "\n  const tab = gBrowser.addTab('about:blank', {\n    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),\n  });\n  gBrowser.selectedTab = tab;\n  Services.prefs.setBoolPref('gjoa.keys.useLeader', false);\n  Services.prefs.setStringPref('gjoa.keys.bindings', JSON.stringify({ q: 'tabsPicker', t: null }));\n  try { gBrowser.selectedBrowser.focus(); } catch (e) {}\n  return 1;\n";

const cleanup_js = "Services.prefs.clearUserPref('gjoa.keys.bindings'); return 1;";

const pickerOpen_js = "const p=document.getElementById('gjoa-picker'); return !!((p && !p.hidden) || document.querySelector('.gjoa-search-input'));";

const closePicker_js = "try{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));}catch(e){} try{const p=document.getElementById('gjoa-picker'); if(p) p.hidden=true; const s=document.querySelector('.gjoa-search-input'); if(s) s.remove();}catch(e){} return 1;";

function key_action(ch) {
  return [{type: "key", id: "kbd", actions: [{type: "keyDown", value: ch}, {type: "keyUp", value: ch}]}];
}

export const tests = [{name: "vim keymap: gjoa.keys.bindings remaps + unbinds keys live", run: async (mn) => { await dsl.wait_for(mn, "return !!document.querySelector(\"#gjoa-tab-panel\");", 10000);
await dsl.wait_for(mn, "return !!(window.gjoaTest && window.gjoaTest.vim);", 10000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(setup_js)))) {
  (() => { throw new Error("setup failed"); })();
}
await dsl.wait_for(mn, "return Services.prefs.getStringPref('gjoa.keys.bindings','') === JSON.stringify({ q: 'tabsPicker', t: null }) && gBrowser.selectedBrowser.currentURI.spec === 'about:blank';");
await mn.executeScript(closePicker_js);
await mn.performActions(key_action("t"));
await sleep(1000);
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(pickerOpen_js))))) {
  (() => { throw new Error("unbound key 't' still opened the tabs picker (override null not honored)"); })();
}
await mn.performActions(key_action("q"));
await dsl.wait_for(mn, pickerOpen_js, 4000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(pickerOpen_js)))) {
  (() => { throw new Error("rebound key 'q'->tabsPicker did not open the picker (override remap not honored)"); })();
}
return await mn.executeScript(cleanup_js); }}];

export default tests;
