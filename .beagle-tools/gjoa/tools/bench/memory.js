import { parseArgs } from 'util';
import { join } from 'path';
import { format_result } from './stats.js';
import { equivV as $$bc$equiv, get as $$bc$get, range as $$bc$range } from 'beagle/core.js';

const parsed = parseArgs({args: Bun.argv.slice(2), strict: false, options: {tabs: {type: "string", default: "50"}, gjoa_bin: {type: "string"}, firefox_bin: {type: "string"}, settle_time: {type: "string", default: "10000"}}});

const values = parsed.values;

function cli_count(raw, fallback) {
  const n = parseInt(raw, 10);
  return (((_truthy) => _truthy !== false && _truthy != null)(((typeof n === 'number') && ((_logical) => (_logical !== false && _logical != null ? (n >= 0) : _logical))(Number.isInteger(n)))) ? Math.trunc(n) : fallback);
}

const NUM_TABS = cli_count($$bc$get(values, "tabs"), 50);

const SETTLE_MS = cli_count($$bc$get(values, "settle-time"), 10000);

function findBinary(name) {
  const local_result = (($$bc$equiv(name, "gjoa")) ? (() => { const local = ("".concat(process.cwd(), "/result/bin/gjoa"));
return (() => { try {
    const stat = Bun.file(local);
  if ((stat.size > 0)) {
    return local;
  }
  } catch (e) {
    return null;
  } })(); })() : null);
  if (((_truthy) => _truthy !== false && _truthy != null)(local_result)) {
    return local_result;
  } else {
    const result = Bun.spawnSync(["which", name]);
    const path = result.stdout.toString().trim();
    if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(result.exitCode, 0)) && path))) {
      return path;
    } else {
      console.error(("".concat("ERROR: cannot find ", name, " binary. Use --", name, "-bin=<path>")));
      return process.exit(1);
    }
  }
}

const GJOA_BIN = ((_logical) => (_logical !== false && _logical != null ? _logical : findBinary("gjoa")))($$bc$get(values, "gjoa-bin"));

const FIREFOX_BIN = ((_logical) => (_logical !== false && _logical != null ? _logical : findBinary("firefox")))($$bc$get(values, "firefox-bin"));

