import { wait_for } from '../dsl.js';

const OPEN_SECOND_JS = ("".concat("\n", "  Services.wm.getMostRecentWindow('navigator:browser').OpenBrowserWindow();\n", "  return true;\n"));

const BOTH_READY_JS = ("".concat("\n", "  const ws = [...Services.wm.getEnumerator('navigator:browser')];\n", "  return ws.length >= 2 && ws.every(w => !!w.Spaces && !!w.gjoaTest && !!w.gBrowser);\n"));

const RESET_BOTH_JS = ("".concat("\n", "  for (const w of [...Services.wm.getEnumerator('navigator:browser')]) {\n", "    const S = w.Spaces;\n", "    const main = S.list().find(s => s.name === 'Main') || S.list()[0];\n", "    S.setActive(main.id);\n", "    for (const s of [...S.list()]) { if (s.id !== main.id) S.delete(s.id); }\n", "  }\n", "  return true;\n"));

const CREATE_IN_A_JS = ("".concat("\n", "  const a = [...Services.wm.getEnumerator('navigator:browser')][0];\n", "  const s = a.Spaces.create('SyncProbe');\n", "  return JSON.stringify({ aId: s.id, aCount: a.Spaces.list().length });\n"));

const B_HAS_CREATED_JS = ("".concat("\n", "  const b = [...Services.wm.getEnumerator('navigator:browser')][1];\n", "  return b.Spaces.list().some(s => s.name === 'SyncProbe');\n"));

const CLOSE_SECOND_JS = ("".concat("\n", "  const ws = [...Services.wm.getEnumerator('navigator:browser')];\n", "  if (ws.length > 1) ws[ws.length - 1].close();\n", "  return true;\n"));

const RENAME_IN_A_JS = ("".concat("\n", "  const a = [...Services.wm.getEnumerator('navigator:browser')][0];\n", "  let s = a.Spaces.list().find(x => x.name === 'SyncProbe');\n", "  if (!s) s = a.Spaces.create('SyncProbe');\n", "  a.Spaces.rename(s.id, 'SyncRenamed');\n", "  return true;\n"));

const B_HAS_RENAMED_JS = ("".concat("\n", "  const b = [...Services.wm.getEnumerator('navigator:browser')][1];\n", "  const names = b.Spaces.list().map(s => s.name);\n", "  return names.includes('SyncRenamed') && !names.includes('SyncProbe');\n"));

const CREATE_TWO_DELETE_ONE_IN_A_JS = ("".concat("\n", "  const a = [...Services.wm.getEnumerator('navigator:browser')][0];\n", "  a.Spaces.create('SyncKeep');\n", "  const doomed = a.Spaces.create('SyncDoomed');\n", "  a.Spaces.delete(doomed.id);\n", "  return true;\n"));

const B_REFLECTS_DELETE_JS = ("".concat("\n", "  const b = [...Services.wm.getEnumerator('navigator:browser')][1];\n", "  const names = b.Spaces.list().map(s => s.name);\n", "  return names.includes('SyncKeep') && !names.includes('SyncDoomed');\n"));

const tests = [{name: "#89 — space created in window A appears in window B's roster", run: async (mn) => { await mn.executeScript(OPEN_SECOND_JS);
await dsl.wait_for(mn, BOTH_READY_JS, 8000);
await mn.executeScript(RESET_BOTH_JS);
const created = JSON.parse(await mn.executeScript(CREATE_IN_A_JS));
if ((!(created.aCount > 1))) {
  (() => { throw new Error("sanity: window A should have >1 space after create"); })();
}
await dsl.wait_for(mn, B_HAS_CREATED_JS, 5000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(B_HAS_CREATED_JS)))) {
  (() => { throw new Error("window B never learned of the 'SyncProbe' space created in A (no cross-window roster sync)"); })();
}
return await mn.executeScript(CLOSE_SECOND_JS); }}, {name: "#89 — space renamed in window A is reflected in window B's roster", run: async (mn) => { await mn.executeScript(OPEN_SECOND_JS);
await dsl.wait_for(mn, BOTH_READY_JS, 8000);
await mn.executeScript(RESET_BOTH_JS);
await mn.executeScript(RENAME_IN_A_JS);
await dsl.wait_for(mn, B_HAS_RENAMED_JS, 5000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(B_HAS_RENAMED_JS)))) {
  (() => { throw new Error("window B did not reflect the rename 'SyncProbe'->'SyncRenamed' from window A"); })();
}
return await mn.executeScript(CLOSE_SECOND_JS); }}, {name: "#89 — space deleted in window A is dropped from window B's roster", run: async (mn) => { await mn.executeScript(OPEN_SECOND_JS);
await dsl.wait_for(mn, BOTH_READY_JS, 8000);
await mn.executeScript(RESET_BOTH_JS);
await mn.executeScript(CREATE_TWO_DELETE_ONE_IN_A_JS);
await dsl.wait_for(mn, B_REFLECTS_DELETE_JS, 5000);
if ((!((_truthy) => _truthy !== false && _truthy != null)(await mn.executeScript(B_REFLECTS_DELETE_JS)))) {
  (() => { throw new Error("window B did not reflect A's roster after create-two/delete-one (missing survivor or kept the deleted)"); })();
}
return await mn.executeScript(CLOSE_SECOND_JS); }}];

export default tests;
