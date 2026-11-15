import { existsSync, statSync, readdirSync, readFileSync, writeFileSync, mkdirSync, readlinkSync } from 'fs';
import { join, dirname, relative } from 'path';
import { createHash } from 'crypto';
import { spawnSync } from 'child_process';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO_ROOT = process.cwd();

const BJS_ROOT = join(REPO_ROOT, "src", "gjoa", "chrome", "bjs");

const CSS_ROOT = join(REPO_ROOT, "src", "gjoa", "chrome", "css");

const BUNDLE_TOOLS = join(REPO_ROOT, "tools", "chrome-bundle");

const STAMP = join(REPO_ROOT, ".cache", "gjoa", "chrome-install.stamp");

const SRC_LOADER = join(REPO_ROOT, "src", "gjoa", "browser", "components", "gjoa", "GjoaLoader.bjs");

const SRC_TOOLKIT = join(REPO_ROOT, "src", "gjoa", "toolkit");

const REPO_OBJDIR = join(REPO_ROOT, "engine", "obj-x86_64-pc-linux-gnu");

const ENV_OBJDIR = process.env.MOZ_OBJDIR;

const MOZ_OBJDIR = (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ENV_OBJDIR.startsWith(REPO_ROOT) : _logical))(ENV_OBJDIR)) ? ENV_OBJDIR : REPO_OBJDIR);

const GJOA_DEV = join(MOZ_OBJDIR, "dist", "bin", "gjoa-dev");

const DIST_CHROME = join(REPO_ROOT, "dist", "chrome");

const OUT_SENTINEL = join(DIST_CHROME, "JS", "gjoa-tabs.uc.js");

const DEV_SENTINEL = join(GJOA_DEV, "JS", "gjoa-tabs.uc.js");

function should_skip_rel(rel) {
  return ((($$bc$equiv(rel, "macros.bjs"))) ? true : (((_truthy) => _truthy !== false && _truthy != null)(rel.startsWith("test/"))) ? true : (((_truthy) => _truthy !== false && _truthy != null)(rel.endsWith(".test.bjs"))) ? true : false);
}

function walk(dir) {
  const out = [];
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(dir))) {
    const entries = readdirSync(dir, {withFileTypes: true});
    const n = entries.length;
    (() => { let i = 0; while (true) {
    if ((i < n)) {  const entry = entries[i]; const full = join(dir, entry.name); (((_truthy) => _truthy !== false && _truthy != null)(entry.isDirectory()) ? (() => { const sub = walk(full); const m = sub.length; return (() => { let j = 0; while (true) {
    if ((j < m)) { out.push(sub[j]); const _recur_0 = (j + 1); j = _recur_0; continue; } else { return null; }
  } })(); })() : out.push(full)); const _recur_0 = (i + 1); i = _recur_0; continue; } else { return null; }
  } })();
  }
  return out;
}

function input_files() {
  const out = [];
  walk(BJS_ROOT).forEach((f) => {
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!should_skip_rel(relative(BJS_ROOT, f))) : _logical))(f.endsWith(".bjs")))) {
    out.push(f);
  }
});
  walk(CSS_ROOT).forEach((f) => {
  out.push(f);
});
  walk(BUNDLE_TOOLS).forEach((f) => {
  if (((_truthy) => _truthy !== false && _truthy != null)(f.endsWith(".bjs"))) {
    out.push(f);
  }
});
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(SRC_LOADER))) {
    out.push(SRC_LOADER);
  }
  walk(SRC_TOOLKIT).forEach((f) => {
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : f.endsWith(".json")))(f.endsWith(".sys.mjs")))) {
    out.push(f);
  }
});
  return out;
}

function fingerprint() {
  const files = input_files().sort();
  const h = createHash("sha256");
  const link = (((_truthy) => _truthy !== false && _truthy != null)(existsSync(GJOA_DEV)) ? (() => { try {
    return readlinkSync(GJOA_DEV);
  } catch (e) {
    return "";
  } })() : "");
  files.forEach((f) => {
  const st = statSync(f);
  h.update(("".concat(relative(REPO_ROOT, f), ":", st.mtimeMs, ":", st.size, "\n")));
});
  h.update(("".concat("gjoa-dev->", link, "\n")));
  return h.digest("hex");
}

function run_script_bang(name) {
  const r = spawnSync("bun", ["run", name], {cwd: REPO_ROOT, stdio: "inherit"});
  if ((!($$bc$equiv(r.status, 0)))) {
    return (() => { throw new Error(("".concat("`bun run ", name, "` failed (exit ", r.status, ")"))); })();
  }
}

function outputs_present_p() {
  return ((_logical) => (_logical !== false && _logical != null ? existsSync(DEV_SENTINEL) : _logical))(existsSync(OUT_SENTINEL));
}

function main_bang() {
  const h = fingerprint();
  const prev = (((_truthy) => _truthy !== false && _truthy != null)(existsSync(STAMP)) ? readFileSync(STAMP, "utf8").trim() : "");
  const force = process.env.GJOA_CHROME_FORCE;
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(force)) && ((prev === h) && outputs_present_p())))) {
    return console.log(("".concat("chrome bundle up to date (stamp ", h.slice(0, 8), ") — skipping dist+install")));
  } else {
    run_script_bang("chrome:dist");
    run_script_bang("chrome:install");
    mkdirSync(dirname(STAMP), {recursive: true});
    writeFileSync(STAMP, h);
    return console.log(("".concat("chrome bundle installed (stamp ", h.slice(0, 8), ")")));
  }
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  (() => { try {
    return main_bang();
  } catch (e) {
    console.error(("".concat("ensure-installed failed: ", ((_logical) => (_logical !== false && _logical != null ? _logical : e))(e.message))));
    return process.exit(1);
  } })();
}
