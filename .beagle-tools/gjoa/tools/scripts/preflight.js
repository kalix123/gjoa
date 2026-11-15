import { existsSync, readFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { join, basename } from 'path';
import { check_contract } from '../prep/symbol-resolve.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO_ROOT = process.cwd();

const ENGINE_DIR = join(REPO_ROOT, "engine");

const FLAKE = join(REPO_ROOT, "flake.nix");

const PATCHES_DIR = join(REPO_ROOT, "patches");

const GJOA_JSON = join(REPO_ROOT, "gjoa.json");

const tty = process.stdout.isTTY;

function c(s, code) {
  return (((_truthy) => _truthy !== false && _truthy != null)(tty) ? ("".concat("[", code, "m", s, "[0m")) : s);
}

function green(s) {
  return c(s, "32");
}

function red(s) {
  return c(s, "31");
}

function yellow(s) {
  return c(s, "33");
}

function dim(s) {
  return c(s, "2");
}

function bold(s) {
  return c(s, "1");
}

const results = [];

function pass(id, name, detail) {
  return results.push({id: id, name: name, passed: true, detail: detail});
}

function fail(id, name, detail, fix) {
  return results.push({id: id, name: name, passed: false, detail: detail, fix: fix});
}

function warn(id, name, detail) {
  return results.push({id: id, name: name, passed: true, warned: true, detail: detail});
}

function sh(cmd, opts) {
  return (() => { try {
    const out = execSync(cmd, {encoding: "utf8", timeout: ((_logical) => (_logical !== false && _logical != null ? _logical : 30000))(opts.timeout), stdio: ["ignore", "pipe", "pipe"]});
  return {ok: true, out: out};
  } catch (e) {
    const timedOut = (($$bc$equiv(e.code, "ETIMEDOUT")) || ($$bc$equiv(e.signal, "SIGTERM")));
    const stderr = (((_truthy) => _truthy !== false && _truthy != null)(e.stderr) ? e.stderr.toString() : "");
    const stdout = (((_truthy) => _truthy !== false && _truthy != null)(e.stdout) ? e.stdout.toString() : "");
    return {ok: false, timedOut: timedOut, out: ((_logical) => (_logical !== false && _logical != null ? _logical : e.message))(("".concat(stderr, stdout)))};
  } })();
}

function gateA_bang() {
  const cache = ("".concat(process.env.HOME, "/.cache/gjoa/sources"));
  const gjoa = JSON.parse(readFileSync(GJOA_JSON, "utf8"));
  const tarball = ("".concat(cache, "/firefox-", gjoa.firefox.version, ".source.tar.xz"));
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(tarball)))) {
    return fail("A", "patches apply clean on fresh source", ("".concat("tarball not cached at ", tarball)), "run `bun run download` to populate the cache");
  } else {
    const tmp = "/tmp/gjoa-preflight-engine";
    sh(("".concat("rm -rf ", tmp, " && mkdir -p ", tmp)), {});
    const extract = sh(("".concat("tar -xJf ", tarball, " -C ", tmp, " --strip-components=1")), {timeout: 180000});
    if ((!((_truthy) => _truthy !== false && _truthy != null)(extract.ok))) {
      return fail("A", "patches apply clean on fresh source", "tarball extract failed", extract.out.slice(0, 400));
    } else {
      sh(("".concat("cd ", tmp, " && git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -q -m baseline")), {timeout: 60000});
      const patches = readdirSync(PATCHES_DIR).filter((p) => p.endsWith(".patch")).sort();
      const failed = [];
      const drifted = [];
      const stopped = ({value: false, watches: {}});
      patches.forEach((p) => {
  if ((!stopped.value)) {
    const path = join(PATCHES_DIR, p);
    const pr = sh(("".concat("cd ", tmp, " && patch -p1 --dry-run --fuzz=0 --force -i ", path, " 2>&1 | grep -oiE 'offset -?[0-9]+' | grep -oE '[0-9]+' | sort -rn | head -1")), {});
    const off = parseInt(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(pr.out).trim(), 10);
    const r = sh(("".concat("cd ", tmp, " && git apply ", path)), {});
    if ((!((_truthy) => _truthy !== false && _truthy != null)(r.ok))) {
      failed.push(("".concat(p, ": ", ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(r.out.split("\n")[0]).trim())));
      (() => { const _a = stopped, _v = true; const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
    } else {
      if ((off > 0)) {
        drifted.push(("".concat(p, " (offset ", off, ")")));
      }
    }
  }
});
      return (((failed.length > 0)) ? fail("A", "patches apply clean on fresh source", ("".concat("cumulative apply stopped at the first failing patch (later patches build on it): ", failed.length, " failed")), ("".concat("regenerate the failing patch via `git diff` in a fresh extract WITH all prior patches applied (cumulative order matters):\n    ", failed.join("\n    ")))) : ((drifted.length > 0)) ? warn("A", "patches apply clean on fresh source", ("".concat(patches.length, "/", patches.length, " apply cumulatively, but ", drifted.length, " drifting on line-offset (early warning — regenerate before they .rej): ", drifted.join(", ")))) : pass("A", "patches apply clean on fresh source", ("".concat(patches.length, "/", patches.length, " apply clean cumulatively, no drift"))));
    }
  }
}

function gateB() {
  const ours = join(REPO_ROOT, "src", "gjoa", "browser", "components", "gjoa", "jar.mn");
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(ours)))) {
    return fail("B", "jar.mn pattern matches working example", ("".concat(ours, " missing")), "restore from git");
  } else {
    const content = readFileSync(ours, "utf8");
    const usesBrowserJar = new RegExp("^browser\\.jar:", "m").test(content);
    const hasContentDecl = new RegExp("^% content\\s+gjoa\\s+%content/gjoa/", "m").test(content);
    return (((!usesBrowserJar)) ? fail("B", "jar.mn pattern matches working example", "uses `<package>.jar:` syntax — silently no-op in modern Firefox", "change first non-comment line to `browser.jar:` (see browser/branding/unofficial/content/jar.mn)") : ((!hasContentDecl)) ? fail("B", "jar.mn pattern matches working example", "no `% content gjoa %content/gjoa/` registration line", "add `% content gjoa %content/gjoa/` after `browser.jar:`") : pass("B", "jar.mn pattern matches working example", "browser.jar: + % content gjoa %content/gjoa/"));
  }
}

