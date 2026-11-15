import { existsSync, statSync, readFileSync } from 'fs';
import { rm, symlink, cp } from 'fs/promises';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO_ROOT = process.cwd();

const DIST_CHROME = join(REPO_ROOT, "dist", "chrome");

const REPO_OBJDIR = join(REPO_ROOT, "engine", "obj-x86_64-pc-linux-gnu");

const ENV_OBJDIR = process.env.MOZ_OBJDIR;

const MOZ_OBJDIR = (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ENV_OBJDIR.startsWith(REPO_ROOT) : _logical))(ENV_OBJDIR)) ? ENV_OBJDIR : REPO_OBJDIR);

const INSTALL_ROOT = join(MOZ_OBJDIR, "dist", "bin");

const GJOA_DEV = join(INSTALL_ROOT, "gjoa-dev");

const SRC_TOOLKIT = join(REPO_ROOT, "src", "gjoa", "toolkit");

const ENG_TOOLKIT = join(REPO_ROOT, "engine", "toolkit");

const SRC_LOADER = join(REPO_ROOT, "src", "gjoa", "browser", "components", "gjoa", "GjoaLoader.bjs");

const ENG_LOADER = join(REPO_ROOT, "engine", "browser", "components", "gjoa", "GjoaLoader.sys.mjs");

const ENG_LOADER_STRAY = join(REPO_ROOT, "engine", "browser", "components", "gjoa", "GjoaLoader.bjs");

const BEAGLE_REF_FILE = join(REPO_ROOT, "configs", "beagle.ref");

const BEAGLE_REF = (() => { const lines = readFileSync(BEAGLE_REF_FILE, "utf8").split("\n"); const ref = lines.find((l) => ((l.trim().length > 0) && (!((_truthy) => _truthy !== false && _truthy != null)(l.trim().startsWith("#"))))); return (((_truthy) => _truthy !== false && _truthy != null)(ref) ? ref.trim() : (() => { throw new Error("configs/beagle.ref has no Beagle object ID"); })()); })();

const BEAGLE_PIN_ROOT = ((_logical) => (_logical !== false && _logical != null ? _logical : join(process.env.HOME, "code", "beagle", "pins", BEAGLE_REF)))(process.env.BEAGLE_PIN_ROOT);

const BEAGLE_BUILD = join(BEAGLE_PIN_ROOT, "bin", "beagle-build");

async function refresh_loader_bang() {
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(ENG_LOADER))) || (statSync(SRC_LOADER).mtimeMs > statSync(ENG_LOADER).mtimeMs)) : _logical))(existsSync(SRC_LOADER)))) {
    const r = spawnSync("bash", [BEAGLE_BUILD, SRC_LOADER, ENG_LOADER], {cwd: REPO_ROOT, env: Object.assign({}, process.env, {["BEAGLE_JS_RUNTIME_PREFIX"]: "resource:///modules/gjoa/beagle/"}), stdio: "inherit"});
    if ((!($$bc$equiv(r.status, 0)))) {
      console.error("✗ GjoaLoader.bjs recompile failed");
      process.exit(1);
    }
    await rm(ENG_LOADER_STRAY, {force: true});
    return console.log("✓ recompiled GjoaLoader.bjs → engine (loader symlinked live into the dev binary)");
  }
}

async function main_bang() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(DIST_CHROME)))) {
    console.error("✗ dist/chrome/ not built — run `bun run chrome:dist` first");
    process.exit(1);
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(INSTALL_ROOT)))) {
    console.error(("".concat("✗ install root not found at ", INSTALL_ROOT, " — has gjoa been built ", "via mach? (`cd engine && ./mach build`)")));
    process.exit(1);
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(GJOA_DEV))) {
    await rm(GJOA_DEV, {recursive: true, force: true});
  }
  await symlink(DIST_CHROME, GJOA_DEV, "dir");
  console.log(("".concat("✓ symlinked ", DIST_CHROME, " → ", GJOA_DEV)));
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(SRC_TOOLKIT))) {
    await cp(SRC_TOOLKIT, ENG_TOOLKIT, {recursive: true, force: true});
    console.log(("".concat("✓ synced loose toolkit overlays ", SRC_TOOLKIT, " → ", ENG_TOOLKIT)));
  }
  await refresh_loader_bang();
  console.log("\nLaunch:");
  console.log(("".concat("  ", INSTALL_ROOT, "/gjoa --no-remote --profile <profile_dir>")));
  return console.log("\nDaily loop: edit src/gjoa/chrome/bjs/* → `bun run chrome:dist` → restart gjoa.");
}

await main_bang();
