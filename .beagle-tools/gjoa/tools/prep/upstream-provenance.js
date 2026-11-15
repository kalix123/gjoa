import { readdirSync, readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { sh } from './sh.js';
import { parseSecurity } from './patch-header.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO = process.cwd();

const PATCHES_DIR = join(REPO, "patches");

const LOCK = join(REPO, "configs", "upstream-provenance.json");

const IDENTITY = join(REPO, "configs", "provenance-identity.json");

const SEC_REPORT = join(REPO, "configs", "provenance-security-findings.json");

const FF = join(process.env.HOME, "code", "resources", "firefox");

function gjoa_version() {
  return JSON.parse(readFileSync(join(REPO, "gjoa.json"), "utf8")).firefox.version;
}

function version__gttag(v) {
  return ((!((_truthy) => _truthy !== false && _truthy != null)(v.match(new RegExp("^[0-9]+(\\.[0-9]+){1,3}(esr)?$")))) ? (() => { throw new Error(("".concat("refusing unsafe version string: ", v))); })() : ("".concat("FIREFOX_", v.replaceAll(".", "_"), "_RELEASE")));
}

function safe_ref(r) {
  return ((!((_truthy) => _truthy !== false && _truthy != null)(r.match(new RegExp("^[\\w./-]+$")))) ? (() => { throw new Error(("".concat("refusing unsafe ref: ", r))); })() : r);
}

function sha256(s) {
  const h = new Bun.CryptoHasher("sha256");
  h.update(s);
  return h.digest("hex");
}

function diff_touches(text) {
  const out = new Set();
  text.matchAll(new RegExp("^diff --git a/(\\S+)\\s+b/\\S+$", "gm")).forEach((m) => {
  out.add(m[1]);
});
  if (($$bc$equiv(out.size, 0))) {
    text.matchAll(new RegExp("^\\+\\+\\+ b/(\\S+)$", "gm")).forEach((m) => {
  out.add(m[1]);
});
  }
  return Array.from(out).sort();
}

function diff_hunks(text) {
  const result = new Map();
  const cur = [""];
  const ensure = (f) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(result.has(f)))) {
  result.set(f, []);
}
return (cur[0] = f); };
  text.split("\n").forEach((line) => {
  const dm = line.match(new RegExp("^diff --git a/(\\S+) b/\\S+$"));
  const pm = line.match(new RegExp("^\\+\\+\\+ b/(\\S+)$"));
  const hm = line.match(new RegExp("^(@@ -(\\d+)(?:,(\\d+))? \\+\\d+(?:,\\d+)? @@)"));
  if (((_truthy) => _truthy !== false && _truthy != null)(dm)) {
    ensure(dm[1]);
  } else if (((_truthy) => _truthy !== false && _truthy != null)(pm)) {
    ensure(pm[1]);
  } else if (((_truthy) => _truthy !== false && _truthy != null)(hm)) {
    const f = cur[0];
    if (((_truthy) => _truthy !== false && _truthy != null)(result.has(f))) {
      const braw = hm[3];
      result.get(f).push({header: hm[1], a: parseInt(hm[2], 10), b: (((_truthy) => _truthy !== false && _truthy != null)(braw) ? parseInt(braw, 10) : 1)});
    }
  }
});
  return result;
}

function list_patches() {
  return readdirSync(PATCHES_DIR).filter((p) => p.endsWith(".patch")).sort();
}

function blob_oid(ref, pth) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(pth.match(new RegExp("^[\\w./-]+$"))))) {
    return "absent";
  } else {
    const out = sh(("".concat("git -C ", FF, " rev-parse ", ref, ":", pth)), {quiet: true}).trim();
    return (((_truthy) => _truthy !== false && _truthy != null)(out.match(new RegExp("^[0-9a-f]{40}$"))) ? out : "absent");
  }
}