function gateC() {
  const prodFiles = ["src/gjoa/browser/components/gjoa/GjoaLoader.sys.mjs", "src/gjoa/chrome/bjs/security/index.bjs", "src/gjoa/chrome/bjs/drawer/index.bjs", "src/gjoa/chrome/bjs/spaces/index.bjs", "src/gjoa/chrome/bjs/tabs/index.bjs"];
  const landmines = [];
  const stub_return = new RegExp("^\\s*return\\s*;?\\s*//\\s*(TODO|FIXME|future)", "i");
  const stub_comment = new RegExp("//\\s*(future commit|nothing yet|not yet implemented)", "i");
  prodFiles.forEach((f) => {
  const path = join(REPO_ROOT, f);
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(path))) {
    const lines = readFileSync(path, "utf8").split("\n");
    lines.forEach((l, i) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : stub_comment.test(l)))(stub_return.test(l)))) {
  return landmines.push(("".concat(f, ":", (i + 1), ": ", l.trim())));
} });
  }
});
  return ((landmines.length > 0) ? fail("C", "no production-mode TODO/no-op landmines", ("".concat(landmines.length, " suspicious dead-stub markers in production paths")), ("".concat("audit + implement or delete each:\n    ", landmines.join("\n    ")))) : pass("C", "no production-mode TODO/no-op landmines", ("".concat(prodFiles.length, " prod files scanned, none flagged"))));
}

function gateD() {
  const flakeContent = readFileSync(FLAKE, "utf8");
  const minNssMatch = flakeContent.match(new RegExp("minNssVersion\\s*=\\s*\"([^\"]+)\""));
  const minNss = (((_truthy) => _truthy !== false && _truthy != null)(minNssMatch) ? minNssMatch[1] : null);
  if ((minNss == null)) {
    return pass("D", "dep floors satisfied", "no minNssVersion gate declared");
  } else {
    const probe = sh(("".concat("nix eval --impure --raw --expr '(import (builtins.getFlake \"git+file://", REPO_ROOT, "\").inputs.nixpkgs { system = \"x86_64-linux\"; }).nss_latest.version' 2>&1")), {timeout: 60000});
    if ((!((_truthy) => _truthy !== false && _truthy != null)(probe.ok))) {
      return fail("D", "dep floors satisfied", "could not probe nixpkgs nss_latest.version", ("".concat("fix the nix eval error and re-run:\n", probe.out.slice(-300))));
    } else {
      const nixpkgsNss = probe.out.trim().split("\n").pop();
      return pass("D", "dep floors satisfied", ("".concat("minNssVersion=", minNss, ", nixpkgs nss_latest=", nixpkgsNss, " → overlay ", ((String(nixpkgsNss).localeCompare(String(minNss)) >= 0) ? "auto-disabled" : "ACTIVE (will fetch Mozilla tarball)"))));
    }
  }
}

function gateF() {
  const flakeContent = readFileSync(FLAKE, "utf8").split("\n").filter((l) => (!((_truthy) => _truthy !== false && _truthy != null)(new RegExp("^\\s*#").test(l)))).join("\n");
  const usesNoChroot = new RegExp("__noChroot\\s*=\\s*true").test(flakeContent);
  const usesImpure = new RegExp("__impure\\s*=\\s*true").test(flakeContent);
  if (((_truthy) => _truthy !== false && _truthy != null)(((!usesNoChroot) && (!usesImpure)))) {
    return pass("F", "nix daemon will accept flake settings", "no privileged settings in flake.nix");
  } else {
    const cfg = sh("nix show-config 2>/dev/null", {timeout: 15000});
    const sandboxLine = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(cfg.out.split("\n").find((l) => new RegExp("^sandbox = ").test(l)));
    const sandbox = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(sandboxLine.split("=")[1]).trim();
    return (((_truthy) => _truthy !== false && _truthy != null)((usesNoChroot && ($$bc$equiv(sandbox, "true")))) ? fail("F", "nix daemon will accept flake settings", "flake uses __noChroot but daemon has sandbox=true → rejected at eval", "either:\n      (a) remove __noChroot from flake.nix (Lane 1 edit; lose sccache persistence), or\n      (b) change sandbox = \"relaxed\" in nixos-config nix-settings module + firn rebuild") : pass("F", "nix daemon will accept flake settings", ("".concat("sandbox=", sandbox, " permits __noChroot/__impure"))));
  }
}

function gateG() {
  const r = sh(("".concat("nix eval --impure --raw '", REPO_ROOT, "#gjoa.outPath' 2>&1")), {timeout: 120000});
  return ((!((_truthy) => _truthy !== false && _truthy != null)(r.ok)) ? (((_truthy) => _truthy !== false && _truthy != null)(r.timedOut) ? warn("G", "nix flake evaluates without errors", "nix eval timed out — not a real eval failure; re-run with a clean tree or longer timeout") : fail("G", "nix flake evaluates without errors", "evaluation failed — build cannot proceed", r.out.split("\n").filter((l) => l.toLowerCase().includes("error")).slice(0, 5).join("\n      "))) : pass("G", "nix flake evaluates without errors", ("".concat("derivation resolves to ", r.out.trim().split("\n").pop().slice(-50)))));
}

