import { existsSync, statSync, readdirSync, readFileSync } from 'fs';
import { join, resolve, relative } from 'path';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO_ROOT = process.cwd();

const BJS_ROOT = join(REPO_ROOT, "src", "gjoa", "chrome", "bjs");

const OUT_ROOT = join(REPO_ROOT, ".beagle-out");

const MACROS_PATH = join(BJS_ROOT, "macros.bjs");

const BEAGLE_REF_FILE = join(REPO_ROOT, "configs", "beagle.ref");

const BEAGLE_REF = (() => { const lines = readFileSync(BEAGLE_REF_FILE, "utf8").split("\n"); const ref = lines.find((l) => ((l.trim().length > 0) && (!((_truthy) => _truthy !== false && _truthy != null)(l.trim().startsWith("#"))))); return (((_truthy) => _truthy !== false && _truthy != null)(ref) ? ref.trim() : (() => { throw new Error("configs/beagle.ref has no Beagle object ID"); })()); })();

const BEAGLE_PIN_ROOT = ((_logical) => (_logical !== false && _logical != null ? _logical : resolve(process.env.HOME, "code", "beagle", "pins", BEAGLE_REF)))(process.env.BEAGLE_PIN_ROOT);

const BEAGLE_BUILD_ALL = resolve(BEAGLE_PIN_ROOT, "bin", "beagle-build-all").replaceAll(String.fromCharCode(92), "/");

function find_bjs_files(dir) {
  const results = [];
  const entries = readdirSync(dir, {withFileTypes: true});
  const n = entries.length;
  (() => { let i = 0; while (true) {
    if ((i < n)) {  const entry = entries[i]; const full = join(dir, entry.name); (((_truthy) => _truthy !== false && _truthy != null)(entry.isDirectory()) ? (() => { const sub = find_bjs_files(full); const m = sub.length; return (() => { let j = 0; while (true) {
    if ((j < m)) { results.push(sub[j]); const _recur_0 = (j + 1); j = _recur_0; continue; } else { return null; }
  } })(); })() : (((_truthy) => _truthy !== false && _truthy != null)(entry.name.endsWith(".bjs")) ? (() => { return results.push(full); })() : null)); const _recur_0 = (i + 1); i = _recur_0; continue; } else { return null; }
  } })();
  return results;
}

function should_skip(rel) {
  return ((((_truthy) => _truthy !== false && _truthy != null)(rel.startsWith("test/"))) ? true : (((_truthy) => _truthy !== false && _truthy != null)(rel.endsWith(".test.bjs"))) ? true : false);
}

function up_to_date_p(src, out) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(out)))) {
    return false;
  } else {
    const out_m = statSync(out).mtimeMs;
    return ((out_m >= statSync(src).mtimeMs) && ((out_m >= statSync(BEAGLE_REF_FILE).mtimeMs) && ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(MACROS_PATH))) || (out_m >= statSync(MACROS_PATH).mtimeMs))));
  }
}

async function run_compile() {
  const all_files = find_bjs_files(BJS_ROOT);
  const sorted = all_files.sort();
  const total = sorted.length;
  const sources = [];
  (() => { let i = 0; while (true) {
    if ((i < total)) {  const src = sorted[i]; const rel = relative(BJS_ROOT, src); ((!should_skip(rel)) ? (() => { return sources.push(src); })() : null); const _recur_0 = (i + 1); i = _recur_0; continue; } else { return null; }
  } })();
  const n = sources.length;
  const stale_count = (() => { let i = 0; let count = 0; while (true) {
    if ((i < n)) { const src = sources[i]; const rel = relative(BJS_ROOT, src); const out_rel = rel.replace(new RegExp("\\.bjs$"), ".js"); const out_path = join(OUT_ROOT, "gjoa", out_rel); const _recur_0 = (i + 1); const _recur_1 = (up_to_date_p(src, out_path) ? count : (count + 1)); i = _recur_0; count = _recur_1; continue; } else { return count; }
  } })();
  if (($$bc$equiv(stale_count, 0))) {
    console.log(("".concat("✓ 0 compiled, ", n, " cached → .beagle-out/gjoa/")));
  } else {
    const cmd = ["bash", BEAGLE_BUILD_ALL];
    const __ = (() => { let i = 0; while (true) {
    if ((i < n)) { cmd.push(sources[i]); const _recur_0 = (i + 1); i = _recur_0; continue; } else { return null; }
  } })();
    const ___shadow1 = cmd.push("--out");
    const ___shadow2 = cmd.push(OUT_ROOT);
    const proc = Bun.spawn({cmd: cmd, cwd: REPO_ROOT, stdout: "pipe", stderr: "pipe"});
    const results = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
    const code = results[2];
    const output = ("".concat(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(results[0]), ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(results[1]))).trim();
    if ((!($$bc$equiv(code, 0)))) {
      console.error(output);
      process.exit(1);
    } else {
      console.log(("".concat("✓ ", n, " compiled, 0 cached → .beagle-out/gjoa/")));
    }
  }
  return 0;
}

await run_compile();
