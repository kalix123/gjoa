import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { copyFile } from 'fs/promises';
import { BRANDING_SRC, REPO_ROOT } from '../prep/paths.js';
import { log } from '../prep/log.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const SOURCE_SVG = join(REPO_ROOT, "assets", "gjoa.svg");

const SOURCE_WORDMARK = join(REPO_ROOT, "assets", "gjoa-wordmark.svg");

const CONTENT_DIR = join(BRANDING_SRC, "content");

const DESKTOP_SIZES = [16, 22, 24, 32, 48, 64, 128, 256, 512];

const EXTRA_LOGO_SIZES = [1024];

const ABOUT_LOGO_SIZE = 192;

const ABOUT_LOGO_2X_SIZE = 384;

async function run_quiet(argv) {
  const proc = Bun.spawn({cmd: argv, stdout: "pipe", stderr: "pipe"});
  const results = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
  const stderr = results[1];
  const code = results[2];
  return ((!($$bc$equiv(code, 0))) ? (() => { throw new Error(("".concat("command failed: ", argv.join(" "), "\n", stderr))); })() : null);
}

function ensureRsvg() {
  return run_quiet(["rsvg-convert", "--version"]);
}

function renderPng(size, dest) {
  return run_quiet(["rsvg-convert", "-w", String(size), "-h", String(size), SOURCE_SVG, "-o", dest]);
}

async function main_bang() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(SOURCE_SVG)))) {
    (() => { throw new Error(("".concat("source SVG not found at ", SOURCE_SVG))); })();
  } else {
    null;
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(SOURCE_WORDMARK)))) {
    (() => { throw new Error(("".concat("wordmark SVG not found at ", SOURCE_WORDMARK))); })();
  } else {
    null;
  }
  await ensureRsvg();
  mkdirSync(BRANDING_SRC, {recursive: true});
  mkdirSync(CONTENT_DIR, {recursive: true});
  log.step("rendering desktop integration icons (logo<N>.png)");
  const sizes = DESKTOP_SIZES.concat(EXTRA_LOGO_SIZES);
  const n = sizes.length;
  await (async () => { let i = 0; while (true) {
    if ((i < n)) { const size = sizes[i]; const dest = join(BRANDING_SRC, ("".concat("logo", size, ".png"))); const __ = await renderPng(size, dest); const _recur_0 = (i + 1); i = _recur_0; continue; } else { return null; }
  } })();
  await copyFile(join(BRANDING_SRC, "logo512.png"), join(BRANDING_SRC, "logo.png"));
  await copyFile(join(BRANDING_SRC, "logo1024.png"), join(BRANDING_SRC, "logo-mac.png"));
  const desktop_count = DESKTOP_SIZES.length;
  const extra_count = EXTRA_LOGO_SIZES.length;
  log.ok(("".concat("wrote ", (desktop_count + extra_count + 2), " desktop icons")));
  log.step("rendering about-page logos (in-omni.ja)");
  await renderPng(ABOUT_LOGO_SIZE, join(CONTENT_DIR, "about-logo.png"));
  await renderPng(ABOUT_LOGO_2X_SIZE, join(CONTENT_DIR, "about-logo@2x.png"));
  await renderPng(ABOUT_LOGO_SIZE, join(CONTENT_DIR, "about-logo-private.png"));
  await renderPng(ABOUT_LOGO_2X_SIZE, join(CONTENT_DIR, "about-logo-private@2x.png"));
  log.ok("wrote 4 about-page icons");
  log.step("copying source SVG to about-logo + wordmark slots");
  await copyFile(SOURCE_SVG, join(CONTENT_DIR, "about-logo.svg"));
  await copyFile(SOURCE_SVG, join(CONTENT_DIR, "about-logo-private.svg"));
  await copyFile(SOURCE_WORDMARK, join(CONTENT_DIR, "about-wordmark.svg"));
  await copyFile(SOURCE_WORDMARK, join(CONTENT_DIR, "firefox-wordmark.svg"));
  log.ok("wrote 4 SVGs");
  return log.ok("done — run `bun run import` to push these into engine/");
}

main_bang().catch((err) => { log.error(((_logical) => (_logical !== false && _logical != null ? _logical : String(err)))(err.message));
if (((_truthy) => _truthy !== false && _truthy != null)(process.env.DEBUG)) {
  console.error(err.stack);
} else {
  null;
}
return process.exit(1); });
