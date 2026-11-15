import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, basename } from 'path';
import { connect_marionette_bang } from './marionette.js';
import { create_profile } from './profile.js';
import { locate_gjoa } from './gjoa-locator.js';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

export function SkipError_bang(reason) {
  const e = new Error(reason);
  (e.name = "SkipError");
  return e;
}

function emit(ev) {
  return process.stdout.write(("".concat(JSON.stringify(ev), "\n")));
}

function logErr(line) {
  return process.stderr.write(("".concat("[runner] ", line, "\n")));
}

const RESET_JS = ("".concat("try {\n", "  try { for (var w of [...Services.wm.getEnumerator('navigator:browser')]) { if (w !== window) { try { w.close(); } catch (e) {} } } } catch (e) {}\n", "  try { Services.prefs.setBoolPref('sidebar.verticalTabs', true); } catch (e) {}\n", "  try { Services.prefs.clearUserPref('gjoa.layout.dynamicOrientation'); } catch (e) {}\n", "  try { Services.prefs.clearUserPref('gjoa.layout.narrowThreshold'); } catch (e) {}\n", "  try { Services.prefs.clearUserPref('gjoa.layout.horizontalSingleRow'); } catch (e) {}\n", "  try { Services.prefs.clearUserPref('gjoa.keys.useLeader'); } catch (e) {}\n", "  try { Services.prefs.clearUserPref('gjoa.tabs.newTabPosition'); } catch (e) {}\n", "  try { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); } catch (e) {}\n", "  try { if (window.Spaces && window.Spaces.list) { var L = window.Spaces.list(); var m = L.find(s => s.name === 'Main') || L[0]; if (m) { window.Spaces.setActive(m.id); L.forEach(s => { if (s.id !== m.id) { try { window.Spaces.delete(s.id); } catch (e) {} } }); } } } catch (e) {}\n", "  var GT = window.gjoaTest;\n", "  try { if (GT) { if (GT.vim && GT.vim.setCursor) GT.vim.setCursor(null); else if (GT.state) GT.state.cursor = null; } } catch (e) {}\n", "  try { if (window.gBrowser) { var blank = gBrowser.addTab('about:blank', { triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() }); gBrowser.selectedTab = blank; Array.from(gBrowser.tabs).forEach(t => { if (t !== blank && !t.pinned) { try { gBrowser.removeTab(t); } catch (e) {} } }); } } catch (e) {}\n", "  try { document.querySelectorAll('#gjoa-tab-panel .gjoa-group-row, #gjoa-tab-panel-pinned .gjoa-group-row').forEach(r => { try { r.remove(); } catch (e) {} }); } catch (e) {}\n", "  try { if (GT && GT.treeOf && window.gBrowser) { var td = GT.treeOf.get(gBrowser.selectedTab); if (td) { td.parentId = null; td.collapsed = false; } } } catch (e) {}\n", "  try { if (GT && GT.rows) { if (GT.rows.scheduleTreeResync) GT.rows.scheduleTreeResync(); if (GT.rows.updateVisibility) GT.rows.updateVisibility(); } } catch (e) {}\n", "  try { if (typeof gURLBar !== 'undefined' && gURLBar) { gURLBar.value = ''; if (gURLBar.view && gURLBar.view.close) gURLBar.view.close(); gURLBar.blur(); } } catch (e) {}\n", "  try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}\n", "} catch (e) {}"));

const dynImport = new Function("p", "return import(p)");