function gateI() {
  const loaderPath = join(REPO_ROOT, "src", "gjoa", "browser", "components", "gjoa", "GjoaLoader.bjs");
  const jarPath = join(REPO_ROOT, "src", "gjoa", "browser", "components", "gjoa", "jar.mn");
  const bakePath = join(REPO_ROOT, "tools", "prep", "chrome-bake.bjs");
  if ((!((_truthy) => _truthy !== false && _truthy != null)([loaderPath, jarPath, bakePath].every(existsSync)))) {
    return fail("I", "chrome bundle three-way alignment", "one of loader/jar/bake missing", "investigate");
  } else {
    const loader = readFileSync(loaderPath, "utf8");
    const jar = readFileSync(jarPath, "utf8");
    const bake = readFileSync(bakePath, "utf8");
    const loaderScripts = Array.from(loader.matchAll(new RegExp("\"(gjoa-[a-z-]+\\.uc\\.js)\"", "g"))).map((m) => m[1]).sort();
    const jarScripts = Array.from(jar.matchAll(new RegExp("scripts/(gjoa-[a-z-]+\\.uc\\.js)", "g"))).map((m) => m[1]).filter((v, i, a) => (a.indexOf(v) === i)).sort();
    const bakeScripts = Array.from(bake.matchAll(new RegExp("\"(gjoa-[a-z-]+\\.uc\\.js)\"", "g"))).map((m) => m[1]).sort();
    const loaderStyles = Array.from(loader.matchAll(new RegExp("\"(gjoa(?:-[a-z-]+)?\\.uc\\.css)\"", "g"))).map((m) => m[1]).sort();
    const jarStyles = Array.from(jar.matchAll(new RegExp("styles/(gjoa(?:-[a-z-]+)?\\.uc\\.css)", "g"))).map((m) => m[1]).filter((v, i, a) => (a.indexOf(v) === i)).sort();
    const bakeStyles = Array.from(bake.matchAll(new RegExp("\"(gjoa(?:-[a-z-]+)?\\.uc\\.css)\"", "g"))).map((m) => m[1]).sort();
    const eq = (a, b) => (($$bc$equiv(a.length, b.length)) && a.every((x, i) => ($$bc$equiv(x, b[i]))));
    return ((((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(eq(loaderScripts, jarScripts))) || (!((_truthy) => _truthy !== false && _truthy != null)(eq(loaderScripts, bakeScripts)))))) ? fail("I", "chrome bundle three-way alignment", ("".concat("script lists differ:\n      loader: ", loaderScripts.join(", "), "\n      jar:    ", jarScripts.join(", "), "\n      bake:   ", bakeScripts.join(", "))), "align all three so they declare the exact same .uc.js filenames") : (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(eq(loaderStyles, jarStyles))) || (!((_truthy) => _truthy !== false && _truthy != null)(eq(loaderStyles, bakeStyles)))))) ? fail("I", "chrome bundle three-way alignment", ("".concat("style lists differ:\n      loader: ", loaderStyles.join(", "), "\n      jar:    ", jarStyles.join(", "), "\n      bake:   ", bakeStyles.join(", "))), "align all three so they declare the exact same .uc.css filenames") : pass("I", "chrome bundle three-way alignment", ("".concat(loaderScripts.length, " script + ", loaderStyles.length, " style bundles agree across loader / jar.mn / chrome-bake.bjs"))));
  }
}

function gateJ() {
  const script = join(REPO_ROOT, "tools", "prep", "verify-scriptlet-resources.sh");
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(script)))) {
    return fail("J", "scriptlet bundle integrity", "verify-scriptlet-resources.sh missing", "restore the F10 verifier");
  } else {
    const r = sh(("".concat("bash ", script)), {});
    return (((_truthy) => _truthy !== false && _truthy != null)(r.ok) ? pass("J", "scriptlet bundle integrity", "scriptlet-resources.json matches the pinned SHA-256") : fail("J", "scriptlet bundle integrity", ((_logical) => (_logical !== false && _logical != null ? _logical : "digest mismatch"))(r.out).trim(), "if you refreshed the bundle from a pinned uBO commit, update the SHA-256 in verify-scriptlet-resources.sh AND scriptlet-resources.PROVENANCE.md"));
  }
}

const IMPORT_STAMP = join(ENGINE_DIR, ".gjoa-import-stamp");

function gateK() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(IMPORT_STAMP)))) {
    return fail("K", "engine/ reflects current source (import-currency)", "no engine/.gjoa-import-stamp — engine/ is unimported", "run `bun run import` to (re)build engine/ from src/gjoa/ + patches/");
  } else {
    const stamp_r = sh(("".concat("stat -c %Y '", IMPORT_STAMP, "'")), {});
    const newest_r = sh("find src/gjoa patches tools/prep -type f -printf '%T@\\n' 2>/dev/null | sort -rn | head -1", {});
    const stamp_out = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(stamp_r.out).trim();
    const newest_out = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(newest_r.out).trim();
    return (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(stamp_r.ok)) || ((!((_truthy) => _truthy !== false && _truthy != null)(newest_r.ok)) || (($$bc$equiv(stamp_out, "")) || ($$bc$equiv(newest_out, "")))))) ? warn("K", "engine/ reflects current source (import-currency)", "could not determine source/stamp mtimes — skipping (non-fatal)") : ((parseInt(newest_out, 10) > parseInt(stamp_out, 10)) ? fail("K", "engine/ reflects current source (import-currency)", "src/gjoa/, patches/, or tools/prep/ changed since the last `bun run import`", "run `bun run import` — the build compiles engine/, not src/, so un-imported edits silently vanish from the binary") : pass("K", "engine/ reflects current source (import-currency)", "no src/patches/tooling edits since the last import")));
  }
}

const OVERLAY_FILES = [join(REPO_ROOT, "src", "gjoa", "browser", "components", "gjoa", "GjoaLoader.bjs")];

const DEP_BULLET_RE = new RegExp("(?:#|;;)\\s*-\\s*((?:rust|cpp|webidl|js)-[a-z-]+)\\s+\\S", "gm");

function count_declared_deps(text) {
  const m = text.match(DEP_BULLET_RE);
  return (((_truthy) => _truthy !== false && _truthy != null)(m) ? m.length : 0);
}

