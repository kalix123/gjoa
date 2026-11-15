import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { ENGINE_DIR, PATCHES_DIR } from './paths.js';
import { check_all } from './patch-header.js';
import { log } from './log.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const APPLIED_LOG = ".gjoa-applied-patches";

async function sha256OfFile(path) {
  const file = Bun.file(path);
  const buf = await file.arrayBuffer();
  const hash = new Bun.CryptoHasher("sha256");
  hash.update(buf);
  return hash.digest("hex");
}

async function run_git(args, cwd) {
  const proc = Bun.spawn({cmd: args, cwd: cwd, stdout: "inherit", stderr: "inherit"});
  return await proc.exited;
}

async function ensureEngineGit() {
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(join(ENGINE_DIR, ".git")))) {
    return null;
  } else {
    await run_git(["git", "init", "-q"], ENGINE_DIR);
    await run_git(["git", "add", "-A"], ENGINE_DIR);
    return await run_git(["git", "-c", "user.email=prep@gjoa", "-c", "user.name=prep", "commit", "-q", "-m", "vanilla mozilla-central"], ENGINE_DIR);
  }
}

async function readApplied() {
  const path = join(ENGINE_DIR, APPLIED_LOG);
  const applied = new Map();
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(path)))) {
    return applied;
  } else {
    const text = await Bun.file(path).text();
    const lines = text.split("\n").filter((s) => s.trim().length);
    lines.forEach((line) => { const m = line.match(new RegExp("^([^\\t]+)\\t([0-9a-f]{64})$"));
if ((!((_truthy) => _truthy !== false && _truthy != null)(m))) {
  (() => { throw new Error(("".concat("invalid ", APPLIED_LOG, " record: ", line))); })();
}
return applied.set(m[1].trim(), m[2]); });
    return applied;
  }
}

async function recordApplied(applied) {
  const path = join(ENGINE_DIR, APPLIED_LOG);
  const names = Array.from(applied.keys()).sort();
  const body = names.map((n) => ("".concat(n, "\t", applied.get(n)))).join("\n");
  return await Bun.write(path, ("".concat(body, "\n")));
}

async function runLint() {
  return (async () => { try {
    const problems = await check_all();
  if ((problems > 0)) {
    return log.warn(("".concat(problems, " patch(es) missing the gjoa-patch header")));
  }
  } catch (e) {
    return log.warn(("".concat("patch-header lint failed (non-fatal): ", e.message)));
  } })();
}

async function applyOne(name) {
  log.step(("".concat("applying patch ", name)));
  const path = join(PATCHES_DIR, name);
  const code = await run_git(["git", "apply", "--whitespace=nowarn", path], ENGINE_DIR);
  if ((!($$bc$equiv(code, 0)))) {
    const claims_path = join(PATCHES_DIR, name.replace(".patch", ".claims.json"));
    if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(claims_path))) {
      const repo = process.cwd();
      const applier = join(repo, ".beagle-tools", "gjoa", "tools", "projector", "apply-claims.js");
      const rc = await run_git(["bun", applier, claims_path, ENGINE_DIR], repo);
      return (($$bc$equiv(rc, 0)) ? log.ok(("".concat("  ", name, ": textual patch .rej'd — recovered via claim-doc replay (identity-anchored)"))) : (() => { throw new Error(("".concat("failed to apply patch ", name, ": git apply exited ", code, "; claim-doc fallback exited ", rc))); })());
    } else {
      return (() => { throw new Error(("".concat("failed to apply patch ", name, ": git apply exited ", code))); })();
    }
  }
}

export async function patches() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(PATCHES_DIR)))) {
    log.info("no patches/ directory, skipping");
    return null;
  } else {
    const allPatches = readdirSync(PATCHES_DIR).filter((f) => f.endsWith(".patch")).sort();
    if (($$bc$equiv(allPatches.length, 0))) {
      log.info("patches/ is empty, skipping");
      return null;
    } else {
      await runLint();
      await ensureEngineGit();
      const applied = await readApplied();
      return (async () => { let i = 0; let newCount = 0; while (true) {
    if ((i >= allPatches.length)) { return (($$bc$equiv(newCount, 0)) ? log.info(("".concat("all ", allPatches.length, " patches already applied"))) : (async () => { await recordApplied(applied);
return log.ok(("".concat("applied ", newCount, " new patch", (($$bc$equiv(newCount, 1)) ? "" : "es")))); })()); } else { const name = allPatches[i]; const curHash = await sha256OfFile(join(PATCHES_DIR, name)); const recordedHash = applied.get(name); if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(recordedHash, curHash)) : _logical))(applied.has(name)))) { const _recur_0 = (i + 1); const _recur_1 = newCount; i = _recur_0; newCount = _recur_1; continue; } else { (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(recordedHash, curHash))) : _logical))(applied.has(name))) ? (() => { return log.step(("".concat("patch ", name, " changed since last apply — re-applying"))); })() : null); await applyOne(name); applied.set(name, curHash); const _recur_0 = (i + 1); const _recur_1 = (newCount + 1); i = _recur_0; newCount = _recur_1; continue; } }
  } })();
    }
  }
}
