import { wait_for } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

async function reset(mn) {
  return await mn.executeScript(("".concat("\n", "    try { Services.prefs.clearUserPref(\"gjoa.tabs.newTabPosition\"); } catch {}\n", "    if (window.Spaces) {\n", "      const main = window.Spaces.list().find(s => s.name === \"Main\") || window.Spaces.list()[0];\n", "      window.Spaces.setActive(main.id);\n", "      for (const s of [...window.Spaces.list()]) {\n", "        if (s.id !== main.id) window.Spaces.delete(s.id);\n", "      }\n", "    }\n", "  ")));
}

export const tests = [{name: "tabpos default — successive Ctrl+T-style at root spawns siblings at root (no indent chain)", run: async (mn) => { await dsl.wait_for(mn, "return !!document.getElementById(\"gjoa-tab-panel\");", 2000);
await reset(mn);
const stamp = ("".concat("tabpos-default-", Date.now()));
const data = await mn.executeScript(("".concat("        const stamp = ", JSON.stringify(stamp), ";\n", "        const principal = Services.scriptSecurityManager.getSystemPrincipal();\n", "        const root = gBrowser.addTab(\"about:blank\", { triggeringPrincipal: principal });\n", "        root.setAttribute(\"gjoa-test-marker\", stamp + \"-root\");\n", "        gBrowser.selectedTab = root;\n", "        for (let i = 0; i < 3; i++) {\n", "          const owner = gBrowser.selectedTab;\n", "          const t = gBrowser.addTab(\"about:newtab\", { triggeringPrincipal: principal, ownerTab: owner });\n", "          t.setAttribute(\"gjoa-test-marker\", stamp + \"-\" + i);\n", "          gBrowser.selectedTab = t;\n", "        }\n", "        const marked = [...gBrowser.tabs].filter(t =>\n", "          (t.getAttribute && (t.getAttribute(\"gjoa-test-marker\") || \"\").startsWith(stamp)));\n", "        return marked.map(t => {\n", "          const row = [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row, #gjoa-tab-panel-pinned .gjoa-tab-row\")]\n", "            .find(r => r._tab === t);\n", "          const pad = row ? parseFloat(row.style.paddingInlineStart || \"0\") : -1;\n", "          return {\n", "            marker: t.getAttribute(\"gjoa-test-marker\"),\n", "            pad,\n", "            parentId: window.gjoaTest.treeOf.get(t)?.parentId ?? null,\n", "          };\n", "        });\n", "      ")));
if ((!($$bc$equiv(data.length, 4)))) {
  (() => { throw new Error(("".concat("expected 4 marker tabs, got ", data.length, ": ", JSON.stringify(data)))); })();
}
const non_root = data.filter((r) => ((!($$bc$equiv(r.pad, 8))) || (!($$bc$equiv(r.parentId, null)))));
if ((non_root.length > 0)) {
  return (() => { throw new Error(("".concat("expected all root (pad=8, parentId=null); got: ", JSON.stringify(data)))); })();
} }}, {name: "tabpos default — Ctrl+T while a CHILD tab is selected spawns a sibling at same depth", run: async (mn) => { await dsl.wait_for(mn, "return !!document.getElementById(\"gjoa-tab-panel\");", 2000);
await reset(mn);
const stamp = ("".concat("tabpos-sibling-", Date.now()));
await mn.executeScript(("".concat("window.__stamp = \"", stamp, "\";")));
await mn.executeScript(("".concat("        const principal = Services.scriptSecurityManager.getSystemPrincipal();\n", "        const parent = gBrowser.addTab(\"about:blank\", { triggeringPrincipal: principal });\n", "        parent.setAttribute(\"gjoa-test-marker\", window.__stamp + \"-parent\");\n", "        const child = gBrowser.addTab(\"about:newtab\", { triggeringPrincipal: principal, ownerTab: parent });\n", "        child.setAttribute(\"gjoa-test-marker\", window.__stamp + \"-child\");\n", "        // Pin child to parent in our tree.\n", "        window.gjoaTest.treeOf.get(child).parentId = window.gjoaTest.treeOf.get(parent).id;\n", "        window.gjoaTest.rows.scheduleTreeResync();\n", "        gBrowser.selectedTab = child;\n", "      ")));
await dsl.wait_for(mn, ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-child\");")), 2000);
await mn.executeScript(("".concat("        const principal = Services.scriptSecurityManager.getSystemPrincipal();\n", "        const sib = gBrowser.addTab(\"about:newtab\", { triggeringPrincipal: principal, ownerTab: gBrowser.selectedTab });\n", "        sib.setAttribute(\"gjoa-test-marker\", window.__stamp + \"-sib\");\n", "      ")));
await dsl.wait_for(mn, ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-sib\");")), 2000);
const data = await mn.executeScript(("".concat("        const stamp = window.__stamp;\n", "        const parent = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === stamp + \"-parent\");\n", "        const child = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === stamp + \"-child\");\n", "        const sib = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === stamp + \"-sib\");\n", "        return {\n", "          parentOfSib: window.gjoaTest.treeOf.get(sib).parentId,\n", "          parentOfChild: window.gjoaTest.treeOf.get(child).parentId,\n", "        };\n", "      ")));
if ((!($$bc$equiv(data.parentOfSib, data.parentOfChild)))) {
  return (() => { throw new Error(("".concat("Ctrl+T while child selected should produce a sibling of child. ", "sib.parentId=", data.parentOfSib, ", child.parentId=", data.parentOfChild))); })();
} }}, {name: ":tabpos root — switching the pref makes new tabs go to root regardless of selected tab", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest && !!window.gjoaTest.vim;", 2000);
await reset(mn);
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"tabpos root\");");
const pref = await mn.executeScript("return Services.prefs.getCharPref(\"gjoa.tabs.newTabPosition\");");
if ((!($$bc$equiv(pref, "root")))) {
  (() => { throw new Error(("".concat("pref not set: ", pref))); })();
}
const stamp = ("".concat("tabpos-root-", Date.now()));
await mn.executeScript(("".concat("        const principal = Services.scriptSecurityManager.getSystemPrincipal();\n", "        const a = gBrowser.addTab(\"about:blank\", { triggeringPrincipal: principal });\n", "        a.setAttribute(\"gjoa-test-marker\", \"", stamp, "-a\");\n", "        gBrowser.selectedTab = a;\n", "        const b = gBrowser.addTab(\"about:newtab\", { triggeringPrincipal: principal, ownerTab: a });\n", "        b.setAttribute(\"gjoa-test-marker\", \"", stamp, "-b\");\n", "        gBrowser.selectedTab = b;\n", "        const c = gBrowser.addTab(\"about:newtab\", { triggeringPrincipal: principal, ownerTab: b });\n", "        c.setAttribute(\"gjoa-test-marker\", \"", stamp, "-c\");\n", "      ")));
await dsl.wait_for(mn, ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-c\");")), 2000);
const parents = await mn.executeScript(("".concat("        return [...gBrowser.tabs]\n", "          .filter(t => t.getAttribute && (t.getAttribute(\"gjoa-test-marker\") || \"\").startsWith(\"", stamp, "\"))\n", "          .map(t => ({ m: t.getAttribute(\"gjoa-test-marker\"), p: window.gjoaTest.treeOf.get(t).parentId }));\n", "      ")));
const non_root = parents.filter((r) => (!($$bc$equiv(r.p, null))));
if ((non_root.length > 0)) {
  return (() => { throw new Error(("".concat(":tabpos root broken — non-root tabs: ", JSON.stringify(parents)))); })();
} }}, {name: ":tabpos child — switching the pref makes new tabs nest under their owner", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 2000);
await reset(mn);
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"tabpos child\");");
const stamp = ("".concat("tabpos-child-", Date.now()));
await mn.executeScript(("".concat("        const principal = Services.scriptSecurityManager.getSystemPrincipal();\n", "        const parent = gBrowser.addTab(\"about:blank\", { triggeringPrincipal: principal });\n", "        parent.setAttribute(\"gjoa-test-marker\", \"", stamp, "-p\");\n", "        gBrowser.selectedTab = parent;\n", "        const c = gBrowser.addTab(\"about:newtab\", { triggeringPrincipal: principal, ownerTab: parent });\n", "        c.setAttribute(\"gjoa-test-marker\", \"", stamp, "-c\");\n", "      ")));
await dsl.wait_for(mn, ("".concat("return [...gBrowser.tabs].some(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-c\");")), 2000);
const data = await mn.executeScript(("".concat("        const p = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-p\");\n", "        const c = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"", stamp, "-c\");\n", "        return {\n", "          parentId: window.gjoaTest.treeOf.get(c).parentId,\n", "          expectedParent: window.gjoaTest.treeOf.get(p).id,\n", "        };\n", "      ")));
if ((!($$bc$equiv(data.parentId, data.expectedParent)))) {
  return (() => { throw new Error(("".concat(":tabpos child broken — got parentId=", data.parentId, ", expected ", data.expectedParent))); })();
} }}, {name: ":tabpos with no arg reports current value", run: async (mn) => { await reset(mn);
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"tabpos sibling\");");
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"tabpos\");");
const pref = await mn.executeScript("return Services.prefs.getCharPref(\"gjoa.tabs.newTabPosition\");");
if ((!($$bc$equiv(pref, "sibling")))) {
  return (() => { throw new Error(("".concat("bare :tabpos should be read-only, pref changed to ", pref))); })();
} }}, {name: ":tabpos rejects invalid arg", run: async (mn) => { await reset(mn);
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"tabpos sibling\");");
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"tabpos garbage\");");
const pref = await mn.executeScript("return Services.prefs.getCharPref(\"gjoa.tabs.newTabPosition\");");
if ((!($$bc$equiv(pref, "sibling")))) {
  return (() => { throw new Error(("".concat(":tabpos garbage should be rejected, pref was ", pref))); })();
} }}];

export default tests;
