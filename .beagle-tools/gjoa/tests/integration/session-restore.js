import { wait_for } from '../dsl.js';

export const tests = [{name: "Session-like — opening 5 tabs in a row, every one renders as a visible sidebar row", run: async (mn) => { await dsl.wait_for(mn, "return !!document.getElementById(\"gjoa-tab-panel\");", 2000);
await mn.executeScript("\n        if (window.Spaces) {\n          const main = window.Spaces.list().find(s => s.name === \"Main\") || window.Spaces.list()[0];\n          window.Spaces.setActive(main.id);\n          for (const s of [...window.Spaces.list()]) {\n            if (s.id !== main.id) window.Spaces.delete(s.id);\n          }\n        }\n      ");
const before = await mn.executeScript("\n        return document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row\").length;\n      ");
await mn.executeScript("\n        const principal = Services.scriptSecurityManager.getSystemPrincipal();\n        for (let i = 0; i < 5; i++) {\n          gBrowser.addTab(\"https://example.com/restore-\" + i, { triggeringPrincipal: principal });\n        }\n      ");
await dsl.wait_for(mn, ("".concat("\n        return document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row\").length >= ", (before + 5), ";\n      ")), 3000);
const counts = await mn.executeScript("\n        const rows = [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row\")];\n        const hiddenSamples = rows.filter(r => r.hidden)\n          .slice(0, 3)\n          .map(r => (r._tab?.label || r._tab?.linkedBrowser?.currentURI?.spec || \"?\"));\n        return {\n          total: rows.length,\n          visible: rows.filter(r => !r.hidden).length,\n          hiddenSamples,\n        };\n      ");
if ((!(!(counts.visible < (before + 5))))) {
  return (() => { throw new Error(("".concat("expected ", (before + 5), " visible rows, got ", counts.visible, " visible / ", counts.total, " total. ", "hidden samples: ", JSON.stringify(counts.hiddenSamples)))); })();
} }}, {name: "Session-like — panel construction is bulletproof: even with pre-set spaces state, panel exists and has rows for every tab", run: async (mn) => { await dsl.wait_for(mn, "return !!document.getElementById(\"gjoa-tab-panel\");", 2000);
await mn.executeScript("\n        const work = window.Spaces.create(\"Work\");\n        window.Spaces.setActive(work.id);\n      ");
await mn.executeScript("\n        const principal = Services.scriptSecurityManager.getSystemPrincipal();\n        gBrowser.addTab(\"https://example.com/work-a\", { triggeringPrincipal: principal });\n        gBrowser.addTab(\"https://example.com/work-b\", { triggeringPrincipal: principal });\n      ");
await dsl.wait_for(mn, "\n        const rows = [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row\")];\n        return rows.filter(r => !r.hidden).length >= 2;\n      ");
await mn.executeScript("\n        const main = window.Spaces.list().find(s => s.name === \"Main\");\n        window.Spaces.setActive(main.id);\n      ");
const visibleOnMain = await mn.executeScript("\n        return [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row\")]\n          .filter(r => !r.hidden).length;\n      ");
if ((!(!(visibleOnMain < 1)))) {
  return (() => { throw new Error("switching back to Main showed 0 rows — visibility filter likely hides Main tabs"); })();
} }}];

export default tests;