function blob_lines(ref, pth) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(pth.match(new RegExp("^[\\w./-]+$"))))) {
    return [];
  } else {
    const out = sh(("".concat("git -C ", FF, " show ", ref, ":", pth)), {quiet: true});
    return (($$bc$equiv(out, "")) ? [] : out.split("\n"));
  }
}

function file_hunk_records(ref, pth, hunks) {
  const lines = blob_lines(ref, pth);
  const out = [];
  hunks.forEach((h) => {
  const a = h.a;
  const b = h.b;
  if (((_truthy) => _truthy !== false && _truthy != null)(((a > 0) && (b > 0)))) {
    const span = lines.slice((a - 1), ((a - 1) + b));
    out.push({header: h.header, range: [a, b], hash: sha256(span.join("\n"))});
  }
});
  return out;
}

function ff_present_p() {
  return existsSync(join(FF, ".git"));
}

function upstream_commits(base, ref, pth) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(pth.match(new RegExp("^[\\w./-]+$"))))) {
    return [];
  } else {
    const out = sh(("".concat("git -C ", FF, " log --oneline --no-decorate -n 4 ", base, "..", ref, " -- ", pth)), {quiet: true}).trim();
    return (($$bc$equiv(out, "")) ? [] : out.split("\n"));
  }
}

function tier_of(pth) {
  return ((((_truthy) => _truthy !== false && _truthy != null)(pth.match(new RegExp("\\.(rs|cpp|cc|h|webidl)$")))) ? "native" : (((_truthy) => _truthy !== false && _truthy != null)(pth.match(new RegExp("\\.(mjs|js)$")))) ? "sys.mjs" : "build");
}

function entry_oid(e) {
  return e.oid;
}

function entry_hunks(e) {
  return e.hunks;
}

function aggregate_digest(patches) {
  const p = ((_logical) => (_logical !== false && _logical != null ? _logical : {}))(patches);
  const parts = [];
  Object.keys(p).sort().forEach((n) => {
  const fobj = p[n];
  Object.keys(fobj).sort().forEach((f) => {
  const entry = fobj[f];
  parts.push(("".concat(n, "\x00", f, "\x00", entry_oid(entry))));
  entry_hunks(entry).forEach((h) => {
  parts.push(("".concat("  ", h.header, "\x00", h.range.join(","), "\x00", h.hash)));
});
});
});
  return sha256(parts.join("\n"));
}

function changed_hunks(ref, pth, hunks) {
  const lines = blob_lines(ref, pth);
  return hunks.filter((h) => { const a = h.range[0];
const b = h.range[1];
const span = lines.slice((a - 1), ((a - 1) + b));
return (!($$bc$equiv(sha256(span.join("\n")), h.hash))); });
}

