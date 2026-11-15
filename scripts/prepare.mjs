#!/usr/bin/env node
// gjoa source preparation: turn a pristine Firefox source tarball into a
// buildable gjoa tree under engine/. Plain Node, no dependencies.
//
//   node scripts/prepare.mjs            download (if needed) + prepare engine/
//   node scripts/prepare.mjs --no-download   reuse an existing engine/ checkout
//
// Steps (each is idempotent; engine/ is reset to vanilla Firefox first):
//   1. download + verify firefox-<version>.source.tar.xz against configs/
//   2. extract to engine/ and snapshot it as a git commit ("vanilla")
//   3. apply patches/*.patch in filename order
//   4. overlay src/gjoa/{browser,toolkit} onto engine/
//   5. bundle chrome scripts (src/gjoa/chrome) into the gjoa content package
//   6. generate branding from Mozilla's "unofficial" template + gjoa prefs
//   7. rewrite a few Firefox-branded locale strings
//   8. write engine/mozconfig (only if absent) and a build fingerprint
//
// After this: cd engine && ./mach build && ./mach package

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync, cpSync, createReadStream, existsSync, mkdirSync, readdirSync,
  readFileSync, rmSync, statSync, writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildChrome } from "./chrome-bundle.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENGINE = resolve(process.env.GJOA_ENGINE_DIR || join(ROOT, "engine"));
const SRC = join(ROOT, "src", "gjoa");
const CONFIG = JSON.parse(readFileSync(join(ROOT, "gjoa.json"), "utf8"));
const FF_VERSION = CONFIG.firefox.version;
const args = new Set(process.argv.slice(2));

const step = (msg) => console.log(`\n==> ${msg}`);
const info = (msg) => console.log(`    ${msg}`);

function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { stdio: "inherit", ...opts });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${cmdArgs.join(" ")} failed (exit ${r.status})`);
  }
}

function git(cmdArgs, opts = {}) {
  return run("git", ["-c", "core.autocrlf=false", ...cmdArgs], { cwd: ENGINE, ...opts });
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

async function sha256File(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

// ---------------------------------------------------------------- 1 + 2
async function fetchSource() {
  const pinFile = join(ROOT, "configs", `firefox-${FF_VERSION}.sha256`);
  if (!existsSync(pinFile)) throw new Error(`missing pinned checksum ${pinFile}`);
  const expected = readFileSync(pinFile, "utf8").split(/\s+/)[0];

  const cacheDir = process.env.GJOA_SOURCE_CACHE || join(homedir(), ".cache", "gjoa", "sources");
  const tarball = join(cacheDir, `firefox-${FF_VERSION}.source.tar.xz`);
  mkdirSync(cacheDir, { recursive: true });

  if (!existsSync(tarball)) {
    step(`downloading Firefox ${FF_VERSION} source`);
    const url = `https://archive.mozilla.org/pub/firefox/releases/${FF_VERSION}/source/firefox-${FF_VERSION}.source.tar.xz`;
    run("curl", ["-fL", "--retry", "3", "-o", `${tarball}.part`, url]);
    run("mv", [`${tarball}.part`, tarball]);
  }

  step("verifying source checksum");
  const actual = await sha256File(tarball);
  if (actual !== expected) {
    throw new Error(`checksum mismatch for ${tarball}\n  expected ${expected}\n  actual   ${actual}`);
  }
  info(`ok ${actual}`);
  return tarball;
}

function extractAndSnapshot(tarball) {
  step("extracting source to engine/");
  rmSync(ENGINE, { recursive: true, force: true });
  mkdirSync(ENGINE, { recursive: true });
  run("tar", ["-xJf", tarball, "-C", ENGINE, "--strip-components=1"]);
  snapshotVanilla();
}

function snapshotVanilla() {
  step("recording vanilla engine snapshot");
  git(["init", "-q"]);
  git(["add", "-A"]);
  git(["-c", "user.email=prep@gjoa", "-c", "user.name=prep", "commit", "-q", "-m", `vanilla firefox ${FF_VERSION}`]);
}

