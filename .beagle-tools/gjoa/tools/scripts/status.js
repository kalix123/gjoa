import { existsSync, readFileSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { REPO_ROOT, ENGINE_DIR } from '../prep/paths.js';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

const MACH_BIN = join(ENGINE_DIR, "obj-x86_64-pc-linux-gnu", "dist", "bin", "gjoa-bin");

const MACH_DEV_OVERLAY = join(ENGINE_DIR, "obj-x86_64-pc-linux-gnu", "dist", "bin", "gjoa-dev");

const NIX_RESULT = join(REPO_ROOT, "result", "bin", "gjoa");

const DIST_CHROME = join(REPO_ROOT, "dist", "chrome");

const GJOA_JSON = join(REPO_ROOT, "gjoa.json");

const tty = process.stdout.isTTY;

function c(s, code) {
  return (((_truthy) => _truthy !== false && _truthy != null)(tty) ? ("".concat("\x1b[", code, "m", s, "\x1b[0m")) : s);
}

function dim(s) {
  return c(s, "2");
}

function bold(s) {
  return c(s, "1");
}

function green(s) {
  return c(s, "32");
}

function yellow(s) {
  return c(s, "33");
}

function red(s) {
  return c(s, "31");
}

function cyan(s) {
  return c(s, "36");
}

function magenta(s) {
  return c(s, "35");
}

function parseVer(v) {
  const cleaned = v.replace(new RegExp("esr$", "i"), "").replace(new RegExp("[a-z].*$"), "").trim();
  const p = cleaned.split(".").map((x) => ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(parseInt(x, 10)));
  return [((_logical) => (_logical !== false && _logical != null ? _logical : 0))(p[0]), ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(p[1]), ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(p[2])];
}

function cmpVer(a, b) {
  return (() => { let i = 0; while (true) {
    if ((i >= 3)) { return 0; } else { if ((!($$bc$equiv(a[i], b[i])))) { return ((a[i] < b[i]) ? -1 : 1); } else { const _recur_0 = (i + 1); i = _recur_0; continue; } }
  } })();
}

function delta(a, b) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(a)) || (!((_truthy) => _truthy !== false && _truthy != null)(b))))) {
    return dim("—");
  } else {
    const aT = parseVer(a);
    const bT = parseVer(b);
    const cmp = cmpVer(aT, bT);
    const a_major = aT[0];
    const b_major = bT[0];
    return (($$bc$equiv(cmp, 0)) ? green("match") : ((cmp > 0) ? ((a_major > b_major) ? cyan(("".concat("+", (a_major - b_major), " major ahead"))) : cyan("patch ahead")) : ((a_major < b_major) ? red(("".concat("-", (b_major - a_major), " major"))) : yellow("point behind"))));
  }
}

async function fetchJson(url, timeoutMs) {
  return (async () => { try {
    const r = await fetch(url, {signal: AbortSignal.timeout(timeoutMs)});
  return ((!((_truthy) => _truthy !== false && _truthy != null)(r.ok)) ? null : await r.json());
  } catch (e) {
    return null;
  } })();
}

async function fetchText(url, timeoutMs) {
  return (async () => { try {
    const r = await fetch(url, {signal: AbortSignal.timeout(timeoutMs)});
  return ((!((_truthy) => _truthy !== false && _truthy != null)(r.ok)) ? null : await r.text());
  } catch (e) {
    return null;
  } })();
}

function nixEvalRaw(expr) {
  return (() => { try {
    const out = execSync(("".concat("nix eval --impure --raw --expr '", expr, "' 2>/dev/null")), {timeout: 10000, encoding: "utf8"});
  return ((_logical) => (_logical !== false && _logical != null ? _logical : null))(out.trim());
  } catch (e) {
    return null;
  } })();
}

