import { wait_for, sleep } from '../dsl.js';

const open_gjoa_js = "\n  const tab = gBrowser.addTab('about:gjoa', {\n    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),\n  });\n  gBrowser.selectedTab = tab;\n  Services.prefs.setBoolPref('gjoa.keys.useLeader', false);\n  return 1;\n";

const on_gjoa_js = "return gBrowser.selectedBrowser.currentURI.spec.startsWith('about:gjoa')\n       && !!gBrowser.selectedBrowser.contentDocument\n       && !!gBrowser.selectedBrowser.contentDocument.body;";

const focus_neutral_js = "\n  const doc = gBrowser.selectedBrowser.contentDocument;\n  try { const old = doc.getElementById('gjoa-test-input'); if (old) old.remove(); } catch(e){}\n  try { if (doc.activeElement && doc.activeElement.blur) doc.activeElement.blur(); } catch(e){}\n  gBrowser.selectedBrowser.focus();\n  return 1;\n";

const focus_input_js = "\n  const doc = gBrowser.selectedBrowser.contentDocument;\n  let inp = doc.getElementById('gjoa-test-input');\n  if (!inp) { inp = doc.createElement('input'); inp.type='text'; inp.id='gjoa-test-input'; doc.body.appendChild(inp); }\n  inp.focus();\n  return doc.activeElement === inp;\n";

const pickerOpen_js = "const p=document.getElementById('gjoa-picker'); return !!((p && !p.hidden) || document.querySelector('.gjoa-search-input'));";

const closePicker_js = "try{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));}catch(e){} try{const p=document.getElementById('gjoa-picker'); if(p) p.hidden=true; const s=document.querySelector('.gjoa-search-input'); if(s) s.remove();}catch(e){} return 1;";

function key_action(ch) {
  return [{type: "key", id: "kbd", actions: [{type: "keyDown", value: ch}, {type: "keyUp", value: ch}]}];
}

export const tests = [{name: "vim is live on about:gjoa but yields to its form fields", run: async (mn) => { await dsl.wait_for(mn, "return !!document.querySelector(\"#gjoa-tab-panel\");", 10000);
await dsl.wait_for(mn, "return !!(gBrowser && gBrowser.selectedTab && gBrowser.selectedBrowser);");
await mn.executeScript(open_gjoa_js);
await dsl.wait_for(mn, on_gjoa_js, 8000);
await dsl.wait_for(mn, "return gBrowser.selectedBrowser.contentDocument.readyState === 'complete';", 8000);
await mn.executeScript(closePicker_js);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(focus_input_js)))) {
  (() => { throw new Error("could not focus an injected input in the about:gjoa document"); })();
}
await mn.performActions(key_action("t"));
await sleep(1000);
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(pickerOpen_js))))) {
  (() => { throw new Error("vim 't' opened a picker while a form field was focused on about:gjoa — state manager failed to detect editing (typing would be eaten)"); })();
}
await mn.executeScript(focus_neutral_js);
await mn.performActions(key_action("t"));
await dsl.wait_for(mn, pickerOpen_js, 4000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(pickerOpen_js)))) {
  return (() => { throw new Error("vim 't' did NOT open the picker on about:gjoa — vim is wrongly inert on an about page (must not bail)"); })();
} }}];

export default tests;
