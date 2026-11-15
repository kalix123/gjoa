import { parseArgs } from 'util';
import { join } from 'path';
import { confidence_interval95, median, format_result } from './stats.js';
import { equivV as $$bc$equiv, get as $$bc$get, range as $$bc$range } from 'beagle/core.js';

const parsed = parseArgs({args: Bun.argv.slice(2), strict: false, options: {runs: {type: "string", default: "20"}, gjoa_bin: {type: "string"}, firefox_bin: {type: "string"}, skip_cache_drop: {type: "boolean", default: false}}});

const values = parsed.values;

const NUM_RUNS = parseInt($$bc$get(values, "runs"), 10);

if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(Number.isFinite(NUM_RUNS))) || (NUM_RUNS < 2)))) {
  console.error("ERROR: --runs must be >= 2 (first run is dropped as warm-up).");
  process.exit(1);
}

function localGjoa(name) {
  if (($$bc$equiv(name, "gjoa"))) {
    const local = ("".concat(process.cwd(), "/result/bin/gjoa"));
    return (() => { try {
    const stat = Bun.file(local);
  if ((stat.size > 0)) {
    return local;
  }
  } catch (e) {
    return null;
  } })();
  }
}

function findBinary(name) {
  const local = localGjoa(name);
  if (((_truthy) => _truthy !== false && _truthy != null)(local)) {
    return local;
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

const SKIP_CACHE_DROP = $$bc$get(values, "skip-cache-drop");

function dropCaches() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(SKIP_CACHE_DROP))) {
    const result = Bun.spawnSync(["sudo", "sh", "-c", "sync; echo 3 > /proc/sys/vm/drop_caches"]);
    if ((!($$bc$equiv(result.exitCode, 0)))) {
      return console.error("WARN: failed to drop caches (not root?). Use --skip-cache-drop or run with sudo.");
    }
  }
}

async function measureColdStart_bang(binary, windowPattern) {
  const profileDir = ("".concat(join(process.cwd(), "tools", "bench"), "/.bench-profile-", Date.now()));
  Bun.spawnSync(["mkdir", "-p", profileDir]);
  return (async () => { try {
    await dropCaches();
  await Bun.sleep(100);
  const start = performance.now();
  const browser = Bun.spawn([binary, "--no-remote", "--profile", profileDir, "about:blank"], {stdout: "ignore", stderr: "ignore"});
  const xdotool = Bun.spawn(["xdotool", "search", "--sync", "--onlyvisible", "--name", windowPattern], {stdout: "pipe", stderr: "ignore"});
  const state = ({value: false, watches: {}});
  const timeout = setTimeout(() => { (() => { const _a = state, _v = true; const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
xdotool.kill();
return browser.kill(); }, 30000);
  const exitCode = await xdotool.exited;
  const elapsed = (performance.now() - start);
  clearTimeout(timeout);
  browser.kill();
  await browser.exited;
  if (state.value) {
    (() => { throw new Error(("".concat("xdotool timed out after 30s waiting for a window matching /", windowPattern, "/. ", "Binary may have failed to launch, or the title pattern is wrong."))); })();
  }
  if ((!($$bc$equiv(exitCode, 0)))) {
    (() => { throw new Error(("".concat("xdotool exited with code ", exitCode, " (no window matched /", windowPattern, "/). ", "Refusing to record a bogus timing."))); })();
  }
  return elapsed;
  }  finally {
    Bun.spawnSync(["rm", "-rf", profileDir]);
  } })();
}

async function runBenchmark_bang(binary, label, windowPattern) {
  const times = ({value: [], watches: {}});
  console.log(("".concat("\n  Running ", label, " (", NUM_RUNS, " runs)...")));
  console.log(("".concat("  Binary: ", binary)));
  for (const i of $$bc$range(NUM_RUNS)) {
  const t = await measureColdStart_bang(binary, windowPattern);
  (() => { const _a = times; const _old = _a.value; _a.value = (conj)(_old, t); for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _a.value); return _a.value; })();
  process.stdout.write(("".concat("    Run ", (i + 1), "/", NUM_RUNS, ": ", t.toFixed(1), " ms\n")));
  await Bun.sleep(500);
};
  const results = times.value.slice(1);
  const ci = confidence_interval95(results);
  const med = median(results);
  console.log(("".concat("\n  ", label, " results (excluding warm-up run):")));
  console.log(("".concat("    Median: ", med.toFixed(1), " ms")));
  console.log(("".concat("    Mean:   ", ci.mean.toFixed(1), " ms  [", ci.low.toFixed(1), " .. ", ci.high.toFixed(1), "] (95% CI)")));
  return results;
}

if (($$bc$equiv(Bun.which("xdotool"), null))) {
  console.error("ERROR: xdotool not found on PATH. Install it (e.g. `apt install xdotool`).");
  process.exit(1);
}

console.log("=== Cold Start Benchmark ===");

console.log(("".concat("  Runs: ", NUM_RUNS, " (first dropped as warm-up)")));

console.log(("".concat("  Gjoa:    ", GJOA_BIN)));

console.log(("".concat("  Firefox: ", FIREFOX_BIN)));

const gjoaTimes = await runBenchmark_bang(GJOA_BIN, "Gjoa", "Gjoa|gjoa");

const firefoxTimes = await runBenchmark_bang(FIREFOX_BIN, "Firefox", "Mozilla Firefox|Firefox");

console.log("\n=== Comparison ===\n");

console.log(format_result("Cold Start (time to window visible)", gjoaTimes, firefoxTimes, "ms"));

console.log("");
