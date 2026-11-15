import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { join } from 'path';
import { parseSecurity } from '../prep/patch-header.js';
import { REPO_ROOT, PATCHES_DIR } from '../prep/paths.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const DISCLOSURE_PATH = join(REPO_ROOT, "configs", "security-patches.json");

function sha256_file(p) {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}

function sh_ok(cmd) {
  return (() => { try {
    execSync(cmd, {encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 180000});
  return true;
  } catch (__e) {
    return false;
  } })();
}

function list_patches() {
  return readdirSync(PATCHES_DIR).filter((p) => p.endsWith(".patch")).sort();
}

function apply_status_map(patches) {
  const cache = ("".concat(process.env.HOME, "/.cache/gjoa/sources"));
  const gjoa = JSON.parse(readFileSync(join(REPO_ROOT, "gjoa.json"), "utf8"));
  const tarball = ("".concat(cache, "/firefox-", gjoa.firefox.version, ".source.tar.xz"));
  const out = {};
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(tarball)))) {
    patches.forEach((p) => {
  (out[p] = "unknown (no cached source)");
});
    return out;
  } else {
    const tmp = "/tmp/gjoa-disclosure-engine";
    if ((!sh_ok(("".concat("rm -rf ", tmp, " && mkdir -p ", tmp, " && tar -xJf ", tarball, " -C ", tmp, " --strip-components=1"))))) {
      patches.forEach((p) => {
  (out[p] = "unknown (extract failed)");
});
      return out;
    } else {
      sh_ok(("".concat("cd ", tmp, " && git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -q -m baseline")));
      const n = patches.length;
      (() => { let i = 0; let stopped = false; while (true) {
    if ((i < n)) {  const p = patches[i]; if (stopped) { (out[p] = "blocked (earlier patch failed)"); const _recur_0 = (i + 1); const _recur_1 = stopped; i = _recur_0; stopped = _recur_1; continue; } else { const ok = sh_ok(("".concat("cd ", tmp, " && git apply ", join(PATCHES_DIR, p)))); (out[p] = (ok ? "applies" : "FAILED")); const _recur_0 = (i + 1); const _recur_1 = (stopped || (!ok)); i = _recur_0; stopped = _recur_1; continue; } } else { return null; }
  } })();
      return out;
    }
  }
}

export function build_disclosure() {
  const patches = list_patches();
  const statuses = apply_status_map(patches);
  const entries = [];
  patches.forEach((p) => {
  const text = readFileSync(join(PATCHES_DIR, p), "utf8");
  const sec = parseSecurity(text);
  if (((_truthy) => _truthy !== false && _truthy != null)(sec)) {
    entries.push({id: ((_logical) => (_logical !== false && _logical != null ? _logical : null))(sec.id), refs: ((_logical) => (_logical !== false && _logical != null ? _logical : []))(sec.refs), mitigates: ((_logical) => (_logical !== false && _logical != null ? _logical : null))(sec.mitigates), persist: sec.persist, file: ("".concat("patches/", p)), sha256: sha256_file(join(PATCHES_DIR, p)), applyStatus: ((_logical) => (_logical !== false && _logical != null ? _logical : "unknown"))(statuses[p])});
  }
});
  return {$schema: "gjoa security-patch disclosure (generated — do not edit by hand)", note: (($$bc$equiv(entries.length, 0)) ? "No security-tagged patches. This empty list is the correct current state; a `# security:` block on any patches/*.patch will appear here automatically (regenerate via `bun run security:patch-disclosure`). A dropped entry shows as a tracked-file diff." : "Generated from patches/*.patch `# security:` headers by tools/security/patch-disclosure.bjs. Do not edit by hand — regenerate via `bun run security:patch-disclosure`."), generator: "tools/security/patch-disclosure.bjs", patches: entries};
}

function main_bang() {
  const disclosure = build_disclosure();
  writeFileSync(DISCLOSURE_PATH, ("".concat(JSON.stringify(disclosure, null, 2), "\n")));
  return console.error(("".concat("[patch-disclosure] wrote ", DISCLOSURE_PATH, " (", disclosure.patches.length, " security-tagged patch(es))")));
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
