import { wait_for } from '../dsl.js';

export const tests = [{name: "tab row has a close button that closes the tab (#97)", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest && !!document.getElementById(\"gjoa-tab-panel\");", 5000);
await mn.executeScript("\n        for (const t of [...gBrowser.tabs].filter(t => t.getAttribute && t.getAttribute('gjoa-test-marker'))) { try { gBrowser.removeTab(t); } catch {} }\n        return true;");
const stamp = ("".concat("tcb-", Date.now()));
await mn.executeScript(("".concat("\n          const p = Services.scriptSecurityManager.getSystemPrincipal();\n          const t = gBrowser.addTab('about:blank', { triggeringPrincipal: p });\n          t.setAttribute('gjoa-test-marker', '", stamp, "');\n          window.gjoaTest.rows.scheduleTreeResync();\n          window.gjoaTest.rows.updateVisibility();\n          return true;")));
await dsl.wait_for(mn, ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute('gjoa-test-marker') === '", stamp, "');")), 3000);
const has_close = await mn.executeScript(("".concat("\n              const t = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "');\n              const row = [...document.querySelectorAll('#gjoa-tab-panel .gjoa-tab-row')].find(r => r._tab === t);\n              return !!(row && row.querySelector('.gjoa-tab-close'));")));
if ((!has_close)) {
  (() => { throw new Error("tab row must carry a .gjoa-tab-close element"); })();
}
await mn.executeScript(("".concat("\n          const t = [...gBrowser.tabs].find(x => x.getAttribute('gjoa-test-marker') === '", stamp, "');\n          const row = [...document.querySelectorAll('#gjoa-tab-panel .gjoa-tab-row')].find(r => r._tab === t);\n          const x = row.querySelector('.gjoa-tab-close');\n          x.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, button:0 }));\n          return true;")));
await dsl.wait_for(mn, ("".concat("return ![...gBrowser.tabs].some(t => t.getAttribute('gjoa-test-marker') === '", stamp, "');")), 3000);
const gone = await mn.executeScript(("".concat("return ![...gBrowser.tabs].some(t => t.getAttribute('gjoa-test-marker') === '", stamp, "');")));
if ((!gone)) {
  return (() => { throw new Error("clicking the × must close the tab"); })();
} }}];

export default tests;