async function loadOracles_bang(pinned) {
  const errors = [];
  const probes = await Promise.all([fetchJson("https://product-details.mozilla.org/1.0/firefox_versions.json", 5000), fetchText("https://www.mozilla.org/en-US/security/known-vulnerabilities/firefox/", 5000), fetchText("https://raw.githubusercontent.com/zen-browser/desktop/dev/surfer.json", 5000), fetchText("https://gitlab.com/librewolf-community/browser/source/-/raw/main/version", 5000)]);
  const moz = probes[0];
  const advHtml = probes[1];
  const zenSurfer = probes[2];
  const librewolfPkgbuild = probes[3];
  if ((!((_truthy) => _truthy !== false && _truthy != null)(moz))) {
    errors.push("Mozilla product-details unreachable");
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(advHtml))) {
    errors.push("Mozilla advisories page unreachable");
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(zenSurfer))) {
    errors.push("Zen browser version probe failed");
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(librewolfPkgbuild))) {
    errors.push("LibreWolf version probe failed");
  }
  const flakeExpr = ("".concat("(builtins.getFlake \"git+file://", REPO_ROOT, "\")"));
  const nixpkgsFirefox = nixEvalRaw(("".concat("(import ", flakeExpr, ".inputs.nixpkgs { system = \"x86_64-linux\"; }).firefox-unwrapped.version")));
  const nixpkgsFirefoxEsr = nixEvalRaw(("".concat("(import ", flakeExpr, ".inputs.nixpkgs { system = \"x86_64-linux\"; }).firefox-esr-unwrapped.version")));
  const zen = (((_truthy) => _truthy !== false && _truthy != null)(zenSurfer) ? (() => { try {
    const j = JSON.parse(zenSurfer);
  return ((_logical) => (_logical !== false && _logical != null ? _logical : null))((() => { const some_thread____0 = j.version; return ((some_thread____0 == null) ? null : some_thread____0.version); })());
  } catch (e) {
    errors.push("Zen surfer.json parse failed");
    return null;
  } })() : null);
  const librewolf = (((_truthy) => _truthy !== false && _truthy != null)(librewolfPkgbuild) ? ((_logical) => (_logical !== false && _logical != null ? _logical : null))(librewolfPkgbuild.trim().split("\n")[0].split("-")[0]) : null);
  const advisoryCount = ({value: null, watches: {}});
  const inTheWildCount = ({value: null, watches: {}});
  if (((_truthy) => _truthy !== false && _truthy != null)(advHtml)) {
    (() => { const _a = advisoryCount, _v = 0; const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
    (() => { const _a = inTheWildCount, _v = 0; const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
    const sectionRe = new RegExp("<h3 id=\"firefox([0-9.]+(?:esr)?)\"[^>]*>[\\s\\S]*?Fixed in Firefox ([0-9.]+(?:esr)?)\\s*</a>\\s*</h3>([\\s\\S]*?)(?=<h3 id=\"firefox|</main|<footer|$)", "g");
    const advRe = new RegExp("<a href=\"(/en-US/security/advisories/mfsa\\d{4}-\\d+/?)\"[^>]*>\\s*<span class=\"level ([a-z]+)\">", "g");
    const pinTuple = parseVer(pinned);
    (() => {  while (true) {
    const sm = sectionRe.exec(advHtml); if ((!(sm == null))) { (() => { const v = sm[2]; if (((_truthy) => _truthy !== false && _truthy != null)(v.endsWith("esr"))) {
  return null;
} else {
  const vt = parseVer(v);
  if ((cmpVer(vt, pinTuple) <= 0)) {
    return null;
  } else {
    const body = sm[3];
    (advRe.lastIndex = 0);
    return (() => {  while (true) {
    const am = advRe.exec(body); if ((!(am == null))) { (() => { const seen = advisoryCount.value; return (() => { const _a = advisoryCount, _v = (seen + 1); const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })(); })(); (($$bc$equiv(am[2], "critical")) ? (() => { const wild = inTheWildCount.value; return (() => { const _a = inTheWildCount, _v = (wild + 1); const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })(); })() : null);  continue; } else { return null; }
  } })();
  }
} })();  continue; } else { return null; }
  } })();
  }
  return {mozillaLatest: ((_logical) => (_logical !== false && _logical != null ? _logical : null))((() => { const some_thread____1 = moz; return ((some_thread____1 == null) ? null : some_thread____1.LATEST_FIREFOX_VERSION); })()), mozillaEsr: ((_logical) => (_logical !== false && _logical != null ? _logical : null))((() => { const some_thread____2 = moz; return ((some_thread____2 == null) ? null : some_thread____2.FIREFOX_ESR); })()), mozillaNightly: ((_logical) => (_logical !== false && _logical != null ? _logical : null))((() => { const some_thread____3 = moz; return ((some_thread____3 == null) ? null : some_thread____3.FIREFOX_NIGHTLY); })()), mozillaBeta: ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : null))((() => { const some_thread____5 = moz; return ((some_thread____5 == null) ? null : some_thread____5.FIREFOX_DEVEDITION); })())))((() => { const some_thread____4 = moz; return ((some_thread____4 == null) ? null : some_thread____4.LATEST_FIREFOX_DEVEL_VERSION); })()), nixpkgsFirefox: nixpkgsFirefox, nixpkgsFirefoxEsr: nixpkgsFirefoxEsr, zen: zen, librewolf: librewolf, advisoryCount: advisoryCount.value, inTheWildCount: inTheWildCount.value, errors: errors};
}