function gateL() {
  const patch_files = readdirSync(PATCHES_DIR).filter((p) => p.endsWith(".patch")).map((p) => join(PATCHES_DIR, p));
  const files = patch_files.concat(OVERLAY_FILES.filter((f) => existsSync(f)));
  const not_found = [];
  const ambiguous = [];
  const unsupported = [];
  const dropped = [];
  const resolved = [];
  files.forEach((f) => {
  const text = readFileSync(f, "utf8");
  const results = check_contract(text);
  const declared = count_declared_deps(text);
  const result_count = results.length;
  const delta = (declared - result_count);
  if ((delta > 0)) {
    dropped.push(("".concat(basename(f), ": ", delta, " declared depends-on bullet(s) parsed to nothing (unknown/typo'd kind — vocabulary drift)")));
  }
  results.forEach((r) => {
  if (($$bc$equiv(r.verdict, "not-found"))) {
    not_found.push(("".concat(basename(f), ": ", r.kind, " `", r.symbol, "` — ", r.detail)));
  } else if (($$bc$equiv(r.verdict, "unsupported"))) {
    unsupported.push(("".concat(basename(f), ": ", r.kind, " `", r.symbol, "` — ", r.detail)));
  } else if (($$bc$equiv(r.verdict, "ambiguous"))) {
    ambiguous.push(("".concat(basename(f), ": ", r.symbol)));
  } else {
    resolved.push(r.symbol);
  }
});
});
  return (((((not_found.length + unsupported.length) + dropped.length) > 0)) ? fail("L", "surface contracts (declared upstream deps resolve)", ("".concat(((not_found.length + unsupported.length) + dropped.length), " declared dependency(ies) unresolved or unevaluated (", resolved.length, " resolved)")), ("".concat("regenerate the patch/overlay against current upstream, or fix the dep declaration:\n    ", not_found.concat(unsupported).concat(dropped).join("\n    ")))) : ((ambiguous.length > 0)) ? warn("L", "surface contracts (declared upstream deps resolve)", ("".concat(resolved.length, " resolved, ", ambiguous.length, " ambiguous (cfg/glob/no-objdir — can't prove): ", ambiguous.join(", ")))) : pass("L", "surface contracts (declared upstream deps resolve)", ("".concat(resolved.length, " declared upstream dependencies resolve"))));
}

const BEAGLE_REF_FILE = join(REPO_ROOT, "configs", "beagle.ref");

function beagle_pin_dir(pinned) {
  return ((_logical) => (_logical !== false && _logical != null ? _logical : join(process.env.HOME, "code", "beagle", "pins", pinned)))(process.env.BEAGLE_PIN_ROOT);
}

function gate_m_fix(pinned, pin_dir) {
  return ("".concat("create the immutable content-addressed pin for this full object ID:\n", "      `git -C ~/code/beagle/main worktree add --detach ", pin_dir, " ", pinned, "`\n", "      write `", pin_dir, ".pin` naming Gjoa as a consumer\n", "    To bump deliberately: create the new pin → update configs/beagle.ref → ", "`bun run import` (re-vendors core.js) → `bun run sovereignty:manifest` ", "(recompile chrome) → smoke-test → commit together. Never re-point an existing pin."));
}

function gateM() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(BEAGLE_REF_FILE)))) {
    return fail("M", "beagle compiler pinned (beagle-currency)", "no configs/beagle.ref — gjoa has no reproducible Beagle compiler object", "record the intended full object ID, then create its immutable content-addressed pin");
  } else {
    const lines = readFileSync(BEAGLE_REF_FILE, "utf8").split("\n");
    const pinned = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(lines.find((l) => ((l.trim().length > 0) && (!((_truthy) => _truthy !== false && _truthy != null)(l.trim().startsWith("#")))))).trim();
    const valid_ref = new RegExp("^[0-9a-f]+$").test(pinned);
    const pin_dir = beagle_pin_dir(pinned);
    const r = (valid_ref ? sh(("".concat("git -C ", pin_dir, " rev-parse HEAD")), {}) : {ok: false, out: ""});
    const actual = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(r.out).trim();
    return ((($$bc$equiv(pinned, ""))) ? fail("M", "beagle compiler pinned (beagle-currency)", "configs/beagle.ref has no ref line", "add the intended beagle commit hash to configs/beagle.ref") : ((!valid_ref)) ? fail("M", "beagle compiler pinned (beagle-currency)", "configs/beagle.ref must contain one lowercase hexadecimal full object ID", "replace the ref with `git -C ~/code/beagle/main rev-parse HEAD`") : (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(r.ok)) || ($$bc$equiv(actual, ""))))) ? fail("M", "beagle compiler pinned (beagle-currency)", ("".concat("could not read ", pin_dir, " HEAD — the pin checkout is missing")), gate_m_fix(pinned, pin_dir)) : ((actual === pinned)) ? pass("M", "beagle compiler pinned (beagle-currency)", ("".concat(pin_dir, " at pinned ref ", pinned.slice(0, 12)))) : fail("M", "beagle compiler pinned (beagle-currency)", ("".concat(pin_dir, " HEAD ", actual.slice(0, 12), " != pinned ", pinned.slice(0, 12), " — chrome would be compiled against a DIFFERENT beagle than pinned (emit/$$bc-runtime drift)")), gate_m_fix(pinned, pin_dir)));
  }
}

const REGISTRY_FILE = join(REPO_ROOT, "src", "gjoa", "browser", "components", "gjoa", "content", "settings", "registry.json");

const LOADER_FILE = join(REPO_ROOT, "src", "gjoa", "browser", "components", "gjoa", "GjoaLoader.bjs");

const PREF_DIR = join(REPO_ROOT, "src", "gjoa", "defaults", "pref");

function quoted_strings(s) {
  const m = s.match(new RegExp("\"[^\"]+\"", "g"));
  return (((_truthy) => _truthy !== false && _truthy != null)(m) ? m.map((q) => q.slice(1, -1)) : []);
}

function preset_pref_names(loader) {
  const start = loader.indexOf("(def PRIVACY-PRESETS");
  const end = loader.indexOf("(defn apply-privacy-profile!");
  const block = (((_truthy) => _truthy !== false && _truthy != null)(((start >= 0) && (end > start))) ? loader.slice(start, end) : "");
  return quoted_strings(block).filter((q) => q.includes("."));
}

