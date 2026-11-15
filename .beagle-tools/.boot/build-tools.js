import { existsSync, statSync, readdirSync, readFileSync } from 'fs';
import { join, resolve, relative } from 'path';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO_ROOT = process.cwd();

const OUT_ROOT = join(REPO_ROOT, ".beagle-tools");

const BEAGLE_REF_FILE = join(REPO_ROOT, "configs", "beagle.ref");

const BEAGLE_REF = (() => { const lines = readFileSync(BEAGLE_REF_FILE, "utf8").split("\n"); const ref = lines.find((l) => ((l.trim().length > 0) && (!((_truthy) => _truthy !== false && _truthy != null)(l.trim().startsWith("#"))))); return (((_truthy) => _truthy !== false && _truthy != null)(ref) ? ref.trim() : (() => { throw new Error("configs/beagle.ref has no Beagle object ID"); })()); })();

const BEAGLE_PIN_ROOT = ((_logical) => (_logical !== false && _logical != null ? _logical : resolve(process.env.HOME, "code", "beagle", "pins", BEAGLE_REF)))(process.env.BEAGLE_PIN_ROOT);

const BEAGLE_BUILD_ALL = resolve(BEAGLE_PIN_ROOT, "bin", "beagle-build-all").replaceAll(String.fromCharCode(92), "/");

const SRC_DIRS = ["tools", "tests"];

function find_bjs(dir) {
  const out = [];
  const entries = readdirSync(dir, {withFileTypes: true});
  const n = entries.length;
  (() => { let i = 0; while (true) {
    if ((i < n)) {  const entry = entries[i]; const full = join(dir, entry.name); (((_truthy) => _truthy !== false && _truthy != null)(entry.isDirectory()) ? (() => { const sub = find_bjs(full); const m = sub.length; return (() => { let j = 0; while (true) {
    if ((j < m)) { out.push(sub[j]); const _recur_0 = (j + 1); j = _recur_0; continue; } else { return null; }
  } })(); })() : (((_truthy) => _truthy !== false && _truthy != null)(entry.name.endsWith(".bjs")) ? (() => { return out.push(full); })() : null)); const _recur_0 = (i + 1); i = _recur_0; continue; } else { return null; }
  } })();
  return out;
}

function stale_p(src, out) {
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(out))) {
    const out_m = statSync(out).mtimeMs;
    return ((statSync(src).mtimeMs > out_m) || (statSync(BEAGLE_REF_FILE).mtimeMs > out_m));
  } else {
    return true;
  }
}

async function run() {
  const files = [];
  const nd = SRC_DIRS.length;
  (() => { let d = 0; while (true) {
    if ((d < nd)) { (() => { const root = join(REPO_ROOT, SRC_DIRS[d]); if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(root))) {
  const found = find_bjs(root);
  const m = found.length;
  return (() => { let k = 0; while (true) {
    if ((k < m)) { files.push(found[k]); const _recur_0 = (k + 1); k = _recur_0; continue; } else { return null; }
  } })();
} })(); const _recur_0 = (d + 1); d = _recur_0; continue; } else { return null; }
  } })();
  const sorted = files.sort();
  const n = sorted.length;
  const stale_count = (() => { let i = 0; let count = 0; while (true) {
    if ((i < n)) { const src = sorted[i]; const rel = relative(REPO_ROOT, src); const out = join(OUT_ROOT, "gjoa", rel.replace(new RegExp("\\.bjs$"), ".js")); const _recur_0 = (i + 1); const _recur_1 = (stale_p(src, out) ? (count + 1) : count); i = _recur_0; count = _recur_1; continue; } else { return count; }
  } })();
  if (($$bc$equiv(stale_count, 0))) {
    console.error(("".concat("\x1b[2m[tools]\x1b[0m compiled 0, ", n, " cached → .beagle-tools/gjoa/")));
  } else {
    const proc = Bun.spawn({cmd: ["bash", BEAGLE_BUILD_ALL, "tools", "tests", "--out", OUT_ROOT], cwd: REPO_ROOT, stdout: "pipe", stderr: "pipe"});
    const results = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
    const code = results[2];
    const output = ("".concat(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(results[0]), ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(results[1]))).trim();
    if ((!($$bc$equiv(code, 0)))) {
      console.error(output);
      process.exit(1);
    } else {
      console.error(("".concat("\x1b[2m[tools]\x1b[0m compiled ", n, ", 0 cached → .beagle-tools/gjoa/")));
    }
  }
  return 0;
}

await run();