function lock_bang() {
  if ((!ff_present_p())) {
    console.error(("".concat("provenance: no Firefox clone at ", FF, " — cannot lock.")));
    process.exit(1);
  }
  const version = gjoa_version();
  const tag = version__gttag(version);
  const names = list_patches();
  const patches = {};
  names.forEach((n) => {
  const text = readFileSync(join(PATCHES_DIR, n), "utf8");
  const files = diff_touches(text);
  const hunksByFile = diff_hunks(text);
  const fobj = {};
  files.forEach((f) => {
  (fobj[f] = {oid: blob_oid(tag, f), hunks: file_hunk_records(tag, f, ((_logical) => (_logical !== false && _logical != null ? _logical : []))(hunksByFile.get(f)))});
});
  (patches[n] = fobj);
});
  const digest = aggregate_digest(patches);
  const doc = {note: ("".concat("Upstream provenance lock (churn anti-rot). Per patch, per touched file: the git ", "blob OID (whole-file) PLUS per-hunk anchors {oid, hunks:[{header,range,hash}]} — ", "each hunk's baseline old-side line span hashed at the Firefox tag. `check` diffs vs ", "any ref: identical OID => provably unrotted (skip); OID changed but every hunk hash ", "intact => still apply-safe (edit was OUTSIDE the hunks); a changed hunk => potential ", "conflict; \"absent\" => a file gjoa creates (collision-checked). `digest` = one sha256 over the ", "whole locked surface (baked-identity coordinate; self-verifying — `check` flags a ", "hand-edit). Regenerate after any patch/baseline change: provenance lock.")), baseline: version, tag: tag, digest: digest, patches: patches};
  const nf = names.reduce((a, n) => { const touched = Object.keys(patches[n]).length;
return (a + touched); }, 0);
  const nh = names.reduce((a, n) => { const per_patch = Object.keys(patches[n]).reduce((s, f) => { const anchors = patches[n][f].hunks.length;
return (s + anchors); }, 0);
return (a + per_patch); }, 0);
  const identity = {$schema: "gjoa provenance identity (generated — do not edit by hand)", note: ("".concat("L4 baked-provenance identity. `digest` is one sha256 over EVERY locked blob OID + ", "hunk hash in configs/upstream-provenance.json — the supply-chain coordinate proving ", "the binary was built against unmodified Mozilla blobs. BUILD-GATED: stamping this into ", "the binary's version/provenance metadata happens at compile time (not done here — no ", "build). Regenerate with `provenance lock`; a mismatch vs the lock fails `check`.")), generator: "tools/prep/upstream-provenance.bjs (lock)", baseline: version, tag: tag, digest: digest, patches: names.length, files: nf, hunks: nh};
  writeFileSync(LOCK, ("".concat(JSON.stringify(doc, null, 2), "\n")));
  writeFileSync(IDENTITY, ("".concat(JSON.stringify(identity, null, 2), "\n")));
  console.log(("".concat("wrote configs/upstream-provenance.json — ", names.length, " patches, ", nf, " files, ", nh, " hunk anchors locked @ ", tag)));
  return console.log(("".concat("wrote configs/provenance-identity.json — baked digest ", digest)));
}

