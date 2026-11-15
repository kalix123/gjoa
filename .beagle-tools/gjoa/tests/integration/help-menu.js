import { equivV as $$bc$equiv } from 'beagle/core.js';

const TRIGGER = ("".concat("const win=Services.wm.getMostRecentWindow('navigator:browser');", " if (!win.gjoaTest || !win.gjoaTest.vim) return 'NO-API';", " win.gjoaTest.vim.runExCommand('help');", " const wk=win.document.getElementById('gjoa-which-key');", " return wk ? wk.textContent : 'NO-WK';"));

export const tests = [{name: "help overlay lists the : ex-commands", run: async (mn, ctx) => { await mn.setContext("chrome");
const txt = await mn.executeScript(TRIGGER);
if ((!(!($$bc$equiv(txt, "NO-API"))))) {
  (() => { throw new Error("gjoaTest.vim must be exposed (gjoa.test.exposeAPI)"); })();
}
if ((!(!($$bc$equiv(txt, "NO-WK"))))) {
  (() => { throw new Error("the #gjoa-which-key help overlay should exist after :help"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(txt.includes(": commands")))) {
  (() => { throw new Error("help overlay should have a ': commands' section"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(txt.includes(":tabpos")))) {
  (() => { throw new Error("help overlay should list :tabpos"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(txt.includes(":space")))) {
  (() => { throw new Error("help overlay should list :space"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(txt.includes(":checkpoint")))) {
  return (() => { throw new Error("help overlay should list :checkpoint"); })();
} }}];

export default tests;