function mtime(p) {
  return (() => { try {
    return statSync(p).mtime;
  } catch (e) {
    return null;
  } })();
}

function fmtAge(d) {
  if ((d.getFullYear() <= 1970)) {
    return "nix-built";
  } else {
    const built_at = d.getTime();
    const ms = (Date.now() - built_at);
    const min = (ms / 60000);
    return ((min < 1) ? "just now" : ((min < 60) ? ("".concat(Math.round(min), " min ago")) : ((min < (60 * 24)) ? ("".concat(Math.round((min / 60)), " hr ago")) : ("".concat(Math.round(((min / 60) / 24)), " d ago")))));
  }
}

function gitStatusByLane() {
  const lane1 = [];
  const lane2 = [];
  const lane3 = [];
  const other = [];
  const raw = (() => { try {
    return execSync("git status --porcelain", {cwd: REPO_ROOT, encoding: "utf8"});
  } catch (e) {
    return "";
  } })();
  raw.split("\n").forEach((line) => {
  if (((_truthy) => _truthy !== false && _truthy != null)(line.trim())) {
    const file = line.slice(3).trim();
    if (((_truthy) => _truthy !== false && _truthy != null)(file.startsWith("src/gjoa/chrome/"))) {
      lane1.push(file);
    } else if (((_truthy) => _truthy !== false && _truthy != null)(file.startsWith("src/gjoa/browser/"))) {
      lane2.push(file);
    } else if (((_truthy) => _truthy !== false && _truthy != null)(file.startsWith("patches/"))) {
      lane2.push(file);
    } else if (((_truthy) => _truthy !== false && _truthy != null)(file.startsWith("configs/branding/"))) {
      lane2.push(file);
    } else if (($$bc$equiv(file, "gjoa.json"))) {
      lane3.push(file);
    } else if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(file, "flake.nix")) || ($$bc$equiv(file, "flake.lock"))))) {
      lane3.push(file);
    } else {
      other.push(file);
    }
  }
});
  return {lane1: lane1, lane2: lane2, lane3: lane3, other: other};
}

function section(title) {
  console.log("");
  return console.log(bold(("".concat("▸ ", title))));
}

function row(label, value) {
  return console.log(("".concat("  ", label.padEnd(22), " ", value)));
}

