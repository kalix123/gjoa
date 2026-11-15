import { wait_for } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

export const tests = [{name: "new-tab-honors-active-space — Ctrl+T while in Workspace places tab in Workspace, NOT Main, even when owner is a Main tab", run: async (mn) => { await dsl.wait_for(mn, "return !!window.Spaces;");
await mn.executeScript("\n        const main = window.Spaces.list().find(s => s.name === \"Main\") || window.Spaces.list()[0];\n        window.Spaces.setActive(main.id);\n        for (const s of [...window.Spaces.list()]) {\n          if (s.id !== main.id) window.Spaces.delete(s.id);\n        }\n      ");
await mn.executeScript("\n        const principal = Services.scriptSecurityManager.getSystemPrincipal();\n        const anchor = gBrowser.addTab(\"https://example.com/main-anchor\", { triggeringPrincipal: principal });\n        anchor.setAttribute(\"gjoa-test-marker\", \"main-anchor\");\n        gBrowser.selectedTab = anchor;\n        const main = window.Spaces.list().find(s => s.name === \"Main\");\n        window.Spaces.assignTab(anchor, main.id);\n      ");
await dsl.wait_for(mn, "\n        return [...gBrowser.tabs].some(t => t.getAttribute(\"gjoa-test-marker\") === \"main-anchor\");\n      ");
await mn.executeScript("\n        const ws = window.Spaces.create(\"Workspace\");\n        window.Spaces.setActive(ws.id);\n      ");
await dsl.wait_for(mn, "return window.Spaces.active().name === \"Workspace\";");
await mn.executeScript("\n        const principal = Services.scriptSecurityManager.getSystemPrincipal();\n        const anchor = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"main-anchor\");\n        const newTab = gBrowser.addTab(\"https://example.com/in-workspace\", {\n          triggeringPrincipal: principal,\n          ownerTab: anchor,\n        });\n        newTab.setAttribute(\"gjoa-test-marker\", \"new-in-workspace\");\n      ");
await dsl.wait_for(mn, "\n        return [...gBrowser.tabs].some(t => t.getAttribute(\"gjoa-test-marker\") === \"new-in-workspace\");\n      ");
const sp = await mn.executeScript("\n        const newTab = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"new-in-workspace\");\n        const ws = window.Spaces.list().find(s => s.name === \"Workspace\");\n        const main = window.Spaces.list().find(s => s.name === \"Main\");\n        return {\n          space: window.Spaces.spaceOf(newTab),\n          active: ws.id,\n          main: main.id,\n        };\n      ");
if ((!(!($$bc$equiv(sp.space, sp.main))))) {
  (() => { throw new Error(("".concat("new tab went to Main instead of Workspace. (Owner-inheritance bug.) sp=", JSON.stringify(sp)))); })();
}
if ((!($$bc$equiv(sp.space, sp.active)))) {
  (() => { throw new Error(("".concat("new tab not in active Workspace. sp=", JSON.stringify(sp)))); })();
}
const visible_in_workspace = await mn.executeScript("\n        return [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row\")]\n          .filter(r => !r.hidden)\n          .some(r => r._tab && r._tab.getAttribute(\"gjoa-test-marker\") === \"new-in-workspace\");\n      ");
if ((!((_truthy) => _truthy !== false && _truthy != null)(visible_in_workspace))) {
  return (() => { throw new Error("new tab is in Workspace logically but its row is hidden — visibility filter broken"); })();
} }}, {name: "new-tab-honors-active-space — Ctrl+T with NO owner still goes to active space", run: async (mn) => { await dsl.wait_for(mn, "return !!window.Spaces;");
await mn.executeScript("\n        const main = window.Spaces.list().find(s => s.name === \"Main\") || window.Spaces.list()[0];\n        window.Spaces.setActive(main.id);\n        for (const s of [...window.Spaces.list()]) {\n          if (s.id !== main.id) window.Spaces.delete(s.id);\n        }\n        const ws = window.Spaces.create(\"Work2\");\n        window.Spaces.setActive(ws.id);\n      ");
await dsl.wait_for(mn, "return window.Spaces.active().name === \"Work2\";");
await mn.executeScript("\n        const principal = Services.scriptSecurityManager.getSystemPrincipal();\n        const t = gBrowser.addTab(\"https://example.com/no-owner\", { triggeringPrincipal: principal });\n        t.setAttribute(\"gjoa-test-marker\", \"no-owner\");\n      ");
await dsl.wait_for(mn, "\n        return [...gBrowser.tabs].some(t => t.getAttribute(\"gjoa-test-marker\") === \"no-owner\");\n      ");
const sp = await mn.executeScript("\n        const t = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"no-owner\");\n        const ws = window.Spaces.active();\n        return { inActive: window.Spaces.spaceOf(t) === ws.id, activeName: ws.name };\n      ");
if ((!((_truthy) => _truthy !== false && _truthy != null)(sp.inActive))) {
  return (() => { throw new Error(("".concat("no-owner tab not in active space ", sp.activeName))); })();
} }}];

export default tests;