function check_bang(ref_arg, strict, blame_p) {
  if ((!ff_present_p())) {
    console.log(("".concat("provenance: Firefox clone absent (", FF, ") — check skipped")));
    process.exit(0);
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(LOCK)))) {
    console.error("provenance: no lock — run `provenance lock` first");
    process.exit((strict ? 2 : 0));
  }
  const lock = JSON.parse(readFileSync(LOCK, "utf8"));
  const version = gjoa_version();
  const ref = safe_ref(((_logical) => (_logical !== false && _logical != null ? _logical : lock.tag))(ref_arg));
  const integrity = ($$bc$equiv(ref, lock.tag));
  const changed = [];
  const vanished = [];
  const collision = [];
  const hunkSafe = [];
  const drift = [];
  const unsafe_patches = new Set();
  if ((!($$bc$equiv(lock.baseline, version)))) {
    drift.push(("".concat("lock baseline ", lock.baseline, " ≠ gjoa.json ", version, " — re-lock")));
  }
  if ((!($$bc$equiv(lock.digest, aggregate_digest(lock.patches))))) {
    drift.push("lock digest ≠ recomputed content digest — hand-edited/tampered, re-lock");
  }
  const names = list_patches();
  const lockPatches = lock.patches;
  names.forEach((n) => {
  const cur = diff_touches(readFileSync(join(PATCHES_DIR, n), "utf8"));
  const locked = (((_truthy) => _truthy !== false && _truthy != null)(lockPatches[n]) ? Object.keys(lockPatches[n]) : []);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(lockPatches[n]))) {
    drift.push(("".concat(n, " not in lock — re-lock")));
  }
  cur.forEach((f) => {
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(locked.includes(f))) : _logical))(lockPatches[n]))) {
    drift.push(("".concat(n, " touches ", f, " (not locked) — re-lock")));
  }
});
});
  const pnames = Object.keys(lockPatches).sort();
  pnames.forEach((n) => {
  const fobj = lockPatches[n];
  const files = Object.keys(fobj).sort();
  files.forEach((f) => {
  const entry = fobj[f];
  const was = entry_oid(entry);
  const hunks = entry_hunks(entry);
  const now = blob_oid(ref, f);
  if ((was === now)) {
    null;
  } else if (((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(was, "absent"))) && ($$bc$equiv(now, "absent"))))) {
    vanished.push({patch: n, file: f, tier: tier_of(f)});
    unsafe_patches.add(n);
  } else if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(was, "absent")) && (!($$bc$equiv(now, "absent")))))) {
    collision.push({patch: n, file: f, tier: tier_of(f)});
    unsafe_patches.add(n);
  } else {
    const bad = changed_hunks(ref, f, hunks);
    if (((_truthy) => _truthy !== false && _truthy != null)(((hunks.length > 0) && ($$bc$equiv(bad.length, 0))))) {
      hunkSafe.push({patch: n, file: f, tier: tier_of(f)});
    } else {
      changed.push({patch: n, file: f, tier: tier_of(f), nbad: bad.length, ntotal: hunks.length});
      unsafe_patches.add(n);
    }
  }
});
});
  console.log(("".concat("upstream provenance — lock @ ", lock.tag, " vs ", ref, (integrity ? "  (integrity check)" : ""))));
  const locked_files = pnames.reduce((a, n) => { const touched = Object.keys(lockPatches[n]).length;
return (a + touched); }, 0);
  const changed_count = changed.length;
  const vanished_count = vanished.length;
  const collision_count = collision.length;
  console.log(("".concat("  ", pnames.length, " patches · ", (locked_files - changed_count - vanished_count - collision_count), " file(s) apply-safe (OID-identical", ((hunkSafe.length > 0) ? ("".concat(" + ", hunkSafe.length, " hunk-anchored")) : ""), ")")));
  const native_first = (arr) => arr.slice().sort((a, b) => ((($$bc$equiv(a.tier, "native")) ? 0 : 1) - (($$bc$equiv(b.tier, "native")) ? 0 : 1)));
  if ((changed.length > 0)) {
    console.log("  changed upstream (potential conflict, native first):");
    native_first(changed).forEach((c) => {
  console.log(("".concat("    [", c.tier, "] ", c.patch, ": ", c.file, ((((_logical) => (_logical !== false && _logical != null ? _logical : 0))(c.ntotal) > 0) ? ("".concat("  (", c.nbad, "/", c.ntotal, " hunk anchor(s) moved)")) : "  (no hunk data — whole-file)"))));
  if (blame_p) {
    upstream_commits(lock.tag, ref, c.file).forEach((ln) => {
  console.log(("".concat("        · ", ln)));
});
  }
});
  }
  if ((hunkSafe.length > 0)) {
    console.log("  changed OUTSIDE patch hunks — every hunk anchor intact (apply-safe):");
    native_first(hunkSafe).forEach((c) => {
  console.log(("".concat("    [", c.tier, "] ", c.patch, ": ", c.file)));
});
  }
  if ((vanished.length > 0)) {
    console.log("  VANISHED upstream (file moved/deleted — patch WILL fail):");
    native_first(vanished).forEach((c) => {
  console.log(("".concat("    [", c.tier, "] ", c.patch, ": ", c.file)));
  if (blame_p) {
    upstream_commits(lock.tag, ref, c.file).forEach((ln) => {
  console.log(("".concat("        · ", ln)));
});
  }
});
  }
  if ((collision.length > 0)) {
    console.log("  upstream now ships a file we CREATE (collision):");
    collision.forEach((c) => {
  console.log(("".concat("    ", c.patch, ": ", c.file)));
});
  }
  if ((drift.length > 0)) {
    console.log("  STALE LOCK:");
    drift.forEach((d) => {
  console.log(("".concat("    ", d)));
});
  }
  const safe_patches = pnames.filter((n) => (!((_truthy) => _truthy !== false && _truthy != null)(unsafe_patches.has(n))));
  if (((_truthy) => _truthy !== false && _truthy != null)(((!integrity) && (safe_patches.length > 0)))) {
    console.log(("".concat("  provably-safe patches (skip on this bump): ", safe_patches.join(", "))));
  }
  const problems = (changed.length + vanished.length + collision.length + drift.length);
  if (($$bc$equiv(problems, 0))) {
    console.log("  ✓ clean");
  } else if (integrity) {
    console.log(("".concat("  ", drift.length, " stale-lock issue(s)")));
  }
  if (((_truthy) => _truthy !== false && _truthy != null)((strict && (integrity ? (drift.length > 0) : (problems > 0))))) {
    return process.exit(2);
  }
}