async function loadTests(testDir) {
  const entries = await (async () => { try {
    return await readdir(testDir);
  } catch (e) {
    return (() => { throw new Error(("".concat("could not read ", testDir, ": ", e.message))); })();
  } })();
  const files = entries.filter((f) => ((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(f.endsWith(".d.ts"))) : _logical))(new RegExp("\\.(ts|tsx|mjs|js)$").test(f)));
  const n = files.length;
  const out = [];
  await (async () => { let i = 0; while (true) {
    if ((i < n)) {  const f = files[i]; const path = join(testDir, f); const testMod = await dynImport(path); const tests = ((_logical) => (_logical !== false && _logical != null ? _logical : []))(testMod.default); const __push = ((!((_truthy) => _truthy !== false && _truthy != null)(Array.isArray(tests))) ? logErr(("".concat("skipping ", f, " — default export is not an array"))) : out.push({file: basename(f), tests: tests})); const _recur_0 = (i + 1); i = _recur_0; continue; } else { return null; }
  } })();
  return out;
}

function load_tags() {
  const p = join(process.cwd(), "tests", "integration", "tags.json");
  return (((_truthy) => _truthy !== false && _truthy != null)(existsSync(p)) ? (() => { try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    logErr(("".concat("tags.json parse failed: ", e.message)));
    return {subsystems: {}, lanes: {}, sources: {}};
  } })() : {subsystems: {}, lanes: {}, sources: {}});
}

function strip_ext(f) {
  return f.replace(new RegExp("\\.[^.]+$"), "");
}

function suite_keepset(tags, opts) {
  const subs = ((_logical) => (_logical !== false && _logical != null ? _logical : {}))(tags.subsystems);
  const lanes = ((_logical) => (_logical !== false && _logical != null ? _logical : {}))(tags.lanes);
  const keep = new Set();
  const excl = new Set();
  const any = ((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : opts.lane))(opts.subsystem)))(opts.files));
  if (((_truthy) => _truthy !== false && _truthy != null)(opts.files)) {
    opts.files.split(",").forEach((n) => {
  if (((_truthy) => _truthy !== false && _truthy != null)(n.trim())) {
    keep.add(n.trim());
  }
});
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(opts.subsystem)) {
    opts.subsystem.split(",").forEach((s) => {
  ((_logical) => (_logical !== false && _logical != null ? _logical : []))($$bc$get(subs, s.trim())).forEach((n) => {
  keep.add(n);
});
});
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(opts.lane)) {
    opts.lane.split(",").forEach((l) => {
  ((_logical) => (_logical !== false && _logical != null ? _logical : []))($$bc$get(lanes, l.trim())).forEach((n) => {
  keep.add(n);
});
});
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(opts.excludeLane)) {
    opts.excludeLane.split(",").forEach((l) => {
  ((_logical) => (_logical !== false && _logical != null ? _logical : []))($$bc$get(lanes, l.trim())).forEach((n) => {
  excl.add(n);
});
});
  }
  return ((((_truthy) => _truthy !== false && _truthy != null)(any)) ? (() => { (() => { Array.from(excl).forEach((n) => {
  keep.delete(n);
}); })();
return {keep: keep}; })() : ((excl.size > 0)) ? {exclude: excl} : null);
}

function spawnGjoa(opts) {
  const verbose = opts.verbose;
  const args = ["--profile", opts.profilePath, "--marionette"].concat((((_truthy) => _truthy !== false && _truthy != null)(opts.headed) ? [] : ["--headless"]), ["--no-remote", "--remote-allow-system-access", "-marionette-port", String(opts.marionettePort)]);
  const env = Object.assign({}, process.env, {["GJOA_ALLOW_INSECURE"]: "1", ["GJOA_DEV_LOADER"]: "1"});
  const child = spawn(opts.gjoaBin, args, {stdio: (((_truthy) => _truthy !== false && _truthy != null)(verbose) ? "inherit" : "pipe"), env: env});
  if ((!((_truthy) => _truthy !== false && _truthy != null)(verbose))) {
    const out = child.stdout;
    if (((_truthy) => _truthy !== false && _truthy != null)(out)) {
      out.resume();
    }
    const err = child.stderr;
    if (((_truthy) => _truthy !== false && _truthy != null)(err)) {
      err.resume();
    }
  }
  child.once("error", (e) => logErr(("".concat("gjoa spawn error: ", e.message))));
  return child;
}