async function main_bang() {
  const jsonMode = process.argv.includes("--json");
  const gjoa = JSON.parse(readFileSync(GJOA_JSON, "utf8"));
  const pinned = gjoa.firefox.version;
  process.stderr.write(dim("probing oracles…\r"));
  const oracles = await loadOracles_bang(pinned);
  process.stderr.write("                  \r");
  if (jsonMode) {
    console.log(JSON.stringify({pinned: pinned, oracles: oracles}, null, 2));
    return null;
  } else {
    const hasMach = existsSync(MACH_BIN);
    const hasNix = existsSync(NIX_RESULT);
    const hasDist = existsSync(DIST_CHROME);
    const hasDevOverlay = existsSync(MACH_DEV_OVERLAY);
    const lanes = gitStatusByLane();
    const critical = ((((_logical) => (_logical !== false && _logical != null ? _logical : 0))($$bc$get(oracles, "inTheWildCount")) > 0) || ((_logical) => (_logical !== false && _logical != null ? (() => { const pinned_major = parseVer(pinned)[0]; const latest_major = parseVer($$bc$get(oracles, "mozillaLatest"))[0]; return (pinned_major < (latest_major - 1)); })() : _logical))($$bc$get(oracles, "mozillaLatest")));
    const stale = ((!((_truthy) => _truthy !== false && _truthy != null)(critical)) && ((_logical) => (_logical !== false && _logical != null ? (cmpVer(parseVer(pinned), parseVer($$bc$get(oracles, "mozillaLatest"))) < 0) : _logical))($$bc$get(oracles, "mozillaLatest")));
    const threat = (((_truthy) => _truthy !== false && _truthy != null)(critical) ? red("CRITICAL") : (((_truthy) => _truthy !== false && _truthy != null)(stale) ? yellow("STALE") : green("OK")));
    console.log(("".concat(bold("gjoa // status"), "  ", dim(new Date().toISOString().slice(0, 19).replace("T", " ")), "  ", threat)));
    section("VERSION POSITION");
    row("our pin", bold(pinned));
    row("Mozilla stable", ("".concat(((_logical) => (_logical !== false && _logical != null ? _logical : dim("—")))($$bc$get(oracles, "mozillaLatest")), "  ", delta(pinned, $$bc$get(oracles, "mozillaLatest")))));
    row("Mozilla ESR", ((_logical) => (_logical !== false && _logical != null ? _logical : dim("—")))($$bc$get(oracles, "mozillaEsr")));
    row("Mozilla beta", ((_logical) => (_logical !== false && _logical != null ? _logical : dim("—")))($$bc$get(oracles, "mozillaBeta")));
    row("Mozilla nightly", ((_logical) => (_logical !== false && _logical != null ? _logical : dim("—")))($$bc$get(oracles, "mozillaNightly")));
    row("nixpkgs firefox", ("".concat(((_logical) => (_logical !== false && _logical != null ? _logical : dim("—")))($$bc$get(oracles, "nixpkgsFirefox")), "  ", delta(pinned, $$bc$get(oracles, "nixpkgsFirefox")))));
    row("nixpkgs ESR", ((_logical) => (_logical !== false && _logical != null ? _logical : dim("—")))($$bc$get(oracles, "nixpkgsFirefoxEsr")));
    row("Zen browser", ("".concat(((_logical) => (_logical !== false && _logical != null ? _logical : dim("—")))($$bc$get(oracles, "zen")), "  ", delta(pinned, $$bc$get(oracles, "zen")))));
    row("LibreWolf", ("".concat(((_logical) => (_logical !== false && _logical != null ? _logical : dim("—")))($$bc$get(oracles, "librewolf")), "  ", delta(pinned, $$bc$get(oracles, "librewolf")))));
    section("SECURITY POSTURE");
    if (($$bc$get(oracles, "advisoryCount") == null)) {
      row("advisories", dim("offline -- could not fetch"));
    } else if (($$bc$equiv($$bc$get(oracles, "advisoryCount"), 0))) {
      row("unfixed CVEs", green("0"));
      row("in-the-wild", green("0"));
    } else {
      const sevColor = ((((_logical) => (_logical !== false && _logical != null ? _logical : 0))($$bc$get(oracles, "inTheWildCount")) > 0) ? red : yellow);
      row("unfixed CVEs", sevColor(String($$bc$get(oracles, "advisoryCount"))));
      row("in-the-wild", sevColor(String(((_logical) => (_logical !== false && _logical != null ? _logical : 0))($$bc$get(oracles, "inTheWildCount")))));
    }
    section("BUILD STATE");
    row("are we using nixpkgs?", dim("no -- we feed buildMozillaMach our own patched source"));
    row("nix binary", (hasNix ? ("".concat(green("✓"), "  ", dim((((_truthy) => _truthy !== false && _truthy != null)(mtime(NIX_RESULT)) ? fmtAge(mtime(NIX_RESULT)) : "?")))) : dim("·  not built")));
    row("mach binary", (hasMach ? ("".concat(green("✓"), "  ", dim((((_truthy) => _truthy !== false && _truthy != null)(mtime(MACH_BIN)) ? fmtAge(mtime(MACH_BIN)) : "?")))) : dim("·  not built")));
    row("dist/chrome", (hasDist ? ("".concat(green("✓"), "  ", dim((((_truthy) => _truthy !== false && _truthy != null)(mtime(DIST_CHROME)) ? fmtAge(mtime(DIST_CHROME)) : "?")))) : dim("·  stale, run `bun run chrome:dist`")));
    row("dev-mode overlay", (hasDevOverlay ? green("✓") : dim("·  gjoa-dev/ not symlinked yet")));
    section("WORKING TREE");
    console.log(("".concat("  ", dim("Lane 1: chrome Beagle/CSS -- `gjoa sync` + restart, ~1s, no rebuild"))));
    console.log(("".concat("  ", dim("Lane 2: Firefox .sys.mjs / patches / branding -- `bun run import && ./mach build faster`, ~30s"))));
    console.log(("".concat("  ", dim("Lane 3: gjoa.json (version) / flake.nix / C++/Rust -- full mach or nix build, 30-60 min"))));
    console.log("");
    if (((_truthy) => _truthy !== false && _truthy != null)($$bc$get(lanes, "lane1").length)) {
      row(green("Lane 1"), ("".concat(String($$bc$get(lanes, "lane1").length), " file", (($$bc$equiv($$bc$get(lanes, "lane1").length, 1)) ? "" : "s"))));
    }
    if (((_truthy) => _truthy !== false && _truthy != null)($$bc$get(lanes, "lane2").length)) {
      row(yellow("Lane 2"), ("".concat(String($$bc$get(lanes, "lane2").length), " file", (($$bc$equiv($$bc$get(lanes, "lane2").length, 1)) ? "" : "s"))));
    }
    if (((_truthy) => _truthy !== false && _truthy != null)($$bc$get(lanes, "lane3").length)) {
      row(red("Lane 3"), ("".concat(String($$bc$get(lanes, "lane3").length), " file", (($$bc$equiv($$bc$get(lanes, "lane3").length, 1)) ? "" : "s"))));
    }
    if (((_truthy) => _truthy !== false && _truthy != null)($$bc$get(lanes, "other").length)) {
      row(dim("other"), dim(("".concat(String($$bc$get(lanes, "other").length), " files (docs/config/test, no rebuild)"))));
    }
    if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)($$bc$get(lanes, "lane1").length)) && ((!((_truthy) => _truthy !== false && _truthy != null)($$bc$get(lanes, "lane2").length)) && ((!((_truthy) => _truthy !== false && _truthy != null)($$bc$get(lanes, "lane3").length)) && (!((_truthy) => _truthy !== false && _truthy != null)($$bc$get(lanes, "other").length))))))) {
      row("(clean tree)", "");
    }
    section("RECOMMENDED NEXT");
    const rec = [];
    if (((_truthy) => _truthy !== false && _truthy != null)($$bc$get(lanes, "lane3").length)) {
      rec.push(red("Lane 3 changes pending. Run the full build when ready."));
    } else if (((_truthy) => _truthy !== false && _truthy != null)($$bc$get(lanes, "lane2").length)) {
      if ((!hasMach)) {
        rec.push(yellow("Lane 2 changes pending but no mach binary."));
        rec.push(("".concat("  direnv exec . bash -c 'cd engine && ./mach build'   ", dim("(~30-60 min cold)"))));
      } else {
        rec.push(yellow("Lane 2 changes pending."));
        rec.push("  bun run import  &&  (cd engine && ./mach build faster)  &&  gjoa hotreload");
      }
    } else if (((_truthy) => _truthy !== false && _truthy != null)($$bc$get(lanes, "lane1").length)) {
      rec.push(green("Lane 1 only."));
      rec.push(("".concat("  gjoa sync  &&  ", (hasMach ? "gjoa hotreload" : "gjoa"), dim(("".concat("  (", (hasMach ? "mach" : "nix"), " binary)"))))));
    } else {
      rec.push(green("Clean. Launch with `gjoa` or `gjoa hotreload`."));
    }
    rec.forEach((line) => {
  console.log(("".concat("  ", line)));
});
    if (($$bc$get(oracles, "errors").length > 0)) {
      console.log("");
      console.log(dim(("".concat("oracles offline: ", $$bc$get(oracles, "errors").join(", ")))));
    }
    console.log("");
    return console.log(dim("docs/ARCHITECTURE.md  ·  AGENTS.md"));
  }
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang().catch((e) => { console.error(e);
return process.exit(1); });
}
