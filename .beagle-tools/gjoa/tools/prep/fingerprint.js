import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { load_config_bang } from './config.js';
import { REPO_ROOT, SRC_DIR, PATCHES_DIR, ENGINE_BRANDING_DIR } from './paths.js';
import { log } from './log.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

function sha12(s) {
  return createHash("sha256").update(s).digest("hex").slice(0, 12);
}

function dir_fold_hash_bang(dir, suffix) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(dir)))) {
    return "none";
  } else {
    const names = readdirSync(dir).filter((n) => n.endsWith(suffix)).sort();
    const blob = ({value: "", watches: {}});
    names.forEach((n) => {
  (() => { const _a = blob, _v = ("".concat(blob.value, n, "\x00", readFileSync(join(dir, n), "utf8"))); const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
});
    return sha12(blob.value);
  }
}

function git_commit_bang() {
  const proc = Bun.spawnSync({cmd: ["git", "rev-parse", "--short", "HEAD"], cwd: REPO_ROOT, stdout: "pipe", stderr: "pipe"});
  return (($$bc$equiv(proc.exitCode, 0)) ? proc.stdout.toString().trim() : "unknown");
}

function beagle_ref_bang() {
  const proc = Bun.spawnSync({cmd: ["git", "-C", join(REPO_ROOT, "..", "beagle"), "rev-parse", "--short", "HEAD"], cwd: REPO_ROOT, stdout: "pipe", stderr: "pipe"});
  return (($$bc$equiv(proc.exitCode, 0)) ? proc.stdout.toString().trim() : "unknown");
}

export function fingerprint_bang() {
  const cfg = load_config_bang();
  const bn = cfg.binaryName;
  const patch_hash = dir_fold_hash_bang(PATCHES_DIR, ".patch");
  const dark_hash = dir_fold_hash_bang(join(SRC_DIR, "chrome", "bjs", "dark-mode"), ".bjs");
  const fixes_path = join(SRC_DIR, "toolkit", "components", "content-classifier", "darkmode-fixes.json");
  const fixes_hash = (((_truthy) => _truthy !== false && _truthy != null)(existsSync(fixes_path)) ? sha12(readFileSync(fixes_path, "utf8")) : "none");
  const commit = git_commit_bang();
  const beagle = beagle_ref_bang();
  const date = new Date().toISOString();
  const pref_file = join(ENGINE_BRANDING_DIR, bn, "pref", "firefox-branding.js");
  const block = ("".concat("\n\n// ===== gjoa build fingerprint (tools/prep/fingerprint.bjs) =====\n", "pref(\"gjoa.build.engine-patch-hash\", \"", patch_hash, "\");\n", "pref(\"gjoa.build.dark-bundle-hash\", \"", dark_hash, "\");\n", "pref(\"gjoa.build.expected-dark-bundle-hash\", \"", dark_hash, "\");\n", "pref(\"gjoa.build.dark-fixes-hash\", \"", fixes_hash, "\");\n", "pref(\"gjoa.build.commit\", \"", commit, "\");\n", "pref(\"gjoa.build.beagle-ref\", \"", beagle, "\");\n", "pref(\"gjoa.build.date\", \"", date, "\");\n", "pref(\"gjoa.build.provenance\", \"unknown\");\n"));
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(pref_file))) {
    writeFileSync(pref_file, ("".concat(readFileSync(pref_file, "utf8"), block)));
    return log.info(("".concat("fingerprint: patch=", patch_hash, " dark=", dark_hash, " fixes=", fixes_hash, " @", commit)));
  } else {
    return log.warn(("".concat("fingerprint: branding pref file not found at ", pref_file, " — skipping")));
  }
}
