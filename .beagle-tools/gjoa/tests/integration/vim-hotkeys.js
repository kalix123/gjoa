import { wait_for } from '../dsl.js';

const setup_js = "\n  // Neutral content page; focus the gjoa panel (chrome, allowed by the handler).\n  const tab = gBrowser.addTab('about:blank', {\n    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),\n  });\n  gBrowser.selectedTab = tab;\n  // Default config: leader OFF (the regressing case).\n  Services.prefs.setBoolPref('gjoa.keys.useLeader', false);\n  const panel = document.getElementById('gjoa-tab-panel');\n  if (panel) { panel.setAttribute('tabindex', '0'); panel.focus(); }\n  return !!panel;\n";

const pickerOpen_js = "return !!document.querySelector('[class*=picker], [id*=picker], .gjoa-search-input');";

const closePicker_js = "try { document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})); } catch(e){} return 1;";

function key_action(ch) {
  return [{type: "key", id: "kbd", actions: [{type: "keyDown", value: ch}, {type: "keyUp", value: ch}]}];
}

export const tests = [{name: "vim 't' (tabs) fires with leader off", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest && !!document.getElementById(\"gjoa-tab-panel\");", 10000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(setup_js)))) {
  (() => { throw new Error("no #gjoa-tab-panel to focus"); })();
}
await mn.executeScript(closePicker_js);
await mn.performActions(key_action("t"));
await dsl.wait_for(mn, pickerOpen_js, 4000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(pickerOpen_js)))) {
  return (() => { throw new Error("real 't' did not open the tabs picker (leader_key regression)"); })();
} }}, {name: "vim ':' (ex-command) fires with leader off", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest && !!document.getElementById(\"gjoa-tab-panel\");", 10000);
await mn.executeScript(setup_js);
await mn.executeScript(closePicker_js);
await mn.performActions(key_action(":"));
await dsl.wait_for(mn, pickerOpen_js, 4000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(pickerOpen_js)))) {
  return (() => { throw new Error("real ':' did not open the ex-command picker (leader_key regression)"); })();
} }}];

export default tests;