function getProcessTree_bang(rootPid) {
  const pids = ({value: [rootPid], watches: {}});
  const result = Bun.spawnSync(["pgrep", "-P", String(rootPid)]);
  if (($$bc$equiv(result.exitCode, 0))) {
    const children = result.stdout.toString().trim().split("\n").filter(Boolean);
    children.forEach((child) => {
  const childPid = parseInt(child, 10);
  if ((!isNaN(childPid))) {
    (() => { const _a = pids, _v = pids.value.concat(getProcessTree_bang(childPid)); const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
  }
});
  }
  return pids.value;
}

function getTreePssKB_bang(rootPid) {
  const pids = getProcessTree_bang(rootPid);
  const totalKB = ({value: 0, watches: {}});
  const re = new RegExp("^Pss:\\s+(\\d+)\\s+kB", "m");
  pids.forEach((pid) => {
  (() => { try {
    const rollup = Bun.spawnSync(["cat", ("".concat("/proc/", pid, "/smaps_rollup"))]);
  const text = rollup.stdout.toString();
  const match = text.match(re);
  if (((_truthy) => _truthy !== false && _truthy != null)(match)) {
    return (() => { const _a = totalKB, _v = (totalKB.value + parseInt($$bc$get(match, 1), 10)); const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
  }
  } catch (e) {
    return null;
  } })();
});
  return totalKB.value;
}

async function measureMemory_bang(binary, label, windowPattern) {
  const profileDir = ("".concat(join(process.cwd(), "tools", "bench"), "/.bench-profile-mem-", Date.now()));
  Bun.spawnSync(["mkdir", "-p", profileDir]);
  return (async () => { try {
    console.log(("".concat("\n  Launching ", label, "...")));
  console.log(("".concat("  Binary: ", binary)));
  console.log(("".concat("  Tabs to open: ", NUM_TABS)));
  const urls = Array.from({length: NUM_TABS}, () => "about:blank");
  const browser = Bun.spawn([binary, "--no-remote", "--profile", profileDir].concat(urls), {stdout: "ignore", stderr: "ignore"});
  const pid = browser.pid;
  console.log(("".concat("  PID: ", pid)));
  const xdotool = Bun.spawn(["xdotool", "search", "--sync", "--onlyvisible", "--name", windowPattern], {stdout: "ignore", stderr: "ignore"});
  const state = ({value: false, watches: {}});
  const windowTimeout = setTimeout(() => { (() => { const _a = state, _v = true; const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
xdotool.kill();
return browser.kill(); }, 30000);
  const windowExit = await xdotool.exited;
  clearTimeout(windowTimeout);
  if (state.value) {
    (() => { throw new Error(("".concat("xdotool timed out after 30s waiting for a window matching /", windowPattern, "/. ", "Binary may have failed to launch, or the title pattern is wrong."))); })();
  }
  if ((!($$bc$equiv(windowExit, 0)))) {
    (() => { throw new Error(("".concat("xdotool exited with code ", windowExit, " (no window matched /", windowPattern, "/). ", "Refusing to record a bogus measurement."))); })();
  }
  console.log(("".concat("  Waiting ", (SETTLE_MS / 1000), "s for settle...")));
  await Bun.sleep(SETTLE_MS);
  const pssKB = getTreePssKB_bang(pid);
  const totalMB = (pssKB / 1024);
  const perTabMB = (totalMB / NUM_TABS);
  console.log(("".concat("  Total RSS: ", totalMB.toFixed(1), " MB")));
  console.log(("".concat("  Per-tab:   ", perTabMB.toFixed(2), " MB")));
  browser.kill();
  await browser.exited;
  return {totalMB: totalMB, perTabMB: perTabMB, tabCount: NUM_TABS};
  }  finally {
    Bun.spawnSync(["rm", "-rf", profileDir]);
  } })();
}

async function runBenchmark_bang(binary, label, windowPattern, runs) {
  const results = ({value: [], watches: {}});
  for (const i of $$bc$range(runs)) {
  console.log(("".concat("\n  --- ", label, " run ", (i + 1), "/", runs, " ---")));
  const res = await measureMemory_bang(binary, label, windowPattern);
  (() => { const _a = results; const _old = _a.value; _a.value = (conj)(_old, res.totalMB); for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _a.value); return _a.value; })();
  await Bun.sleep(2000);
};
  return results.value;
}

if (($$bc$equiv(Bun.which("xdotool"), null))) {
  console.error("ERROR: xdotool not found on PATH. Install it (e.g. `apt install xdotool`).");
  process.exit(1);
}

console.log("=== Memory Benchmark ===");

console.log(("".concat("  Tabs: ", NUM_TABS)));

console.log(("".concat("  Settle time: ", (SETTLE_MS / 1000), "s")));

console.log(("".concat("  Gjoa:    ", GJOA_BIN)));

console.log(("".concat("  Firefox: ", FIREFOX_BIN)));

const RUNS = 3;

const gjoaResults = await runBenchmark_bang(GJOA_BIN, "Gjoa", "Gjoa|gjoa", RUNS);

const firefoxResults = await runBenchmark_bang(FIREFOX_BIN, "Firefox", "Mozilla Firefox|Firefox", RUNS);

console.log("\n=== Comparison ===\n");

console.log(format_result(("".concat("Memory (", NUM_TABS, " tabs, total PSS MB)")), gjoaResults, firefoxResults, "MB"));

const gjoaPerTab = gjoaResults.map((v) => (v / NUM_TABS));

const firefoxPerTab = firefoxResults.map((v) => (v / NUM_TABS));

console.log("");

console.log(format_result("Memory (per-tab MB)", gjoaPerTab, firefoxPerTab, "MB"));

console.log("");
