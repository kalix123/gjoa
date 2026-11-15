import { existsSync, readdirSync, statSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, extname, join, relative, resolve } from 'path';
import { load_config_bang } from './config.js';
import { BRANDING_SRC, ENGINE_BRANDING_DIR, ENGINE_UNOFFICIAL_BRANDING, REPO_ROOT, SRC_DIR } from './paths.js';
import { log } from './log.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const BEAGLE_REF_FILE = join(REPO_ROOT, "configs", "beagle.ref");

const BEAGLE_REF = (() => { const lines = readFileSync(BEAGLE_REF_FILE, "utf8").split("\n"); const ref = lines.find((l) => ((l.trim().length > 0) && (!((_truthy) => _truthy !== false && _truthy != null)(l.trim().startsWith("#"))))); return (((_truthy) => _truthy !== false && _truthy != null)(ref) ? ref.trim() : (() => { throw new Error("configs/beagle.ref has no Beagle object ID"); })()); })();

const BEAGLE_PIN_ROOT = ((_logical) => (_logical !== false && _logical != null ? _logical : resolve(process.env.HOME, "code", "beagle", "pins", BEAGLE_REF)))(process.env.BEAGLE_PIN_ROOT);

const BEAGLE_BUILD = resolve(BEAGLE_PIN_ROOT, "bin", "beagle-build").replaceAll(String.fromCharCode(92), "/");

const TEXT_EXTS = new Set([".js", ".dtd", ".ftl", ".properties", ".sh", ".nsi", ".xml", ".css", ".json", ".mn", ".svg", ".html"]);

const TEXT_FILENAMES = new Set(["moz.build", "configure.sh", "branding.nsi", "jar.mn", "jar.inc.mn"]);

function is_text_file(path) {
  const base = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(path.split("/").pop());
  return (((_truthy) => _truthy !== false && _truthy != null)(TEXT_FILENAMES.has(base)) ? true : TEXT_EXTS.has(extname(path).toLowerCase()));
}

function substitutions(cfg) {
  const b = cfg.branding;
  const u = cfg.urls;
  return [[new RegExp("^-brand-shorter-name\\s*=.*$", "m"), ("".concat("-brand-shorter-name = ", b.shorterName))], [new RegExp("^-brand-short-name\\s*=.*$", "m"), ("".concat("-brand-short-name = ", b.shortName))], [new RegExp("^-brand-shortcut-name\\s*=.*$", "m"), ("".concat("-brand-shortcut-name = ", b.shortName))], [new RegExp("^-brand-full-name\\s*=.*$", "m"), ("".concat("-brand-full-name = ", b.fullName))], [new RegExp("^-brand-product-name\\s*=.*$", "m"), ("".concat("-brand-product-name = ", b.productName))], [new RegExp("^-vendor-short-name\\s*=.*$", "m"), ("".concat("-vendor-short-name = ", b.vendorName))], [new RegExp("<!ENTITY brandShorterName \".*?\">", "g"), ("".concat("<!ENTITY brandShorterName \"", b.shorterName, "\">"))], [new RegExp("<!ENTITY brandShortName \".*?\">", "g"), ("".concat("<!ENTITY brandShortName \"", b.shortName, "\">"))], [new RegExp("<!ENTITY brandShortcutName \".*?\">", "g"), ("".concat("<!ENTITY brandShortcutName \"", b.shortName, "\">"))], [new RegExp("<!ENTITY brandFullName \".*?\">", "g"), ("".concat("<!ENTITY brandFullName \"", b.fullName, "\">"))], [new RegExp("<!ENTITY brandProductName \".*?\">", "g"), ("".concat("<!ENTITY brandProductName \"", b.productName, "\">"))], [new RegExp("<!ENTITY vendorShortName \".*?\">", "g"), ("".concat("<!ENTITY vendorShortName \"", b.vendorName, "\">"))], [new RegExp("^brandShorterName\\s*=.*$", "m"), ("".concat("brandShorterName=", b.shorterName))], [new RegExp("^brandShortName\\s*=.*$", "m"), ("".concat("brandShortName=", b.shortName))], [new RegExp("^brandShortcutName\\s*=.*$", "m"), ("".concat("brandShortcutName=", b.shortName))], [new RegExp("^brandFullName\\s*=.*$", "m"), ("".concat("brandFullName=", b.fullName))], [new RegExp("^brandProductName\\s*=.*$", "m"), ("".concat("brandProductName=", b.productName))], [new RegExp("^vendorShortName\\s*=.*$", "m"), ("".concat("vendorShortName=", b.vendorName))], [new RegExp("pref\\(\"startup\\.homepage_override_url\",\\s*\".*?\"\\);"), ("".concat("pref(\"startup.homepage_override_url\", \"", u.homepageOverride, "\");"))], [new RegExp("pref\\(\"startup\\.homepage_welcome_url\",\\s*\".*?\"\\);"), ("".concat("pref(\"startup.homepage_welcome_url\", \"", u.welcome, "\");"))], [new RegExp("pref\\(\"startup\\.homepage_welcome_url\\.additional\",\\s*\".*?\"\\);"), ("".concat("pref(\"startup.homepage_welcome_url.additional\", \"", u.welcomeAdditional, "\");"))], [new RegExp("pref\\(\"app\\.update\\.url\\.manual\",\\s*\".*?\"\\);"), ("".concat("pref(\"app.update.url.manual\", \"", u.updateManual, "\");"))], [new RegExp("pref\\(\"app\\.update\\.url\\.details\",\\s*\".*?\"\\);"), ("".concat("pref(\"app.update.url.details\", \"", u.updateDetails, "\");"))], [new RegExp("pref\\(\"app\\.releaseNotesURL\",\\s*\".*?\"\\);"), ("".concat("pref(\"app.releaseNotesURL\", \"", u.releaseNotes, "\");"))], [new RegExp("pref\\(\"app\\.releaseNotesURL\\.aboutDialog\",\\s*\".*?\"\\);"), ("".concat("pref(\"app.releaseNotesURL.aboutDialog\", \"", u.releaseNotesAboutDialog, "\");"))], [new RegExp("pref\\(\"app\\.releaseNotesURL\\.prompt\",\\s*\".*?\"\\);"), ("".concat("pref(\"app.releaseNotesURL.prompt\", \"", u.releaseNotesPrompt, "\");"))], [new RegExp("^MOZ_APP_DISPLAYNAME=.*$", "m"), ("".concat("MOZ_APP_DISPLAYNAME=", b.displayName))], [new RegExp("^!define BrandShortName \".*?\"$", "m"), ("".concat("!define BrandShortName \"", b.shortName, "\""))], [new RegExp("^!define BrandFullName \".*?\"$", "m"), ("".concat("!define BrandFullName \"", b.fullName, "\""))], [new RegExp("^!define BrandFullNameInternal \".*?\"$", "m"), ("".concat("!define BrandFullNameInternal \"", b.fullName, "\""))], [new RegExp("^!define CompanyName \".*?\"$", "m"), ("".concat("!define CompanyName \"", b.vendorName, "\""))]];
}