function gateN() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? existsSync(PREF_DIR) : _logical))(existsSync(LOADER_FILE)) : _logical))(existsSync(REGISTRY_FILE))))) {
    return warn("N", "knobs backed + reversible (knob-not-delete)", "no about:gjoa registry/loader/prefs — skipping");
  } else {
    const reg = JSON.parse(readFileSync(REGISTRY_FILE, "utf8"));
    const loader = readFileSync(LOADER_FILE, "utf8");
    const pref_src = readdirSync(PREF_DIR).filter((f) => f.endsWith(".bjs")).map((f) => readFileSync(join(PREF_DIR, f), "utf8")).join("\n");
    const src = ("".concat(pref_src, "\n", loader));
    const pv = reg.privacy;
    const sel = ((_logical) => (_logical !== false && _logical != null ? pv.selector : _logical))(pv);
    const profiles = ((_logical) => (_logical !== false && _logical != null ? _logical : []))(((_logical) => (_logical !== false && _logical != null ? sel.profiles : _logical))(sel));
    const knob_prefs = [];
    const __g = (() => { ((_logical) => (_logical !== false && _logical != null ? _logical : []))(((_logical) => (_logical !== false && _logical != null ? pv.granular : _logical))(pv)).forEach((g) => {
  knob_prefs.push(g.pref);
}); })();
    const __ps = (() => { profiles.forEach((p) => {
  (() => { Object.keys(p.sets).forEach((k) => {
  knob_prefs.push(k);
}); })();
}); })();
    const __s = (() => { ((_logical) => (_logical !== false && _logical != null ? _logical : []))(reg.sections).forEach((sec) => {
  (() => { ((_logical) => (_logical !== false && _logical != null ? _logical : []))(sec.settings).forEach((s) => {
  knob_prefs.push(s.pref);
}); })();
  (() => { ((_logical) => (_logical !== false && _logical != null ? _logical : []))(sec.subsections).forEach((sub) => {
  (() => { ((_logical) => (_logical !== false && _logical != null ? _logical : []))(sub.settings).forEach((s) => {
  knob_prefs.push(s.pref);
}); })();
}); })();
}); })();
    const dangling = knob_prefs.filter((pf) => (!((_truthy) => _truthy !== false && _truthy != null)(src.includes(("".concat("\"", pf, "\""))))));
    const reg_prefs = Array.from(new Set(profiles.flatMap((p) => Object.keys(p.sets)))).sort();
    const preset_prefs = Array.from(new Set(preset_pref_names(loader))).sort();
    const drift = (!($$bc$equiv(reg_prefs.join("|"), preset_prefs.join("|"))));
    return (((dangling.length > 0)) ? fail("N", "knobs backed + reversible (knob-not-delete)", ("".concat(dangling.length, " knob(s) reference a pref set nowhere in source")), ("".concat("a feature was deleted but its knob remains (or a typo) — restore the pref (reversible!) or drop the knob:\n    ", dangling.join("\n    ")))) : (drift) ? fail("N", "knobs backed + reversible (knob-not-delete)", "registry privacy `sets` prefs != GjoaLoader PRIVACY-PRESETS prefs", ("".concat("the picker would set different prefs than the loader applies — sync them.\n    registry: ", reg_prefs.join(", "), "\n    PRESETS:  ", preset_prefs.join(", ")))) : pass("N", "knobs backed + reversible (knob-not-delete)", ("".concat(knob_prefs.length, " knobs backed by real prefs; privacy presets (", preset_prefs.length, " prefs) in sync with the loader"))));
  }
}

function gateO() {
  const gjoaDir = join(REPO_ROOT, "engine", "browser", "components", "gjoa");
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(gjoaDir)))) {
    return warn("O", "no bare beagle/ import in shipped gjoa .sys.mjs", "engine/ not extracted yet — run after `bun run import`");
  } else {
    const dirs = ("".concat(gjoaDir, " ", join(REPO_ROOT, "engine", "toolkit", "components", "content-classifier")));
    const r = sh(("".concat("grep -rlE \"from 'beagle/\" ", dirs, " --include=*.sys.mjs 2>/dev/null || true")), {});
    const hits = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(r.out).trim();
    return (($$bc$equiv(hits, "")) ? pass("O", "no bare beagle/ import in shipped gjoa .sys.mjs", "all $$bc runtime imports resolve to resource:///modules/gjoa/beagle/") : fail("O", "no bare beagle/ import in shipped gjoa .sys.mjs", ("".concat("unresolvable bare `import from 'beagle/...'` in: ", hits.replaceAll("\n", ", "))), "compile that .bjs with BEAGLE_JS_RUNTIME_PREFIX=resource:///modules/gjoa/beagle/ (tools/prep/overlay.bjs) + vendor the runtime"));
  }
}

const PATCH_HASHES_FILE = join(REPO_ROOT, "configs", "patch-hashes.json");

function sha256_file(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function gateP() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(PATCH_HASHES_FILE)))) {
    return fail("P", "patch hashes match recorded manifest", "no configs/patch-hashes.json — patch drift is unguarded", "create configs/patch-hashes.json with {\"algorithm\":\"sha256\",\"patches\":{<file>:<sha256>}} for every patches/*.patch");
  } else {
    const manifest = JSON.parse(readFileSync(PATCH_HASHES_FILE, "utf8"));
    const recorded = ((_logical) => (_logical !== false && _logical != null ? _logical : {}))(manifest.patches);
    const patches = readdirSync(PATCHES_DIR).filter((p) => p.endsWith(".patch")).sort();
    const mismatched = [];
    const missing = [];
    patches.forEach((p) => {
  const actual = sha256_file(join(PATCHES_DIR, p));
  const expected = recorded[p];
  if ((expected == null)) {
    missing.push(("".concat(p, " (no entry in manifest)")));
  } else if ((!($$bc$equiv(actual, expected)))) {
    mismatched.push(("".concat(p, ": recorded ", expected.slice(0, 12), "… actual ", actual.slice(0, 12), "…")));
  }
});
    const stale = Object.keys(recorded).filter((k) => ($$bc$equiv(patches.indexOf(k), -1)));
    return ((((_truthy) => _truthy !== false && _truthy != null)(((mismatched.length > 0) || ((missing.length > 0) || (stale.length > 0))))) ? fail("P", "patch hashes match recorded manifest", ("".concat(mismatched.length, " drifted, ", missing.length, " unrecorded, ", stale.length, " stale entry(ies)")), ("".concat("a patch changed without updating its recorded hash — review the diff, then regenerate the manifest:\n", "      cd patches && for f in $(ls *.patch | sort); do echo \"$f $(sha256sum \"$f\" | cut -d' ' -f1)\"; done\n", "    drift:      ", mismatched.join("\n                "), "\n", "    unrecorded: ", missing.join(", "), "\n", "    stale:      ", stale.join(", ")))) : pass("P", "patch hashes match recorded manifest", ("".concat(patches.length, "/", patches.length, " patch hashes match configs/patch-hashes.json"))));
  }
}

