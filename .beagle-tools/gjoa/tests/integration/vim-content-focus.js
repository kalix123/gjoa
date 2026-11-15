import { wait_for, sleep } from '../dsl.js';

const open_input_page_js = "\n  const html = '<!DOCTYPE html><body style=\"height:3000px\"><input id=i autofocus style=\"position:fixed;top:0;left:0\"></body>';\n  const t = gBrowser.addTab('data:text/html,' + encodeURIComponent(html), {\n    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),\n  });\n  gBrowser.selectedTab = t;\n  Services.prefs.setBoolPref('gjoa.keys.useLeader', false);\n  return 1;\n";

const open_plain_page_js = "\n  const t = gBrowser.addTab('data:text/html,' + encodeURIComponent('<!DOCTYPE html><body style=\"height:3000px\">hello world</body>'), {\n    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),\n  });\n  gBrowser.selectedTab = t;\n  try { gBrowser.selectedBrowser.focus(); } catch (e) {}\n  return 1;\n";

const on_data_js = "return gBrowser.selectedBrowser.currentURI.spec.startsWith('data:');";

const editable_js = "return gBrowser.selectedBrowser._gjoaEditable === true;";

const pickerOpen_js = "const p=document.getElementById('gjoa-picker'); return !!((p && !p.hidden) || document.querySelector('.gjoa-search-input'));";

const closePicker_js = "try{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));}catch(e){} try{const p=document.getElementById('gjoa-picker'); if(p) p.hidden=true; const s=document.querySelector('.gjoa-search-input'); if(s) s.remove();}catch(e){} return 1;";

function key_action(ch) {
  return [{type: "key", id: "kbd", actions: [{type: "keyDown", value: ch}, {type: "keyUp", value: ch}]}];
}

export const tests = [{name: "GjoaInput actor: content-page editable focus makes vim yield", run: async (mn) => { await dsl.wait_for(mn, "return !!document.querySelector(\"#gjoa-tab-panel\");", 10000);
await sleep(400);
await mn.executeScript(open_input_page_js);
await dsl.wait_for(mn, on_data_js, 8000);
await dsl.wait_for(mn, editable_js, 5000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(editable_js)))) {
  (() => { throw new Error("GjoaInput actor did not report editable focus for an autofocused content input (actor not loaded / not reporting)"); })();
}
await mn.executeScript(closePicker_js);
await mn.performActions(key_action("t"));
await sleep(1000);
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(pickerOpen_js))))) {
  (() => { throw new Error("vim 't' opened a picker while a content input was focused — actor focus detection failed"); })();
}
await mn.executeScript(open_plain_page_js);
await dsl.wait_for(mn, on_data_js, 8000);
await sleep(600);
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(editable_js))))) {
  (() => { throw new Error("actor wrongly reports editable on a page with no focused input"); })();
}
await mn.performActions(key_action("t"));
await dsl.wait_for(mn, pickerOpen_js, 4000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(pickerOpen_js)))) {
  return (() => { throw new Error("vim 't' did not open the picker on a plain content page (vim wrongly inert)"); })();
} }}];

export default tests;