function apply_substitutions_bang(text, cfg) {
  const out = ({value: text, watches: {}});
  substitutions(cfg).forEach((pair) => {
  const re = pair[0];
  const replacement = pair[1];
  (() => { const _a = out, _v = out.value.replace(re, replacement); const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
});
  return out.value;
}

function walk_files(root) {
  const out = [];
  (() => { function recurse(dir) { readdirSync(dir).forEach((name) => {
  const path = join(dir, name);
  if (((_truthy) => _truthy !== false && _truthy != null)(statSync(path).isDirectory())) {
    recurse(path);
  } else {
    out.push(path);
  }
}); } return recurse(root); })();
  return out;
}

export function branding_bang() {
  const cfg = load_config_bang();
  const target = join(ENGINE_BRANDING_DIR, cfg.binaryName);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(ENGINE_UNOFFICIAL_BRANDING)))) {
    (() => { throw new Error(("".concat("unofficial branding not found at ", ENGINE_UNOFFICIAL_BRANDING, " — ", "did you run `bun run download` first?"))); })();
  }
  log.step(("".concat("generating branding tree at engine/browser/branding/", cfg.binaryName, "/")));
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(target))) {
    rmSync(target, {recursive: true});
  }
  mkdirSync(target, {recursive: true});
  const all_files = walk_files(ENGINE_UNOFFICIAL_BRANDING);
  const text_count = ({value: 0, watches: {}});
  const binary_count = ({value: 0, watches: {}});
  all_files.forEach((src) => {
  const rel = relative(ENGINE_UNOFFICIAL_BRANDING, src);
  const dst = join(target, rel);
  mkdirSync(dirname(dst), {recursive: true});
  if (((_truthy) => _truthy !== false && _truthy != null)(is_text_file(src))) {
    const text = readFileSync(src, "utf8");
    writeFileSync(dst, apply_substitutions_bang(text, cfg));
    (() => { const _a = text_count, _v = (text_count.value + 1); const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
  } else {
    Bun.spawnSync(["cp", src, dst]);
    (() => { const _a = binary_count, _v = (binary_count.value + 1); const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
  }
});
  log.info(("".concat("copied ", text_count.value, " text + ", binary_count.value, " binary files from unofficial template")));
  const branding_pref_file = join(target, "pref", "firefox-branding.js");
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(branding_pref_file)))) {
    (() => { throw new Error(("".concat("branding pref file missing at ", branding_pref_file, " — Mozilla's unofficial ", "template no longer ships pref/firefox-branding.js, so gjoa default prefs ", "would not be packaged. Register a pref file explicitly before relying on this."))); })();
  }
  const gjoa_pref_files = ["perf-prefs", "dark-mode-prefs", "adblock-prefs", "genai-prefs", "layout-prefs", "theme-prefs"];
  const tmp_dir = join(REPO_ROOT, ".beagle-tools", ".pref-build");
  const __ = mkdirSync(tmp_dir, {recursive: true});
  const pref_blocks = ({value: "\n\n// ===== gjoa default prefs (appended by tools/prep/branding.bjs) =====\n", watches: {}});
  gjoa_pref_files.forEach((name) => {
  const src = join(SRC_DIR, "defaults", "pref", ("".concat(name, ".bjs")));
  const out = join(tmp_dir, ("".concat(name, ".js")));
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(src)))) {
    (() => { throw new Error(("".concat("gjoa pref source missing: ", src))); })();
  }
  const proc = Bun.spawnSync({cmd: ["bash", BEAGLE_BUILD, src, out], cwd: REPO_ROOT, stdout: "pipe", stderr: "pipe"});
  if ((!($$bc$equiv(proc.exitCode, 0)))) {
    (() => { throw new Error(("".concat("beagle-build failed compiling pref source ", src, ":\n", proc.stderr.toString()))); })();
  }
  const contents = readFileSync(out, "utf8");
  (() => { const _a = pref_blocks, _v = ("".concat(pref_blocks.value, "\n// ---- ", name, ".bjs ----\n", contents.trimEnd(), "\n")); const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
});
  const existing = readFileSync(branding_pref_file, "utf8");
  writeFileSync(branding_pref_file, ("".concat(existing, pref_blocks.value)));
  log.info(("".concat("compiled + appended ", gjoa_pref_files.length, " gjoa pref files to branding/", cfg.binaryName, "/pref/firefox-branding.js")));
  const ver = cfg.firefox.version;
  const mm_match = ver.match(new RegExp("^(\\d+\\.\\d+)"));
  const mm = (((_truthy) => _truthy !== false && _truthy != null)(mm_match) ? mm_match[1] : ver);
  const ua = ("".concat("Mozilla/5.0 (X11; Linux x86_64; rv:", mm, ") Gecko/20100101 Firefox/", mm));
  const ua_pref_file = join(target, "pref", "firefox-branding.js");
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(ua_pref_file))) {
    const existing = readFileSync(ua_pref_file, "utf8");
    if ((!((_truthy) => _truthy !== false && _truthy != null)(existing.includes("general.useragent.override")))) {
      writeFileSync(ua_pref_file, ("".concat(existing, "\n// gjoa UA compat: present as Firefox so UA-sniffing sites recognise the\n", "// engine; branding stays Gjoa everywhere else (tools/prep/branding.bjs).\n", "pref(\"general.useragent.override\", \"", ua, "\");\n")));
      log.info(("".concat("appended general.useragent.override = ", ua)));
    }
  }
  const sizes = [16, 22, 24, 32, 48, 64, 128, 256, 512];
  const icon_count = ({value: 0, watches: {}});
  sizes.forEach((size) => {
  const src = join(BRANDING_SRC, ("".concat("logo", size, ".png")));
  const dst = join(target, ("".concat("default", size, ".png")));
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(src))) {
    Bun.spawnSync(["cp", src, dst]);
    (() => { const _a = icon_count, _v = (icon_count.value + 1); const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
  } else {
    log.warn(("".concat("missing source icon: configs/branding/", cfg.binaryName, "/logo", size, ".png")));
  }
});
  log.info(("".concat("installed ", icon_count.value, " desktop icons")));
  const our_content = join(BRANDING_SRC, "content");
  const target_content = join(target, "content");
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(our_content))) {
    const content_count = ({value: 0, watches: {}});
    readdirSync(our_content).forEach((name) => {
  const src = join(our_content, name);
  if (((_truthy) => _truthy !== false && _truthy != null)(statSync(src).isFile())) {
    const dst = join(target_content, name);
    Bun.spawnSync(["cp", src, dst]);
    (() => { const _a = content_count, _v = (content_count.value + 1); const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
  }
});
    log.info(("".concat("overlaid ", content_count.value, " content/ files (about-logo, wordmarks)")));
  }
  const written = walk_files(target);
  written.forEach((f) => {
  if (((_truthy) => _truthy !== false && _truthy != null)(is_text_file(f))) {
    const text = readFileSync(f, "utf8");
    if (((_truthy) => _truthy !== false && _truthy != null)(text.includes("zen-browser.app"))) {
      (() => { throw new Error(("".concat("zen-browser.app leaked into ", f, " — extend substitutions in branding.bjs"))); })();
    }
  }
});
  return log.ok("branding ready");
}