const VENDORED_CORE = join(ENGINE_DIR, "browser", "components", "gjoa", "beagle", "core.js");

const GJOA_LOADER_MJS = join(ENGINE_DIR, "browser", "components", "gjoa", "GjoaLoader.sys.mjs");

const GJOA_BUNDLE_DIST_DIR = join(REPO_ROOT, "dist", "chrome", "JS");

function core_export_surface(src) {
  const surface = new Set();
  Array.from(src.matchAll(new RegExp("export\\s+(?:function|const)\\s+([A-Za-z_$][A-Za-z0-9_$]*)", "g"))).forEach((m) => {
  surface.add(m[1]);
});
  return surface;
}

function referenced_runtime_symbols(src) {
  const refs = new Set();
  Array.from(src.matchAll(new RegExp("\\$\\$bc\\.([A-Za-z_$][A-Za-z0-9_$]*)", "g"))).forEach((m) => {
  refs.add(m[1]);
});
  Array.from(src.matchAll(new RegExp("import\\s*\\{([^}]*)\\}\\s*from\\s*['\"][^'\"]*beagle/core\\.js['\"]", "g"))).forEach((m) => {
  m[1].split(",").forEach((clause) => {
  const t = clause.trim();
  if ((t.length > 0)) {
    refs.add(t.split(new RegExp("\\s"))[0].trim());
  }
});
});
  return refs;
}

function gateQ() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(VENDORED_CORE)))) {
    return warn("Q", "$$bc runtime export-closure (emit ↔ core.js)", "engine/.../beagle/core.js not vendored yet — run after `bun run import`");
  } else {
    if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(GJOA_BUNDLE_DIST_DIR)))) {
      return fail("Q", "$$bc runtime export-closure (emit ↔ core.js)", "dist/chrome/JS is missing", "run `bun run chrome:dist` to produce the canonical chrome bundle output");
    } else {
      const surface = core_export_surface(readFileSync(VENDORED_CORE, "utf8"));
      const bundle_files = readdirSync(GJOA_BUNDLE_DIST_DIR).filter((f) => f.endsWith(".uc.js")).map((f) => join(GJOA_BUNDLE_DIST_DIR, f));
      const gjoa_dir = join(ENGINE_DIR, "browser", "components", "gjoa");
      const mjs_files = (((_truthy) => _truthy !== false && _truthy != null)(existsSync(gjoa_dir)) ? readdirSync(gjoa_dir).filter((f) => ((_logical) => (_logical !== false && _logical != null ? readFileSync(join(gjoa_dir, f), "utf8").includes("beagle/core.js") : _logical))(f.endsWith(".sys.mjs"))).map((f) => join(gjoa_dir, f)) : []);
      const files = Array.from(new Set([GJOA_LOADER_MJS].concat(bundle_files, mjs_files))).filter((f) => existsSync(f));
      const offenders = [];
      files.forEach((f) => {
  const refs = referenced_runtime_symbols(readFileSync(f, "utf8"));
  Array.from(refs).forEach((sym) => {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(surface.has(sym)))) {
    offenders.push(("".concat(basename(f), ": ", sym)));
  }
});
});
      bundle_files.forEach((f) => {
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(f))) {
    const src = readFileSync(f, "utf8");
    const declared = new Set();
    const referenced = new Set();
    Array.from(src.matchAll(new RegExp("\\$\\$bc\\$([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*\\$\\$bc\\.", "g"))).forEach((m) => {
  declared.add(m[1]);
});
    Array.from(src.matchAll(new RegExp("\\$\\$bc\\$([A-Za-z_$][A-Za-z0-9_$]*)", "g"))).forEach((m) => {
  referenced.add(m[1]);
});
    Array.from(referenced).forEach((sym) => {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(declared.has(sym)))) {
    offenders.push(("".concat(basename(f), ": $$bc$", sym, " referenced but unbound — no `const $$bc$", sym, " = $$bc.<export>` prelude (bundler rewrite-core-import missing/regressed)")));
  }
});
  }
});
      return ((offenders.length > 0) ? fail("Q", "$$bc runtime export-closure (emit ↔ core.js)", ("".concat(offenders.length, " emitted runtime reference(s) not exported by the vendored core.js")), ("".concat("the beagle emit references a $$bc symbol the vendored core.js doesn't export ", "(ESM named-import of a missing export = module-load SyntaxError → gjoa chrome never initializes). ", "bump configs/beagle.ref to a Beagle object whose core.js directly exports it, then re-import:\n    ", offenders.join("\n    ")))) : pass("Q", "$$bc runtime export-closure (emit ↔ core.js)", ("".concat(files.length, " emitted file(s) scanned; all $$bc refs (namespace + named-import) ⊆ ", surface.size, " core.js exports"))));
    }
  }
}

const MITIGATIONS_FILE = join(REPO_ROOT, "configs", "security-mitigations.json");

