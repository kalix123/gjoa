import { wait_for } from '../dsl.js';

const visibleTabRows = "\n  return [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row, #gjoa-tab-panel-pinned .gjoa-tab-row\")]\n    .filter(r => !r.hidden).length;\n";

export const tests = [{name: "New tab — gBrowser.addTab() row appears in sidebar", run: async (mn) => { await dsl.wait_for(mn, "return !!document.querySelector(\"#gjoa-tab-panel\");");
const before = await mn.executeScript(visibleTabRows);
await mn.executeScript("\n        gBrowser.addTab(\"https://example.com/addtab\", {\n          triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),\n        });\n      ");
return await dsl.wait_for(mn, ("".concat(visibleTabRows.replace("return ", "const c = "), "; return c === ", (before + 1), ";")), 5000); }}, {name: "New tab — BrowserCommands.openTab() (the + button / Ctrl+T path) row appears", run: async (mn) => { await dsl.wait_for(mn, "return !!document.querySelector(\"#gjoa-tab-panel\");");
const before = await mn.executeScript(visibleTabRows);
const reachable = await mn.executeScript("\n        return typeof BrowserCommands !== \"undefined\" && typeof BrowserCommands.openTab === \"function\";\n      ");
if ((!reachable)) {
  await mn.executeScript("\n          gBrowser.addTab(\"about:newtab\", {\n            triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),\n            inBackground: false,\n          });\n        ");
} else {
  await mn.executeScript("BrowserCommands.openTab();");
}
return await dsl.wait_for(mn, ("".concat(visibleTabRows.replace("return ", "const c = "), "; return c === ", (before + 1), ";")), 5000); }}, {name: "New tab in non-default space — appears in that space, hides on switch", run: async (mn) => { await dsl.wait_for(mn, "return !!window.Spaces;");
await mn.executeScript("\n        const main = window.Spaces.list().find(s => s.name === \"Main\") || window.Spaces.list()[0];\n        window.Spaces.setActive(main.id);\n        for (const s of [...window.Spaces.list()]) {\n          if (s.id !== main.id) window.Spaces.delete(s.id);\n        }\n      ");
await mn.executeScript("\n        const s = window.Spaces.create(\"NewTabSpace\");\n        window.Spaces.setActive(s.id);\n      ");
await dsl.wait_for(mn, ("".concat(visibleTabRows.replace("return ", "const c = "), "; return c === 0;")));
await mn.executeScript("\n        const t = gBrowser.addTab(\"https://example.com/in-new-space\", {\n          triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),\n        });\n        t.setAttribute(\"gjoa-test-marker\", \"in-new-space\");\n      ");
await dsl.wait_for(mn, ("".concat(visibleTabRows.replace("return ", "const c = "), "; return c === 1;")));
await mn.executeScript("\n        const main = window.Spaces.list().find(s => s.name === \"Main\");\n        window.Spaces.setActive(main.id);\n      ");
const inNewSpaceVisible = await mn.executeScript("\n        return [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row\")]\n          .filter(r => !r.hidden)\n          .some(r => r._tab && r._tab.getAttribute(\"gjoa-test-marker\") === \"in-new-space\");\n      ");
if ((!(!inNewSpaceVisible))) {
  return (() => { throw new Error("marked tab still visible after switching to Main"); })();
} }}];

export default tests;