export async function run_all_bang(opts0) {
  const opts = ((_logical) => (_logical !== false && _logical != null ? _logical : {}))(opts0);
  const gjoaBin = ((_logical) => (_logical !== false && _logical != null ? _logical : locate_gjoa().path))(opts.gjoaBin);
  const testDir = ((_logical) => (_logical !== false && _logical != null ? _logical : join(process.cwd(), ".beagle-tools", "gjoa", "tests", "integration")))(opts.testDir);
  const marionettePort = ((_logical) => (_logical !== false && _logical != null ? _logical : 2828))(opts.marionettePort);
  if (((_truthy) => _truthy !== false && _truthy != null)(opts.headed)) {
    logErr("WARNING: --headed mode will pop a real gjoa window on your display.");
  }
  const allSuites = await loadTests(testDir);
  const tags = load_tags();
  const keep = suite_keepset(tags, opts);
  const suites = (((_truthy) => _truthy !== false && _truthy != null)(keep) ? allSuites.filter((s) => { const base = strip_ext(s.file);
return (((_truthy) => _truthy !== false && _truthy != null)(keep.exclude) ? (!((_truthy) => _truthy !== false && _truthy != null)(keep.exclude.has(base))) : keep.keep.has(base)); }) : allSuites);
  if (((_truthy) => _truthy !== false && _truthy != null)(opts.grep)) {
    const needle = opts.grep.toLowerCase();
    suites.forEach((s) => {
  (s.tests = s.tests.filter((t) => t.name.toLowerCase().includes(needle)));
});
  }
  const totalCount = suites.reduce((n, s) => { const suite_size = s.tests.length;
return (n + suite_size); }, 0);
  if (($$bc$equiv(totalCount, 0))) {
    emit({type: "summary", pass: 0, fail: 0, skip: 0, durationMs: 0, note: (((_truthy) => _truthy !== false && _truthy != null)(opts.grep) ? ("".concat("no tests match --grep \"", opts.grep, "\"")) : "no tests found")});
    return {pass: 0, fail: 0, skip: 0};
  } else {
    const profile = ({value: null, watches: {}});
    const gjoa = ({value: null, watches: {}});
    const mn = ({value: null, watches: {}});
    const pass = ({value: 0, watches: {}});
    const fail = ({value: 0, watches: {}});
    const skip = ({value: 0, watches: {}});
    const start = Date.now();
    const killGjoa = async () => { const g = gjoa.value;
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(g.killed)) : _logical))(g))) {
  g.kill("SIGTERM");
  return await new Promise((r) => { const timer = setTimeout(() => { (() => { try {
    return g.kill("SIGKILL");
  } catch (__) {
    return null;
  } })();
return r(); }, 3000);
return g.once("exit", () => { clearTimeout(timer);
return r(); }); });
} };
    const bootGjoa = async (profilePath) => { const g = await spawnGjoa({gjoaBin: gjoaBin, profilePath: profilePath, marionettePort: marionettePort, verbose: opts.verbose, headed: opts.headed});
(() => { const _a = gjoa, _v = g; const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
const client = await connect_marionette_bang({port: marionettePort});
await client.newSession();
await client.setContext("chrome");
return client; };
    const runOneTest = async (file, t) => { emit({type: "test:start", name: t.name, file: file});
const tStart = Date.now();
const ctx = {profilePath: profile.value.path, headed: ((_truthy) => _truthy !== false && _truthy != null)(opts.headed), skip: (reason) => (() => { throw SkipError_bang(reason); })(), restartGjoa: async () => { await (async () => { try {
    return await mn.value.quit();
  } catch (__) {
    return null;
  } })();
mn.value.disconnect();
await killGjoa();
const m = await bootGjoa(profile.value.path);
(() => { const _a = mn, _v = m; const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
return mn.value; }};
return (async () => { try {
    await (async () => { try {
    return await mn.value.setContext("chrome");
  } catch (__) {
    return null;
  } })();
  await (async () => { try {
    return await mn.value.executeScript(RESET_JS);
  } catch (__) {
    return null;
  } })();
  await t.run(mn.value, ctx);
  emit({type: "test:pass", name: t.name, file: file, durationMs: (Date.now() - tStart)});
  return (() => { const _a = pass; const _old = _a.value; _a.value = (((_x) => (_x + 1)))(_old); for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _a.value); return _a.value; })();
  } catch (e) {
    if (($$bc$equiv(e.name, "SkipError"))) {
      emit({type: "test:skip", name: t.name, file: file, durationMs: (Date.now() - tStart), reason: e.message});
      return (() => { const _a = skip; const _old = _a.value; _a.value = (((_x) => (_x + 1)))(_old); for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _a.value); return _a.value; })();
    } else {
      emit({type: "test:fail", name: t.name, file: file, durationMs: (Date.now() - tStart), error: ((_logical) => (_logical !== false && _logical != null ? _logical : String(e)))(e.message), stack: e.stack});
      return (() => { const _a = fail; const _old = _a.value; _a.value = (((_x) => (_x + 1)))(_old); for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _a.value); return _a.value; })();
    }
  } })(); };
    const runSuite = async (suite) => { const file = suite.file;
const ts = suite.tests;
const m = ts.length;
return await (async () => { let j = 0; while (true) {
    if ((j < m)) {  const __run = await runOneTest(file, ts[j]); const _recur_0 = (j + 1); j = _recur_0; continue; } else { return null; }
  } })(); };
    await (async () => { try {
    const p = await create_profile({marionettePort: marionettePort});
  (() => { const _a = profile, _v = p; const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
  if (((_truthy) => _truthy !== false && _truthy != null)(opts.verbose)) {
    logErr(("".concat("profile: ", profile.value.path)));
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(opts.verbose)) {
    logErr(("".concat("binary:  ", gjoaBin)));
  }
  const m = await bootGjoa(profile.value.path);
  (() => { const _a = mn, _v = m; const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
  return await (async () => { let si = 0; while (true) {
    if ((si < suites.length)) {  const __suite = await runSuite(suites[si]); const _recur_0 = (si + 1); si = _recur_0; continue; } else { return null; }
  } })();
  } catch (e) {
    logErr(("".concat("runner failure: ", ((_logical) => (_logical !== false && _logical != null ? _logical : e.message))(e.stack))));
    return (() => { const _a = fail; const _old = _a.value; _a.value = (((_x) => (_x + 1)))(_old); for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _a.value); return _a.value; })();
  } finally {
    if (((_truthy) => _truthy !== false && _truthy != null)(mn.value)) {
      await (async () => { try {
    return await mn.value.deleteSession();
  } catch (__) {
    return null;
  } })();
      mn.value.disconnect();
    }
    await killGjoa();
    if (((_truthy) => _truthy !== false && _truthy != null)(profile.value)) {
      if (((_truthy) => _truthy !== false && _truthy != null)(opts.verbose)) {
        logErr(("".concat("profile preserved at ", profile.value.path, " for inspection")));
      } else {
        await (async () => { try {
    return await profile.value.cleanup();
  } catch (__) {
    return null;
  } })();
      }
    }
  } })();
    emit({type: "summary", pass: pass.value, fail: fail.value, skip: skip.value, durationMs: (Date.now() - start), binary: gjoaBin});
    return {pass: pass.value, fail: fail.value, skip: skip.value};
  }
}

const cliArgs = process.argv.slice(2);

const cliVerbose = cliArgs.includes("--verbose");

const cliHeaded = cliArgs.includes("--headed");

const cliGrep = (() => { let i = 0; let grep = null; while (true) {
    if ((i >= cliArgs.length)) { return grep; } else { const a = cliArgs[i]; if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(a, "--grep")) && cliArgs[(i + 1)]))) { const _recur_0 = (i + 2); const _recur_1 = cliArgs[(i + 1)]; i = _recur_0; grep = _recur_1; continue; } else if (((_truthy) => _truthy !== false && _truthy != null)(a.startsWith("--grep="))) { const _recur_0 = (i + 1); const _recur_1 = a.slice("--grep=".length); i = _recur_0; grep = _recur_1; continue; } else { const _recur_0 = (i + 1); const _recur_1 = grep; i = _recur_0; grep = _recur_1; continue; } }
  } })();