function gateR() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(MITIGATIONS_FILE)))) {
    return fail("R", "security mitigations intact", "no configs/security-mitigations.json — security mitigation checks are unavailable", "create configs/security-mitigations.json with {\"mitigations\":{<id>:{file,mustMatch,[extractRegex,mustReject,mustAccept]}}}");
  } else {
    const manifest = JSON.parse(readFileSync(MITIGATIONS_FILE, "utf8"));
    const mits = ((_logical) => (_logical !== false && _logical != null ? _logical : {}))(manifest.mitigations);
    const ids = Object.keys(mits);
    const problems = [];
    ids.forEach((id) => {
  const e = mits[id];
  const rel = e.file;
  const path = join(REPO_ROOT, rel);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(path)))) {
    problems.push(("".concat(id, ": source file ", rel, " is missing")));
  } else {
    const src = readFileSync(path, "utf8");
    ((_logical) => (_logical !== false && _logical != null ? _logical : []))(e.mustMatch).forEach((rx) => {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(new RegExp(rx, "m").test(src)))) {
    problems.push(("".concat(id, ": required pattern /", rx, "/ is absent from ", rel)));
  }
});
    const ex = e.extractRegex;
    if (((_truthy) => _truthy !== false && _truthy != null)(ex)) {
      const m = src.match(new RegExp(ex.from));
      if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? m[1] : _logical))(m)))) {
        problems.push(("".concat(id, ": extractRegex /", ex.from, "/ found no regex literal in ", rel)));
      } else {
        const lit = m[1];
        const body_m = lit.match(new RegExp("^/(.*)/([a-z]*)$"));
        const body = (((_truthy) => _truthy !== false && _truthy != null)(body_m) ? body_m[1] : lit);
        const flags = (((_truthy) => _truthy !== false && _truthy != null)(body_m) ? body_m[2] : "");
        const re = (() => { try {
    return new RegExp(body, flags);
  } catch (__e) {
    return null;
  } })();
        if ((!((_truthy) => _truthy !== false && _truthy != null)(re))) {
          problems.push(("".concat(id, ": extracted literal `", lit, "` is not a constructable RegExp")));
        } else {
          ((_logical) => (_logical !== false && _logical != null ? _logical : []))(e.mustReject).forEach((s) => {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(re.test(s)))) {
    problems.push(("".concat(id, ": mustReject ", JSON.stringify(s), " is NOT rejected by the current ", ex.name, " — breakout no longer blocked")));
  }
});
          ((_logical) => (_logical !== false && _logical != null ? _logical : []))(e.mustAccept).forEach((s) => {
  if (((_truthy) => _truthy !== false && _truthy != null)(re.test(s))) {
    problems.push(("".concat(id, ": mustAccept ", JSON.stringify(s), " is now WRONGLY rejected by ", ex.name, " — over-broad, real rules dropped")));
  }
});
        }
      }
    }
  }
});
    return ((problems.length > 0) ? fail("R", "security mitigations intact", ("".concat(problems.length, " mitigation check(s) failed across ", ids.length, " entry(ies)")), ("".concat("security mitigation source does not match the manifest — restore it or update configs/security-mitigations.json:\n    ", problems.join("\n    ")))) : pass("R", "security mitigations intact", ("".concat(ids.length, " mitigation(s) intact (mustMatch + extracted-regex reject/accept all hold)"))));
  }
}

function patch_security_block_p(text) {
  return new RegExp("^#\\s*security:\\s*$", "m").test(text);
}

function gateS_bang() {
  const patches = readdirSync(PATCHES_DIR).filter((p) => p.endsWith(".patch")).sort();
  const sec_patches = patches.filter((p) => patch_security_block_p(readFileSync(join(PATCHES_DIR, p), "utf8")));
  if (($$bc$equiv(sec_patches.length, 0))) {
    return pass("S", "security-critical patches persist", "no `security:`-tagged patches (vacuously green; gate arms automatically when one is added)");
  } else {
    const cache = ("".concat(process.env.HOME, "/.cache/gjoa/sources"));
    const gjoa = JSON.parse(readFileSync(GJOA_JSON, "utf8"));
    const tarball = ("".concat(cache, "/firefox-", gjoa.firefox.version, ".source.tar.xz"));
    if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(tarball)))) {
      return fail("S", "security-critical patches persist", ("".concat(sec_patches.length, " security-tagged patch(es) but the source tarball is not cached at ", tarball, " — cannot prove they apply (fail-closed)")), "run `bun run download` to populate the cache, then re-run preflight");
    } else {
      const tmp = "/tmp/gjoa-preflight-sec-engine";
      sh(("".concat("rm -rf ", tmp, " && mkdir -p ", tmp)), {});
      const extract = sh(("".concat("tar -xJf ", tarball, " -C ", tmp, " --strip-components=1")), {timeout: 180000});
      if ((!((_truthy) => _truthy !== false && _truthy != null)(extract.ok))) {
        return fail("S", "security-critical patches persist", "tarball extract failed (fail-closed)", extract.out.slice(0, 400));
      } else {
        sh(("".concat("cd ", tmp, " && git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -q -m baseline")), {timeout: 60000});
        const failed = [];
        const unresolved = [];
        const stopped = ({value: false, watches: {}});
        patches.forEach((p) => {
  if ((!stopped.value)) {
    const ppath = join(PATCHES_DIR, p);
    const is_sec = sec_patches.includes(p);
    const r = sh(("".concat("cd ", tmp, " && git apply ", ppath)), {});
    if ((!((_truthy) => _truthy !== false && _truthy != null)(r.ok))) {
      (() => { const _a = stopped, _v = true; const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
      failed.push(("".concat(p, (is_sec ? " (SECURITY)" : " (blocks downstream security patches)"), ": ", ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(r.out.split("\n")[0]).trim())));
    }
  }
});
        sec_patches.forEach((p) => {
  check_contract(readFileSync(join(PATCHES_DIR, p), "utf8")).forEach((cr) => {
  if (($$bc$equiv(cr.verdict, "not-found"))) {
    unresolved.push(("".concat(p, ": ", cr.kind, " `", cr.symbol, "` — ", cr.detail)));
  }
});
});
        return (((_truthy) => _truthy !== false && _truthy != null)(((failed.length > 0) || (unresolved.length > 0))) ? fail("S", "security-critical patches persist", ("".concat(sec_patches.length, " security-tagged patch(es): ", failed.length, " apply-failure(s), ", unresolved.length, " unresolved anchor(s) — HARD STOP (a security mitigation regressed)")), ("".concat("a security-critical patch no longer applies or its upstream anchor moved — regenerate it BEFORE building; do not ship the regression:\n", "    apply:    ", failed.join("\n              "), "\n", "    anchors:  ", unresolved.join("\n              ")))) : pass("S", "security-critical patches persist", ("".concat(sec_patches.length, " security-tagged patch(es) apply cleanly + all declared anchors resolve"))));
      }
    }
  }
}

