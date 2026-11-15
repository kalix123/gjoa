import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { sh } from './sh.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO = process.cwd();

const PATCHES_DIR = join(REPO, "patches");

const FF = join(process.env.HOME, "code", "resources", "firefox");

function version__gttag(v) {
  return ((!((_truthy) => _truthy !== false && _truthy != null)(v.match(new RegExp("^[0-9]+(\\.[0-9]+){1,3}(esr)?$")))) ? (() => { throw new Error(("".concat("refusing unsafe version string: ", v))); })() : ("".concat("FIREFOX_", v.replaceAll(".", "_"), "_RELEASE")));
}

function gjoa_version() {
  return JSON.parse(readFileSync(join(REPO, "gjoa.json"), "utf8")).firefox.version;
}

function latest_stable() {
  const out = sh("curl -s 'https://product-details.mozilla.org/1.0/firefox_versions.json' 2>/dev/null", {quiet: true});
  return (($$bc$equiv(out, "")) ? "" : JSON.parse(out).LATEST_FIREFOX_VERSION);
}

function touches(text) {
  const out = [];
  text.matchAll(new RegExp("^#     - (\\S+/\\S+)\\s*$", "gm")).forEach((m) => {
  const p = m[1];
  if ((!((_truthy) => _truthy !== false && _truthy != null)(new RegExp("^(rust-|cpp-|js-|webidl-)").test(p)))) {
    out.push(p);
  }
});
  return out;
}

function rung_name(files) {
  return ((((_truthy) => _truthy !== false && _truthy != null)(files.some((f) => new RegExp("\\.(rs|cpp|cc|h|webidl)$").test(f)))) ? "native-src" : (((_truthy) => _truthy !== false && _truthy != null)(files.some((f) => new RegExp("\\.(mjs|js)$").test(f)))) ? "sys.mjs" : "build");
}

function main_bang() {
  const argv = process.argv.slice(2);
  const from = ((_logical) => (_logical !== false && _logical != null ? _logical : gjoa_version()))(argv[0]);
  const to = ((_logical) => (_logical !== false && _logical != null ? _logical : latest_stable()))(argv[1]);
  return ((((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(from, "")) || ($$bc$equiv(to, ""))))) ? console.log("forecast: could not determine from/to versions") : (($$bc$equiv(from, to))) ? console.log(("".concat("forecast: already at ", to, " — nothing to forecast"))) : (() => { const delta = sh(("".concat("git -C ", FF, " diff --name-only ", version__gttag(from), " ", version__gttag(to), " 2>/dev/null")), {quiet: true}).split("\n").filter((s) => (s.length > 0)); if (($$bc$equiv(delta.length, 0))) {
  return console.log(("".concat("forecast ", from, " -> ", to, ": empty delta — are the release tags present in ", FF, "?")));
} else {
  console.log(("".concat("conflict forecast: Firefox ", from, " -> ", to, "  (", delta.length, " files changed upstream)\n")));
  const names = readdirSync(PATCHES_DIR).filter((p) => p.endsWith(".patch")).sort();
  const affected = [];
  (() => { names.forEach((n) => {
  const files = touches(readFileSync(join(PATCHES_DIR, n), "utf8"));
  const hits = files.filter((f) => delta.includes(f));
  if ((hits.length > 0)) {
    affected.push({name: n, rung: rung_name(files), hits: hits});
  }
}); })();
  if (($$bc$equiv(affected.length, 0))) {
    return console.log("  CLEAN — no gjoa patch touches a changed file. All patches apply unchanged.");
  } else {
    console.log(("".concat("  ", affected.length, " patch(es) in the blast radius (review highest-tier first):")));
    affected.forEach((a) => {
  console.log(("".concat("    [", a.rung, "] ", a.name)));
  (() => { a.hits.forEach((h) => {
  console.log(("".concat("        ~ ", h)));
}); })();
});
  }
} })());
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
