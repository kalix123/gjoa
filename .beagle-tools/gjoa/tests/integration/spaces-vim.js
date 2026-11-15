import { wait_for } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

async function reset_spaces(mn) {
  return await mn.executeScript("\n    const main = window.Spaces.list().find(s => s.name === \"Main\")\n              || window.Spaces.list()[0];\n    window.Spaces.setActive(main.id);\n    for (const s of [...window.Spaces.list()]) {\n      if (s.id !== main.id) window.Spaces.delete(s.id);\n    }\n  ");
}

export const tests = [{name: "Spaces+vim — :space new <name> creates and switches via runExCommand", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest && !!window.gjoaTest.vim && !!window.Spaces;", 1500);
await reset_spaces(mn);
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space new Work\");");
const state = await mn.executeScript("\n        return {\n          count: window.Spaces.list().length,\n          activeName: window.Spaces.active().name,\n          names: window.Spaces.list().map(s => s.name),\n        };\n      ");
const __a____scope__3__1__3__0__4__6__2__1__0 = state.count;
const __e____scope__3__1__3__0__4__6__2__1__3 = 2;
if ((!($$bc$equiv(__a____scope__3__1__3__0__4__6__2__1__0, __e____scope__3__1__3__0__4__6__2__1__3)))) {
  (() => { throw new Error(("".concat(("".concat("expected 2 spaces, got ", state.count, ": ", JSON.stringify(state))), " — expected ", __e____scope__3__1__3__0__4__6__2__1__3, ", got ", __a____scope__3__1__3__0__4__6__2__1__0))); })();
}
const __a____scope__3__1__3__0__4__6__3__1__0 = state.activeName;
const __e____scope__3__1__3__0__4__6__3__1__3 = "Work";
if ((!($$bc$equiv(__a____scope__3__1__3__0__4__6__3__1__0, __e____scope__3__1__3__0__4__6__3__1__3)))) {
  (() => { throw new Error(("".concat(("".concat("expected active=Work, got ", state.activeName, ": ", JSON.stringify(state))), " — expected ", __e____scope__3__1__3__0__4__6__3__1__3, ", got ", __a____scope__3__1__3__0__4__6__3__1__0))); })();
}
const __h____scope__3__1__3__0__4__6__4__1__0 = state.names;
const __n____scope__3__1__3__0__4__6__4__1__3 = "Work";
if ((!((_truthy) => _truthy !== false && _truthy != null)(__h____scope__3__1__3__0__4__6__4__1__0.includes(__n____scope__3__1__3__0__4__6__4__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("Work not in list: ", JSON.stringify(state))), " — ", __h____scope__3__1__3__0__4__6__4__1__0, " has no ", __n____scope__3__1__3__0__4__6__4__1__3))); })();
} }}, {name: "Spaces+vim — :space rename mutates the active space's name", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 1500);
await reset_spaces(mn);
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space new Work\");");
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space rename Office\");");
const name = await mn.executeScript("return window.Spaces.active().name;");
const __a____scope__3__1__3__1__4__7__2__1__0 = name;
const __e____scope__3__1__3__1__4__7__2__1__3 = "Office";
if ((!($$bc$equiv(__a____scope__3__1__3__1__4__7__2__1__0, __e____scope__3__1__3__1__4__7__2__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("expected active name=Office, got ", name)), " — expected ", __e____scope__3__1__3__1__4__7__2__1__3, ", got ", __a____scope__3__1__3__1__4__7__2__1__0))); })();
} }}, {name: "Spaces+vim — :space switch <name> moves the active pointer", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 1500);
await reset_spaces(mn);
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space new Work\");");
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space switch Main\");");
const name = await mn.executeScript("return window.Spaces.active().name;");
const __a____scope__3__1__3__2__4__7__2__1__0 = name;
const __e____scope__3__1__3__2__4__7__2__1__3 = "Main";
if ((!($$bc$equiv(__a____scope__3__1__3__2__4__7__2__1__0, __e____scope__3__1__3__2__4__7__2__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("expected active=Main after switch, got ", name)), " — expected ", __e____scope__3__1__3__2__4__7__2__1__3, ", got ", __a____scope__3__1__3__2__4__7__2__1__0))); })();
} }}, {name: "Spaces+vim — :space delete removes non-default; refuses to delete Main", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 1500);
await reset_spaces(mn);
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space new Doomed\");");
const cnt_before = await mn.executeScript("return window.Spaces.list().length;");
const __a____scope__3__1__3__3__4__6__2__1__0 = cnt_before;
const __e____scope__3__1__3__3__4__6__2__1__3 = 2;
if ((!($$bc$equiv(__a____scope__3__1__3__3__4__6__2__1__0, __e____scope__3__1__3__3__4__6__2__1__3)))) {
  (() => { throw new Error(("".concat(("".concat("setup failed: ", cnt_before)), " — expected ", __e____scope__3__1__3__3__4__6__2__1__3, ", got ", __a____scope__3__1__3__3__4__6__2__1__0))); })();
}
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space delete\");");
const after_del = await mn.executeScript("\n        return { count: window.Spaces.list().length, activeName: window.Spaces.active().name };\n      ");
const __a____scope__3__1__3__3__4__8__2__1__0 = after_del.count;
const __e____scope__3__1__3__3__4__8__2__1__3 = 1;
if ((!($$bc$equiv(__a____scope__3__1__3__3__4__8__2__1__0, __e____scope__3__1__3__3__4__8__2__1__3)))) {
  (() => { throw new Error(("".concat(("".concat("expected 1 after delete, got ", after_del.count)), " — expected ", __e____scope__3__1__3__3__4__8__2__1__3, ", got ", __a____scope__3__1__3__3__4__8__2__1__0))); })();
}
const __a____scope__3__1__3__3__4__8__3__1__0 = after_del.activeName;
const __e____scope__3__1__3__3__4__8__3__1__3 = "Main";
if ((!($$bc$equiv(__a____scope__3__1__3__3__4__8__3__1__0, __e____scope__3__1__3__3__4__8__3__1__3)))) {
  (() => { throw new Error(("".concat(("".concat("expected active=Main, got ", after_del.activeName)), " — expected ", __e____scope__3__1__3__3__4__8__3__1__3, ", got ", __a____scope__3__1__3__3__4__8__3__1__0))); })();
}
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space delete\");");
const final = await mn.executeScript("return window.Spaces.list().length;");
const __a____scope__3__1__3__3__4__10__2__1__0 = final;
const __e____scope__3__1__3__3__4__10__2__1__3 = 1;
if ((!($$bc$equiv(__a____scope__3__1__3__3__4__10__2__1__0, __e____scope__3__1__3__3__4__10__2__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("Main should not be deletable; got count=", final)), " — expected ", __e____scope__3__1__3__3__4__10__2__1__3, ", got ", __a____scope__3__1__3__3__4__10__2__1__0))); })();
} }}, {name: "Spaces+vim — gs / gS chord keys cycle active space", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest && !!window.gjoaTest.vim;", 1500);
await reset_spaces(mn);
await mn.executeScript("\n        window.gjoaTest.vim.runExCommand(\"space new A\");\n        window.gjoaTest.vim.runExCommand(\"space new B\");\n        window.gjoaTest.vim.runExCommand(\"space new C\");\n      ");
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space switch Main\");");
await mn.executeScript("window.gjoaTest.vim.focusPanel();");
await mn.executeScript("(async () => { await new Promise(r => setTimeout(r, 0)); })()");
await mn.executeScript("\n        function press(k, shift) {\n          const ev = new KeyboardEvent(\"keydown\", { key: k, bubbles: true, cancelable: true, shiftKey: !!shift });\n          document.dispatchEvent(ev);\n        }\n        press(\"g\"); press(\"s\");\n      ");
const after1 = await mn.executeScript("return window.Spaces.active().name;");
await mn.executeScript("\n        function press(k, shift) {\n          const ev = new KeyboardEvent(\"keydown\", { key: k, bubbles: true, cancelable: true, shiftKey: !!shift });\n          document.dispatchEvent(ev);\n        }\n        press(\"g\"); press(\"s\");\n      ");
const after2 = await mn.executeScript("return window.Spaces.active().name;");
await mn.executeScript("\n        function press(k, shift) {\n          const ev = new KeyboardEvent(\"keydown\", { key: k, bubbles: true, cancelable: true, shiftKey: !!shift });\n          document.dispatchEvent(ev);\n        }\n        press(\"g\"); press(\"S\", true);\n      ");
const after_reverse = await mn.executeScript("return window.Spaces.active().name;");
const all = await mn.executeScript("return window.Spaces.list().map(s => s.name);");
if ((!(!($$bc$equiv(after1, "Main"))))) {
  (() => { throw new Error(("".concat("gs from Main did not cycle. all=", JSON.stringify(all), " after1=", after1))); })();
}
if ((!(!(after2 === after1)))) {
  (() => { throw new Error(("".concat("second gs did not cycle. all=", JSON.stringify(all), " after1=", after1, " after2=", after2))); })();
}
const __a____scope__3__1__3__4__4__10__3__3__4__1__0 = after_reverse;
const __e____scope__3__1__3__4__4__10__3__3__4__1__3 = after1;
if ((!($$bc$equiv(__a____scope__3__1__3__4__4__10__3__3__4__1__0, __e____scope__3__1__3__4__4__10__3__3__4__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("gS should reverse to after1. all=", JSON.stringify(all), " after1=", after1, " after2=", after2, " afterReverse=", after_reverse)), " — expected ", __e____scope__3__1__3__4__4__10__3__3__4__1__3, ", got ", __a____scope__3__1__3__4__4__10__3__3__4__1__0))); })();
} }}, {name: "Spaces+vim — :space list opens the picker", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest && !!window.gjoaTest.vim;", 1500);
await reset_spaces(mn);
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space new Work\");");
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space\");");
const found = await mn.executeScript("\n        return !!document.querySelector(\"#gjoa-picker, [id*='picker']\");\n      ");
if ((!found)) {
  (() => { throw new Error("Expected the picker to be open after `:space` (no-arg)"); })();
}
return await mn.executeScript("\n        const ev = new KeyboardEvent(\"keydown\", { key: \"Escape\", bubbles: true });\n        document.dispatchEvent(ev);\n      "); }}, {name: "Spaces+vim — visibility filter integrates with sidebar rendering after vim switch", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest;", 1500);
await reset_spaces(mn);
await mn.executeScript("\n        gBrowser.addTab(\"https://example.com/a\", { triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() });\n        gBrowser.addTab(\"https://example.com/b\", { triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() });\n      ");
await dsl.wait_for(mn, "\n        return [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row\")]\n          .filter(r => !r.hidden).length >= 2;\n      ", 1500);
const before = await mn.executeScript("\n        return [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row\")]\n          .filter(r => !r.hidden).length;\n      ");
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space new Foo\");");
await dsl.wait_for(mn, "\n        return [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row\")]\n          .filter(r => !r.hidden).length === 0;\n      ", 5000);
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space switch Main\");");
return await dsl.wait_for(mn, ("".concat("\n        return [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row\")]\n          .filter(r => !r.hidden).length === ", before, ";\n      ")), 5000); }}];

export default tests;