function digest_bang() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(LOCK)))) {
    console.error("provenance: no lock — run `provenance lock` first");
    process.exit(1);
  }
  const lock = JSON.parse(readFileSync(LOCK, "utf8"));
  const d = aggregate_digest(lock.patches);
  const stored = lock.digest;
  console.log(("".concat("provenance digest @ ", lock.tag, ": ", d)));
  if ((!($$bc$equiv(stored, d)))) {
    console.log(("".concat("  ✗ stored lock digest ", stored, " ≠ recomputed ", d, " — lock hand-edited/tampered; re-lock")));
  }
  return console.log("  (build-gated: the compile stamps this into the binary's provenance metadata)");
}

function security_check_bang(ref_arg, strict) {
  if ((!ff_present_p())) {
    console.log(("".concat("provenance: Firefox clone absent (", FF, ") — security cross-check skipped")));
    process.exit(0);
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(LOCK)))) {
    console.error("provenance: no lock — run `provenance lock` first");
    process.exit((strict ? 2 : 0));
  }
  const lock = JSON.parse(readFileSync(LOCK, "utf8"));
  const ref = safe_ref(((_logical) => (_logical !== false && _logical != null ? _logical : lock.tag))(ref_arg));
  const integrity = ($$bc$equiv(ref, lock.tag));
  const lockPatches = lock.patches;
  const names = list_patches();
  const sec_names = [];
  const findings = [];
  names.forEach((n) => {
  const sec = parseSecurity(readFileSync(join(PATCHES_DIR, n), "utf8"));
  if (((_truthy) => _truthy !== false && _truthy != null)(sec)) {
    sec_names.push(n);
    const fobj = ((_logical) => (_logical !== false && _logical != null ? _logical : {}))(lockPatches[n]);
    Object.keys(fobj).sort().forEach((f) => {
  const entry = fobj[f];
  const was = entry_oid(entry);
  const hunks = entry_hunks(entry);
  const now = blob_oid(ref, f);
  if ((was === now)) {
    null;
  } else if (((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(was, "absent"))) && ($$bc$equiv(now, "absent"))))) {
    findings.push({patch: n, id: ((_logical) => (_logical !== false && _logical != null ? _logical : "?"))(sec.id), file: f, tier: tier_of(f), kind: "vanished", mitigates: ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(sec.mitigates)});
  } else {
    const bad = changed_hunks(ref, f, hunks);
    if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(hunks.length, 0)) || (bad.length > 0)))) {
      findings.push({patch: n, id: ((_logical) => (_logical !== false && _logical != null ? _logical : "?"))(sec.id), file: f, tier: tier_of(f), kind: ((bad.length > 0) ? "hunk-changed" : "file-changed"), nbad: bad.length, ntotal: hunks.length, mitigates: ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(sec.mitigates)});
    }
  }
});
  }
});
  const doc = {$schema: "gjoa provenance × security cross-check (generated — do not edit by hand)", note: ("".concat("L5 cross-check: for each `# security:`-tagged patch, whether its LOCKED upstream blob/hunk ", "anchor changed vs the checked ref. A finding means Mozilla touched the code a mitigation ", "rides on — they may have fixed it (drop the patch) or refactored (re-verify). Empty list = ", "the honest baseline (zero security-tagged patches). Overlay mitigations in ", "configs/security-mitigations.json are chrome JS, not upstream-anchored — out of scope here. ", "Regenerate via `upstream-provenance check --security`.")), generator: "tools/prep/upstream-provenance.bjs (check --security)", baseline: lock.baseline, tag: lock.tag, ref: ref, securityPatches: sec_names, findings: findings};
  writeFileSync(SEC_REPORT, ("".concat(JSON.stringify(doc, null, 2), "\n")));
  console.log(("".concat("provenance × security — lock @ ", lock.tag, " vs ", ref, (integrity ? "  (integrity check)" : ""))));
  if (($$bc$equiv(sec_names.length, 0))) {
    console.log("  no `# security:`-tagged patches (vacuously clean; cross-check arms when one is added)");
  } else {
    console.log(("".concat("  ", sec_names.length, " security-tagged patch(es): ", sec_names.join(", "))));
  }
  if (($$bc$equiv(findings.length, 0))) {
    console.log("  ✓ no security anchor moved");
  } else {
    console.log("  ⚠ upstream changed at a security anchor — Mozilla may have FIXED it (drop the patch) or REFACTORED (re-verify the mitigation):");
    findings.forEach((c) => {
  console.log(("".concat("    [", c.tier, "] ", c.patch, " (", c.id, "): ", c.file, " — ", c.kind, ((((_logical) => (_logical !== false && _logical != null ? _logical : 0))(c.ntotal) > 0) ? ("".concat("  (", c.nbad, "/", c.ntotal, " hunk anchor(s) moved)")) : ""))));
});
  }
  console.log(("".concat("  wrote configs/provenance-security-findings.json (", findings.length, " finding(s))")));
  if (((_truthy) => _truthy !== false && _truthy != null)((strict && (integrity && (findings.length > 0))))) {
    return process.exit(2);
  }
}

