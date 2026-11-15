import { existsSync, readdirSync, statSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { ENGINE_DIR, REPO_ROOT, SRC_DIR } from './paths.js';
import { log } from './log.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const BEAGLE_REF_FILE = join(REPO_ROOT, "configs", "beagle.ref");

function pinned_ref() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(BEAGLE_REF_FILE)))) {
    return (() => { throw new Error("configs/beagle.ref is missing"); })();
  } else {
    const lines = readFileSync(BEAGLE_REF_FILE, "utf8").split("\n");
    const ref = lines.find((l) => ((l.trim().length > 0) && (!((_truthy) => _truthy !== false && _truthy != null)(l.trim().startsWith("#")))));
    return (((_truthy) => _truthy !== false && _truthy != null)(ref) ? ref.trim() : (() => { throw new Error("configs/beagle.ref has no Beagle object ID"); })());
  }
}

const BEAGLE_PIN_ROOT = ((_logical) => (_logical !== false && _logical != null ? _logical : resolve(process.env.HOME, "code", "beagle", "pins", pinned_ref())))(process.env.BEAGLE_PIN_ROOT);

const BEAGLE_BUILD = resolve(BEAGLE_PIN_ROOT, "bin", "beagle-build").replaceAll(String.fromCharCode(92), "/");

const BEAGLE_CORE_SRC = resolve(BEAGLE_PIN_ROOT, "beagle-lib", "lib", "beagle", "core.js");

const VENDORED_CORE_DST = join(SRC_DIR, "browser", "components", "gjoa", "beagle", "core.js");

function vendor_core_js_bang() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(BEAGLE_CORE_SRC)))) {
    return (() => { throw new Error(("".concat("vendor-core-js!: ", BEAGLE_CORE_SRC, " not found — is the Beagle content pin (", BEAGLE_PIN_ROOT, ") present?"))); })();
  } else {
    const body = readFileSync(BEAGLE_CORE_SRC, "utf8");
    const ref = pinned_ref().slice(0, 12);
    const header = ("".concat("// AUTO-VENDORED by tools/prep/overlay.bjs from ", "$BEAGLE_PIN_ROOT/beagle-lib/lib/beagle/core.js (configs/beagle.ref = ", ref, ").\n", "// DO NOT EDIT BY HAND — re-vendored on every `bun run import` so the\n", "// $$bc value-semantics runtime always matches the beagle the chrome was\n", "// compiled against. Bump configs/beagle.ref + re-import to change it.\n"));
    const out = ("".concat(header, body));
    writeFileSync(VENDORED_CORE_DST, out);
    return log.step(("".concat("vendored beagle/core.js @ ", ref)));
  }
}

function count_files(dir) {
  return readdirSync(dir).reduce((count, name) => { const path = join(dir, name);
return (((_truthy) => _truthy !== false && _truthy != null)(statSync(path).isDirectory()) ? (count + count_files(path)) : (count + 1)); }, 0);
}

export function overlay_src_bang() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(SRC_DIR)))) {
    log.info("no src/gjoa/ overlays present, skipping");
    return null;
  } else {
    const entries = readdirSync(SRC_DIR);
    if (($$bc$equiv(entries.length, 0))) {
      log.info("src/gjoa/ is empty, skipping overlay");
      return null;
    } else {
      log.step("applying src/gjoa/ overlays");
      vendor_core_js_bang();
      Bun.spawnSync(["cp", "-a", ("".concat(SRC_DIR, "/.")), ("".concat(ENGINE_DIR, "/"))]);
      const loader_src = join(SRC_DIR, "browser", "components", "gjoa", "GjoaLoader.bjs");
      const loader_out = join(ENGINE_DIR, "browser", "components", "gjoa", "GjoaLoader.sys.mjs");
      const stray = join(ENGINE_DIR, "browser", "components", "gjoa", "GjoaLoader.bjs");
      if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(loader_src))) {
        const proc = Bun.spawnSync({cmd: ["bash", BEAGLE_BUILD, loader_src, loader_out], cwd: REPO_ROOT, env: Object.assign({}, process.env, {["BEAGLE_JS_RUNTIME_PREFIX"]: "resource:///modules/gjoa/beagle/"}), stdout: "pipe", stderr: "pipe"});
        if ((!($$bc$equiv(proc.exitCode, 0)))) {
          (() => { throw new Error(("".concat("beagle-build failed compiling GjoaLoader.bjs:\n", proc.stderr.toString()))); })();
        }
        if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(stray))) {
          rmSync(stray);
        }
      }
      const file_count = count_files(SRC_DIR);
      return log.ok(("".concat("overlaid ", file_count, " file", (($$bc$equiv(file_count, 1)) ? "" : "s"))));
    }
  }
}
