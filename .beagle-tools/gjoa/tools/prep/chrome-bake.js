import { existsSync } from 'fs';
import { copyFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ENGINE_DIR, REPO_ROOT } from './paths.js';
import { log } from './log.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const DIST_CHROME = join(REPO_ROOT, "dist", "chrome");

const BAKE_ROOT = join(ENGINE_DIR, "browser", "components", "gjoa", "content");

const SCRIPTS = ["gjoa-security.uc.js", "gjoa-drawer.uc.js", "gjoa-tabs.uc.js", "gjoa-dark-mode.uc.js", "gjoa-blocking.uc.js", "gjoa-theme.uc.js"];

const STYLES = ["gjoa.uc.css", "gjoa-tabs.uc.css", "gjoa-which-key.uc.css"];

async function ensureChromeDist() {
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(DIST_CHROME))) {
    return null;
  } else {
    log.step("dist/chrome/ missing — running chrome:dist");
    const proc = Bun.spawn({cmd: ["bun", "run", "chrome:dist"], cwd: REPO_ROOT, stdout: "inherit", stderr: "inherit"});
    const code = await proc.exited;
    if ((!($$bc$equiv(code, 0)))) {
      return (() => { throw new Error(("".concat("chrome:dist failed (exit ", code, ")"))); })();
    }
  }
}

async function bakeOne(srcSubdir, dstSubdir, names) {
  const dstDir = join(BAKE_ROOT, dstSubdir);
  const n = names.length;
  await mkdir(dstDir, {recursive: true});
  return (async () => { let i = 0; while (true) {
    if ((i < n)) {  const fname = names[i]; const src = join(DIST_CHROME, srcSubdir, fname); ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(src))) ? (() => { return (() => { throw new Error(("".concat("chrome-bake: expected ", src, " from chrome:dist (declared in jar.mn) — did the bundle list drift?"))); })(); })() : null); await copyFile(src, join(dstDir, fname)); const _recur_0 = (i + 1); i = _recur_0; continue; } else { return null; }
  } })();
}

export async function chrome_bake() {
  await ensureChromeDist();
  log.step(("".concat("baking ", SCRIPTS.length, " scripts + ", STYLES.length, " stylesheets into engine")));
  await bakeOne("JS", "scripts", SCRIPTS);
  await bakeOne("CSS", "styles", STYLES);
  return log.ok(("".concat("chrome bundles baked at ", BAKE_ROOT)));
}