function merge3_file(baseTag, ref, pth, tmp) {
  const enginePath = join(REPO, "engine", pth);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(enginePath)))) {
    return {status: "skip", reason: "no engine source (run import)"};
  } else {
    const base = sh(("".concat("git -C ", FF, " show ", baseTag, ":", pth)), {quiet: true});
    const other = sh(("".concat("git -C ", FF, " show ", ref, ":", pth)), {quiet: true});
    if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(base, "")) || ($$bc$equiv(other, ""))))) {
      return {status: "skip", reason: "absent at base or ref"};
    } else {
      const bf = join(tmp, "base");
      const of = join(tmp, "other");
      const uf = join(tmp, "ours");
      writeFileSync(bf, base);
      writeFileSync(of, other);
      writeFileSync(uf, readFileSync(enginePath, "utf8"));
      const out = (() => { try {
    return sh(("".concat("git merge-file -p '", uf, "' '", bf, "' '", of, "' 2>/dev/null; printf '__RC__%s' \"$?\"")), {});
  } catch (__e) {
    return "__RC__255";
  } })();
      const m = out.match(new RegExp("__RC__(\\d+)$"));
      const rc = (((_truthy) => _truthy !== false && _truthy != null)(m) ? parseInt(m[1], 10) : 255);
      return ((($$bc$equiv(rc, 0))) ? {status: "clean"} : (($$bc$equiv(rc, 255))) ? {status: "skip", reason: "merge-file error (binary/encoding?)"} : {status: "conflict", conflicts: rc});
    }
  }
}