function cli_val(args, flag) {
  return (() => { let i = 0; while (true) {
    if ((i >= args.length)) { return null; } else { const a = args[i]; if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(a, flag)) && args[(i + 1)]))) { return args[(i + 1)]; } else if (((_truthy) => _truthy !== false && _truthy != null)(a.startsWith(("".concat(flag, "="))))) { return (() => { const flag_len = flag.length; return a.slice((flag_len + 1)); })(); } else { const _recur_0 = (i + 1); i = _recur_0; continue; } }
  } })();
}

const cliSubsystem = cli_val(cliArgs, "--subsystem");

const cliLane = cli_val(cliArgs, "--lane");

const cliExcludeLane = cli_val(cliArgs, "--exclude-lane");

const cliFiles = cli_val(cliArgs, "--files");

const cliListLanes = cliArgs.includes("--list-lanes");

const cliMarionettePort = (() => { const v = ((_logical) => (_logical !== false && _logical != null ? _logical : process.env.GJOA_MARIONETTE_PORT))(cli_val(cliArgs, "--marionette-port")); return (((_truthy) => _truthy !== false && _truthy != null)(v) ? parseInt(v, 10) : null); })();

async function list_lanes_bang(opts) {
  const testDir = join(process.cwd(), ".beagle-tools", "gjoa", "tests", "integration");
  const suites = await loadTests(testDir);
  const tags = load_tags();
  const keep = suite_keepset(tags, opts);
  const bases = suites.map((s) => strip_ext(s.file));
  const kept = (((_truthy) => _truthy !== false && _truthy != null)(keep) ? bases.filter((b) => (((_truthy) => _truthy !== false && _truthy != null)(keep.exclude) ? (!((_truthy) => _truthy !== false && _truthy != null)(keep.exclude.has(b))) : keep.keep.has(b))) : bases);
  return console.log(JSON.stringify({filter: ((((_truthy) => _truthy !== false && _truthy != null)(opts.files)) ? ("".concat("--files ", opts.files)) : (((_truthy) => _truthy !== false && _truthy != null)(opts.subsystem)) ? ("".concat("--subsystem ", opts.subsystem)) : (((_truthy) => _truthy !== false && _truthy != null)(opts.lane)) ? ("".concat("--lane ", opts.lane)) : (((_truthy) => _truthy !== false && _truthy != null)(opts.excludeLane)) ? ("".concat("--exclude-lane ", opts.excludeLane)) : "none (all)"), total: bases.length, kept: kept.slice().sort().length, files: kept.slice().sort()}, null, 2));
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  const opts = {verbose: cliVerbose, grep: cliGrep, headed: cliHeaded, subsystem: cliSubsystem, lane: cliLane, excludeLane: cliExcludeLane, files: cliFiles, marionettePort: cliMarionettePort};
  if (((_truthy) => _truthy !== false && _truthy != null)(cliListLanes)) {
    list_lanes_bang(opts).catch((e) => { logErr(("".concat("fatal: ", ((_logical) => (_logical !== false && _logical != null ? _logical : e))(e.stack))));
return process.exit(1); });
  } else {
    run_all_bang(opts).then((res) => process.exit(((res.fail > 0) ? 1 : 0))).catch((e) => { logErr(("".concat("fatal: ", ((_logical) => (_logical !== false && _logical != null ? _logical : e))(e.stack))));
return process.exit(1); });
  }
}