function vanillaVersion() {
  try {
    const first = execFileSync("git", ["rev-list", "--max-parents=0", "HEAD"], { cwd: ENGINE }).toString().trim();
    const subject = execFileSync("git", ["log", "-1", "--format=%s", first], { cwd: ENGINE }).toString().trim();
    return (subject.match(/^vanilla firefox (S+)$/) || [])[1] || null;
  } catch {
    return null;
  }
}

function resetToVanilla() {
  step("resetting engine/ to vanilla Firefox");
  git(["reset", "-q", "--hard"]);
  // Keep build outputs and the local mozconfig across re-prepares.
  git(["clean", "-q", "-fd", "-e", "obj-*", "-e", "mozconfig", "-e", ".mozconfig*"]);
}

// ---------------------------------------------------------------- 3
function applyPatches() {
  step("applying patches/");
  const dir = join(ROOT, "patches");
  const names = readdirSync(dir).filter((f) => f.endsWith(".patch")).sort();
  for (const name of names) {
    info(name);
    git(["apply", "--whitespace=nowarn", join(dir, name)]);
  }
}

// ---------------------------------------------------------------- 4
function overlay() {
  step("overlaying src/gjoa/ onto engine/");
  for (const sub of ["browser", "toolkit"]) {
    cpSync(join(SRC, sub), join(ENGINE, sub), { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------- 6
const TEXT_EXTS = new Set([".js", ".dtd", ".ftl", ".properties", ".sh", ".nsi",
  ".xml", ".css", ".json", ".mn", ".svg", ".html"]);
const TEXT_NAMES = new Set(["moz.build", "configure.sh", "branding.nsi", "jar.mn", "jar.inc.mn"]);
const isText = (p) => TEXT_NAMES.has(p.split(/[\\/]/).pop()) || TEXT_EXTS.has(extname(p).toLowerCase());

// Deliberately narrow: never substitute bare "Mozilla"/"Firefox" (MPL headers,
// URLs, file names). Only brand strings inside recognised structures.
function brandSubstitutions() {
  const b = CONFIG.branding;
  const u = CONFIG.urls;
  const ftl = (k, v) => [new RegExp(`^-${k}\\s*=.*$`, "m"), `-${k} = ${v}`];
  const dtd = (k, v) => [new RegExp(`<!ENTITY ${k} ".*?">`, "g"), `<!ENTITY ${k} "${v}">`];
  const prop = (k, v) => [new RegExp(`^${k}\\s*=.*$`, "m"), `${k}=${v}`];
  const pref = (k, v) => [new RegExp(`pref\\("${k.replace(/\./g, "\\.")}",\\s*".*?"\\);`), `pref("${k}", "${v}");`];
  const nsi = (k, v) => [new RegExp(`^!define ${k} ".*?"$`, "m"), `!define ${k} "${v}"`];
  return [
    ftl("brand-shorter-name", b.shorterName), ftl("brand-short-name", b.shortName),
    ftl("brand-shortcut-name", b.shortName), ftl("brand-full-name", b.fullName),
    ftl("brand-product-name", b.productName), ftl("vendor-short-name", b.vendorName),
    dtd("brandShorterName", b.shorterName), dtd("brandShortName", b.shortName),
    dtd("brandShortcutName", b.shortName), dtd("brandFullName", b.fullName),
    dtd("brandProductName", b.productName), dtd("vendorShortName", b.vendorName),
    prop("brandShorterName", b.shorterName), prop("brandShortName", b.shortName),
    prop("brandShortcutName", b.shortName), prop("brandFullName", b.fullName),
    prop("brandProductName", b.productName), prop("vendorShortName", b.vendorName),
    pref("startup.homepage_override_url", u.homepageOverride),
    pref("startup.homepage_welcome_url", u.welcome),
    pref("startup.homepage_welcome_url.additional", u.welcomeAdditional),
    pref("app.update.url.manual", u.updateManual),
    pref("app.update.url.details", u.updateDetails),
    pref("app.releaseNotesURL", u.releaseNotes),
    pref("app.releaseNotesURL.aboutDialog", u.releaseNotesAboutDialog),
    pref("app.releaseNotesURL.prompt", u.releaseNotesPrompt),
    [/^MOZ_APP_DISPLAYNAME=.*$/m, `MOZ_APP_DISPLAYNAME=${b.displayName}`],
    nsi("BrandShortName", b.shortName), nsi("BrandFullName", b.fullName),
    nsi("BrandFullNameInternal", b.fullName), nsi("CompanyName", b.vendorName),
  ];
}

// Pref files appended (in this order) to the branding pref file, which is the
// one default-pref file packaged into omni.ja without patching Mozilla source.
const PREF_FILES = ["perf-prefs", "dark-mode-prefs", "adblock-prefs", "genai-prefs", "layout-prefs", "theme-prefs"];

function branding() {
  const name = CONFIG.binaryName;
  step(`generating branding at engine/browser/branding/${name}/`);
  const template = join(ENGINE, "browser", "branding", "unofficial");
  const target = join(ENGINE, "browser", "branding", name);
  const ours = join(ROOT, "configs", "branding", name);
  if (!existsSync(template)) throw new Error(`unofficial branding template missing: ${template}`);
  rmSync(target, { recursive: true, force: true });

  const subs = brandSubstitutions();
  for (const src of walk(template)) {
    const dst = join(target, relative(template, src));
    mkdirSync(dirname(dst), { recursive: true });
    if (isText(src)) {
      let text = readFileSync(src, "utf8");
      for (const [re, rep] of subs) text = text.replace(re, rep);
      writeFileSync(dst, text);
    } else {
      copyFileSync(src, dst);
    }
  }

  const prefFile = join(target, "pref", "firefox-branding.js");
  if (!existsSync(prefFile)) {
    throw new Error(`${prefFile} missing: Mozilla's template no longer ships the branding pref file`);
  }
  let prefs = readFileSync(prefFile, "utf8");
  prefs += "\n\n// ===== gjoa default prefs (appended by scripts/prepare.mjs) =====\n";
  for (const p of PREF_FILES) {
    const src = join(SRC, "defaults", "pref", `${p}.js`);
    prefs += `\n// ---- ${p}.js ----\n${readFileSync(src, "utf8").trimEnd()}\n`;
  }
  // Present as Firefox in the UA so engine-sniffing sites work; branding stays
  // Gjoa everywhere else.
  const mm = (FF_VERSION.match(/^(\d+\.\d+)/) || [null, FF_VERSION])[1];
  if (!prefs.includes("general.useragent.override")) {
    prefs += "\n// gjoa UA compat: present as Firefox so UA-sniffing sites recognise the engine.\n";
    prefs += `pref("general.useragent.override", "Mozilla/5.0 (X11; Linux x86_64; rv:${mm}) Gecko/20100101 Firefox/${mm}");\n`;
  }
  writeFileSync(prefFile, prefs);

  for (const size of [16, 22, 24, 32, 48, 64, 128, 256, 512]) {
    const src = join(ours, `logo${size}.png`);
    if (existsSync(src)) copyFileSync(src, join(target, `default${size}.png`));
    else info(`warning: missing icon ${relative(ROOT, src)}`);
  }
  const content = join(ours, "content");
  if (existsSync(content)) {
    for (const f of readdirSync(content)) {
      const src = join(content, f);
      if (statSync(src).isFile()) copyFileSync(src, join(target, "content", f));
    }
  }
}

// ---------------------------------------------------------------- 7
const LOCALE_SUBS = [
  ["Get speed, safety, and privacy every time you browse.", "A browser at your command."],
  ["Get speed, safety and privacy every time you browse.", "A browser at your command."],
];

function locales() {
  step("rewriting Firefox-branded locale strings");
  const dir = join(ENGINE, "browser", "locales", "en-US");
  let changed = 0;
  for (const f of walk(dir)) {
    if (!/\.(ftl|dtd|properties|js|json|html|xml|md|txt)$/i.test(f)) continue;
    const text = readFileSync(f, "utf8");
    let next = text;
    for (const [from, to] of LOCALE_SUBS) next = next.split(from).join(to);
    if (next !== text) { writeFileSync(f, next); changed++; }
  }
  info(`rewrote ${changed} file(s)`);
}

// ---------------------------------------------------------------- 8
function mozconfig() {
  const path = join(ENGINE, "mozconfig");
  if (existsSync(path)) { info("engine/mozconfig exists, leaving it alone"); return; }
  step("writing engine/mozconfig");
  const n = CONFIG.binaryName;
  writeFileSync(path, [
    "# Generated by scripts/prepare.mjs (only when absent). Edit freely.",
    `ac_add_options --with-branding=browser/branding/${n}`,
    `ac_add_options --with-distribution-id=org.${n}`,
    `ac_add_options --with-app-name=${n}`,
    `ac_add_options --with-app-basename=${CONFIG.branding.shortName}`,
    "ac_add_options --without-wasm-sandboxed-libraries",
    "ac_add_options --disable-updater",
    "ac_add_options --disable-tests",
    "ac_add_options --enable-optimize",
    "ac_add_options --enable-release",
    "",
  ].join("\n"));
}

function fingerprint() {
  const sha12 = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12);
  const foldDir = (dir, suffix) => {
    if (!existsSync(dir)) return "none";
    return sha12(readdirSync(dir).filter((n) => n.endsWith(suffix)).sort()
      .map((n) => `${n} ${readFileSync(join(dir, n), "utf8")}`).join(""));
  };
  let commit = "unknown";
  try {
    commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT }).toString().trim();
  } catch {}
  const fixes = join(SRC, "toolkit", "components", "content-classifier", "darkmode-fixes.json");
  const darkHash = foldDir(join(SRC, "chrome", "dark-mode"), ".mjs");
  const prefFile = join(ENGINE, "browser", "branding", CONFIG.binaryName, "pref", "firefox-branding.js");
  const block = [
    "", "", "// ===== gjoa build fingerprint (scripts/prepare.mjs) =====",
    `pref("gjoa.build.engine-patch-hash", "${foldDir(join(ROOT, "patches"), ".patch")}");`,
    `pref("gjoa.build.dark-bundle-hash", "${darkHash}");`,
    `pref("gjoa.build.expected-dark-bundle-hash", "${darkHash}");`,
    `pref("gjoa.build.dark-fixes-hash", "${existsSync(fixes) ? sha12(readFileSync(fixes, "utf8")) : "none"}");`,
    `pref("gjoa.build.commit", "${commit}");`,
    `pref("gjoa.build.date", "${new Date().toISOString()}");`,
    "",
  ].join("\n");
  writeFileSync(prefFile, readFileSync(prefFile, "utf8") + block);
  info(`fingerprint: commit ${commit}`);
}

// ---------------------------------------------------------------- main
async function main() {
  if (args.has("--no-download")) {
    if (!existsSync(join(ENGINE, ".git"))) {
      if (!existsSync(ENGINE)) throw new Error("engine/ missing; run without --no-download");
      snapshotVanilla();
    } else {
      resetToVanilla();
    }
  } else if (existsSync(join(ENGINE, ".git")) && vanillaVersion() === FF_VERSION) {
    resetToVanilla();
  } else {
    extractAndSnapshot(await fetchSource());
  }
  applyPatches();
  overlay();
  step("bundling chrome scripts");
  buildChrome({ root: ROOT, outDir: join(ENGINE, "browser", "components", "gjoa", "content") });
  branding();
  locales();
  mozconfig();
  fingerprint();
  step("engine/ is ready: cd engine && ./mach build");
}

main().catch((e) => {
  console.error(`\nprepare failed: ${e.message}`);
  process.exit(1);
});