function gateT() {
  return (() => { try {
    const out = execSync("bun tools/stewardship/topology.mjs check 2>&1").toString();
  return pass("T", "stewardship tapestry intact (docs ↔ machinery)", out.trim());
  } catch (e) {
    return fail("T", "stewardship tapestry intact (docs ↔ machinery)", ((((_truthy) => _truthy !== false && _truthy != null)(e.stdout) ? e.stdout.toString() : ((_logical) => (_logical !== false && _logical != null ? _logical : "check failed"))(e.message))).trim(), "a docs/stewardship/ ref dangled or topology.md is stale — `bun tools/stewardship/topology.mjs gen`, then commit");
  } })();
}

function gateU() {
  return (() => { try {
    const out = execSync("bun .beagle-tools/gjoa/tools/prep/patch-order.js check --strict 2>&1").toString();
  return pass("U", "patch numbering coherent (domains contiguous)", out.trim());
  } catch (e) {
    return warn("U", "patch numbering coherent (domains contiguous)", ((((_truthy) => _truthy !== false && _truthy != null)(e.stdout) ? e.stdout.toString() : ((_logical) => (_logical !== false && _logical != null ? _logical : "split domain — see `patch-order renumber`"))(e.message))).trim());
  } })();
}

function gateV() {
  return (() => { try {
    const out = execSync("bun .beagle-tools/gjoa/tools/prep/upstream-provenance.js check --strict 2>&1").toString();
  return pass("V", "upstream provenance lock current", out.trim());
  } catch (e) {
    return warn("V", "upstream provenance lock current", ((((_truthy) => _truthy !== false && _truthy != null)(e.stdout) ? e.stdout.toString() : ((_logical) => (_logical !== false && _logical != null ? _logical : "stale lock — re-run `provenance lock`"))(e.message))).trim());
  } })();
}

function gateW() {
  const f = join(PREF_DIR, "dark-mode-prefs.bjs");
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(f)))) {
    return warn("W", "dark-mode contrast backstop ships ON", "dark-mode-prefs.bjs absent — skipping");
  } else {
    const src = readFileSync(f, "utf8");
    return (((_truthy) => _truthy !== false && _truthy != null)(src.match(new RegExp("\\(pref\\s+\"gjoa\\.darkmode\\.normalize\\.enabled\"\\s+true\\)"))) ? pass("W", "dark-mode contrast backstop ships ON", "gjoa.darkmode.normalize.enabled defaults true (APCA no-black-on-black backstop active)") : fail("W", "dark-mode contrast backstop ships ON", "gjoa.darkmode.normalize.enabled is not defaulted true in dark-mode-prefs.bjs", "restore the `true` default; if disabling deliberately, update Gate W with the new constraint"));
  }
}

function gateX() {
  const tagRes = sh("git describe --exact-match --tags HEAD 2>/dev/null", {});
  if ((!((_truthy) => _truthy !== false && _truthy != null)(tagRes.ok))) {
    return pass("X", "release tag matches gjoa.json displayVersion", "HEAD is not tagged — nothing to check");
  } else {
    const tag = tagRes.out.trim();
    if ((!((_truthy) => _truthy !== false && _truthy != null)(tag.match(new RegExp("^v[0-9]"))))) {
      return pass("X", "release tag matches gjoa.json displayVersion", ("".concat("HEAD tag `", tag, "` is not a version tag — skipping")));
    } else {
      const gjoa = JSON.parse(readFileSync(GJOA_JSON, "utf8"));
      const tagVersion = tag.slice(1);
      const configVersion = gjoa.displayVersion;
      return (($$bc$equiv(tagVersion, configVersion)) ? pass("X", "release tag matches gjoa.json displayVersion", ("".concat("HEAD tag `", tag, "` matches displayVersion ", configVersion))) : fail("X", "release tag matches gjoa.json displayVersion", ("".concat("HEAD tag `", tag, "` (", tagVersion, ") does not match gjoa.json displayVersion ", configVersion)), ("".concat("bump gjoa.json displayVersion to ", tagVersion, " (or delete/retag) before `safe-push --tag ", tag, "`"))));
    }
  }
}

function main_bang() {
  console.log(bold("gjoa preflight"));
  console.log(dim("Mandatory gate before any nix or full-mach build."));
  console.log("");
  const gates = [["A", gateA_bang], ["B", gateB], ["C", gateC], ["D", gateD], ["F", gateF], ["G", gateG], ["I", gateI], ["J", gateJ], ["K", gateK], ["L", gateL], ["M", gateM], ["N", gateN], ["O", gateO], ["P", gateP], ["Q", gateQ], ["R", gateR], ["S", gateS_bang], ["T", gateT], ["U", gateU], ["V", gateV], ["W", gateW], ["X", gateX]];
  gates.forEach((gate) => {
  const fn = gate[1];
  (() => { try {
    return fn();
  } catch (e) {
    return fail("?", fn.name, "gate threw", e.message);
  } })();
});
  results.forEach((r) => {
  const mark = ((((_truthy) => _truthy !== false && _truthy != null)(r.warned)) ? yellow("⚠") : (((_truthy) => _truthy !== false && _truthy != null)(r.passed)) ? green("✓") : red("✗"));
  console.log(("".concat(mark, "  ", bold(r.id), "  ", r.name)));
  console.log(("".concat("     ", dim(r.detail))));
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(r.passed)) && r.fix))) {
    console.log(("".concat("     ", yellow(("".concat("fix: ", r.fix.split("\n").join("\n          ")))))));
  }
});
  const failed = results.filter((r) => (!((_truthy) => _truthy !== false && _truthy != null)(r.passed))).length;
  console.log("");
  if (($$bc$equiv(failed, 0))) {
    console.log(("".concat(green(bold("PREFLIGHT GREEN")), dim(("".concat("  — ", results.length, "/", results.length, " gates passed"))))));
    console.log(dim("All pre-build gates passed."));
    return process.exit(0);
  } else {
    console.log(("".concat(red(bold("PREFLIGHT FAILED")), dim(("".concat("  — ", failed, "/", results.length, " gates failed"))))));
    console.log(red("Do NOT kick off a build until every gate is green."));
    return process.exit(1);
  }
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang().catch((e) => { console.error(e);
return process.exit(1); });
}