function merge3_bang(ref_arg) {
  if ((!ff_present_p())) {
    console.log(("".concat("provenance: Firefox clone absent (", FF, ") — 3-way merge skipped")));
    process.exit(0);
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(LOCK)))) {
    console.error("provenance: no lock — run `provenance lock` first");
    process.exit(1);
  }
  const lock = JSON.parse(readFileSync(LOCK, "utf8"));
  const ref = safe_ref(((_logical) => (_logical !== false && _logical != null ? _logical : lock.tag))(ref_arg));
  const baseTag = lock.tag;
  const integrity = ($$bc$equiv(ref, baseTag));
  const lockPatches = lock.patches;
  const pnames = Object.keys(lockPatches).sort();
  const tmp = mkdtempSync(join(tmpdir(), "gjoa-merge3-"));
  const clean = [];
  const conflict = [];
  const skip = [];
  (() => { try {
    if (integrity) {
    console.log("  (ref == baseline: nothing has moved — pass a bump ref, e.g. a later FF tag)");
  }
  pnames.forEach((n) => {
  const fobj = lockPatches[n];
  Object.keys(fobj).sort().forEach((f) => {
  const entry = fobj[f];
  const was = entry_oid(entry);
  const now = blob_oid(ref, f);
  if (((_truthy) => _truthy !== false && _truthy != null)(((!(was === now)) && ((!($$bc$equiv(was, "absent"))) && (!($$bc$equiv(now, "absent"))))))) {
    const r = merge3_file(baseTag, ref, f, tmp);
    if (($$bc$equiv(r.status, "clean"))) {
      clean.push({patch: n, file: f, tier: tier_of(f)});
    } else if (($$bc$equiv(r.status, "conflict"))) {
      conflict.push({patch: n, file: f, tier: tier_of(f), conflicts: r.conflicts});
    } else {
      skip.push({patch: n, file: f, reason: r.reason});
    }
  }
});
});
  }  finally {
    (() => { try {
    return rmSync(tmp, {recursive: true, force: true});
  } catch (__e) {
    return null;
  } })();
  } })();
  console.log(("".concat("anchor-local 3-way merge — patched lock @ ", baseTag, " replayed onto ", ref)));
  console.log(("".concat("  ", clean.length, " auto-mergeable · ", conflict.length, " need human · ", skip.length, " skipped")));
  if ((conflict.length > 0)) {
    console.log("  CONFLICTS (our edits overlap Mozilla's — human rebase, native first):");
    conflict.forEach((c) => {
  console.log(("".concat("    [", c.tier, "] ", c.patch, ": ", c.file, "  (", c.conflicts, " conflict hunk(s))")));
});
  }
  if ((clean.length > 0)) {
    console.log("  AUTO-MERGEABLE (patch re-applies onto new upstream with no conflict):");
    clean.forEach((c) => {
  console.log(("".concat("    [", c.tier, "] ", c.patch, ": ", c.file)));
});
  }
  if ((skip.length > 0)) {
    skip.forEach((c) => {
  console.log(("".concat("    skip ", c.patch, ": ", c.file, " (", c.reason, ")")));
});
  }
}

function main_bang() {
  const argv = process.argv.slice(2);
  const cmd = ((_logical) => (_logical !== false && _logical != null ? _logical : "check"))(argv[0]);
  const strict = argv.includes("--strict");
  const ref = argv.find((a) => ((!((_truthy) => _truthy !== false && _truthy != null)(a.startsWith("--"))) && (!($$bc$equiv(a, cmd)))));
  return ((($$bc$equiv(cmd, "lock"))) ? lock_bang() : (($$bc$equiv(cmd, "digest"))) ? digest_bang() : (($$bc$equiv(cmd, "merge3"))) ? merge3_bang(((_logical) => (_logical !== false && _logical != null ? _logical : null))(ref)) : (($$bc$equiv(cmd, "check"))) ? (((_truthy) => _truthy !== false && _truthy != null)(argv.includes("--security")) ? security_check_bang(((_logical) => (_logical !== false && _logical != null ? _logical : null))(ref), strict) : check_bang(((_logical) => (_logical !== false && _logical != null ? _logical : null))(ref), strict, argv.includes("--blame"))) : (() => { console.error("usage: upstream-provenance <lock | digest | merge3 [ref] | check [ref] [--strict] [--blame] [--security]>");
return process.exit(1); })());
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
