import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { PATCHES_DIR, REPO_ROOT } from './paths.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const HEADER_TAG = "# gjoa-patch:";

function extractTouches(text) {
  const out = new Set();
  text.matchAll(new RegExp("^diff --git a/(\\S+)\\s+b/\\S+$", "gm")).forEach((m) => {
  out.add(m[1]);
});
  if (($$bc$equiv(out.size, 0))) {
    text.matchAll(new RegExp("^---\\s+a/(\\S+)$", "gm")).forEach((m) => {
  out.add(m[1]);
});
  }
  return Array.from(out);
}

export function parseSecurity(text) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(new RegExp("^#\\s*security:\\s*$", "m").test(text)))) {
    return null;
  } else {
    const im = new RegExp("^#\\s*id:\\s*(\\S+)\\s*$", "m").exec(text);
    const mm = new RegExp("^#\\s*mitigates:\\s*(.+?)\\s*$", "m").exec(text);
    const pm = new RegExp("^#\\s*persist:\\s*(\\S+)\\s*$", "m").exec(text);
    const refs = [];
    const lines = text.split("\n");
    const n = lines.length;
    (() => { let i = 0; let in_refs = false; while (true) {
    if ((i < n)) {  const l = lines[i]; if (((_truthy) => _truthy !== false && _truthy != null)(new RegExp("^#\\s*refs:\\s*$").test(l))) { const _recur_0 = (i + 1); const _recur_1 = true; i = _recur_0; in_refs = _recur_1; continue; } else if (((_truthy) => _truthy !== false && _truthy != null)((in_refs && new RegExp("^#\\s*-\\s+\\S").test(l)))) { refs.push(l.replace(new RegExp("^#\\s*-\\s+"), "").trim()); const _recur_0 = (i + 1); const _recur_1 = in_refs; i = _recur_0; in_refs = _recur_1; continue; } else if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : (!((_truthy) => _truthy !== false && _truthy != null)(l.startsWith("#")))))(new RegExp("^#\\s*[A-Za-z][\\w-]*:").test(l)))) { const _recur_0 = (i + 1); const _recur_1 = false; i = _recur_0; in_refs = _recur_1; continue; } else { const _recur_0 = (i + 1); const _recur_1 = in_refs; i = _recur_0; in_refs = _recur_1; continue; } } else { return null; }
  } })();
    return {id: (((_truthy) => _truthy !== false && _truthy != null)(im) ? im[1] : null), refs: refs, mitigates: (((_truthy) => _truthy !== false && _truthy != null)(mm) ? mm[1] : null), persist: (((_truthy) => _truthy !== false && _truthy != null)(pm) ? ($$bc$equiv(pm[1].toLowerCase(), "true")) : false)};
  }
}

function parseHeader(text) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(text.startsWith(HEADER_TAG)))) {
    return {hasHeader: false, declaredBaseline: null, appliedUpstream: null, forwarded: null, security: null};
  } else {
    const bm = new RegExp("^#\\s*baseline-firefox:\\s*(\\S+)\\s*$", "m").exec(text);
    const am = new RegExp("^#\\s*applied-upstream:\\s*(\\S+)\\s*$", "m").exec(text);
    const fm = new RegExp("^#\\s*forwarded:\\s*(\\S+)\\s*$", "m").exec(text);
    return {hasHeader: true, declaredBaseline: (((_truthy) => _truthy !== false && _truthy != null)(bm) ? bm[1] : null), appliedUpstream: (((_truthy) => _truthy !== false && _truthy != null)(am) ? am[1] : null), forwarded: (((_truthy) => _truthy !== false && _truthy != null)(fm) ? fm[1] : null), security: parseSecurity(text)};
  }
}

function formatHeader(baseline, touches) {
  const lines = [HEADER_TAG, ("".concat("#   baseline-firefox: ", baseline)), "#   touches:"].concat(touches.map((p) => ("".concat("#     - ", p))), ["#", ""]);
  return lines.join("\n");
}

async function loadPatch(filename) {
  const text = await readFile(join(PATCHES_DIR, filename), "utf8");
  const parsed = parseHeader(text);
  const touches = extractTouches(text);
  return {filename: filename, text: text, hasHeader: parsed.hasHeader, declaredBaseline: parsed.declaredBaseline, appliedUpstream: parsed.appliedUpstream, forwarded: parsed.forwarded, security: parsed.security, touches: touches};
}

async function listPatches() {
  const entries = await readdir(PATCHES_DIR);
  return entries.filter((n) => n.endsWith(".patch")).sort();
}

async function loadCurrentBaseline() {
  const raw = await readFile(join(REPO_ROOT, "gjoa.json"), "utf8");
  const cfg = JSON.parse(raw);
  return cfg.firefox.version;
}

export async function check_all() {
  const current = await loadCurrentBaseline();
  const names = await listPatches();
  return (async () => { let i = 0; let problems = 0; while (true) {
    if ((i >= names.length)) { return problems; } else { const n = names[i]; const p = await loadPatch(n); if ((!((_truthy) => _truthy !== false && _truthy != null)(p.hasHeader))) { console.error(("".concat("[patch-header] ", n, ": MISSING header — run `bun tools/prep/patch-header.ts retrofit` after regenerating against ", current))); const _recur_0 = (i + 1); const _recur_1 = (problems + 1); i = _recur_0; problems = _recur_1; continue; } else if ((!((_truthy) => _truthy !== false && _truthy != null)(p.declaredBaseline))) { console.error(("".concat("[patch-header] ", n, ": header present but `baseline-firefox` not parseable"))); const _recur_0 = (i + 1); const _recur_1 = (problems + 1); i = _recur_0; problems = _recur_1; continue; } else if (((_truthy) => _truthy !== false && _truthy != null)(p.appliedUpstream)) { console.error(("".concat("[patch-header] ", n, ": applied-upstream (", p.appliedUpstream, ") — Mozilla absorbed this change; DROP this patch (rm patches/", n, ") to avoid carrying redundant divergence-debt"))); const _recur_0 = (i + 1); const _recur_1 = (problems + 1); i = _recur_0; problems = _recur_1; continue; } else if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(p.security.id)) : _logical))(p.security))) { console.error(("".concat("[patch-header] ", n, ": `# security:` block has no `id:` — add `#   id: <finding-id>` matching configs/security-mitigations.json"))); const _recur_0 = (i + 1); const _recur_1 = (problems + 1); i = _recur_0; problems = _recur_1; continue; } else if ((!($$bc$equiv(p.declaredBaseline, current)))) { console.error(("".concat("[patch-header] ", n, ": baseline ", p.declaredBaseline, " ≠ gjoa.json ", current, " (informational; regenerate when this patch fails to apply)"))); const _recur_0 = (i + 1); const _recur_1 = problems; i = _recur_0; problems = _recur_1; continue; } else { const _recur_0 = (i + 1); const _recur_1 = problems; i = _recur_0; problems = _recur_1; continue; } }
  } })();
}

export async function retrofit_all() {
  const current = await loadCurrentBaseline();
  const names = await listPatches();
  return (async () => { let i = 0; let changed = 0; while (true) {
    if ((i >= names.length)) { return (() => { console.error(("".concat("[patch-header] done. ", changed, " patch(es) updated.")));
return undefined; })(); } else { const n = names[i]; const p = await loadPatch(n); if (((_truthy) => _truthy !== false && _truthy != null)(p.hasHeader)) { const _recur_0 = (i + 1); const _recur_1 = changed; i = _recur_0; changed = _recur_1; continue; } else { const header = formatHeader(current, p.touches); const wrote = await writeFile(join(PATCHES_DIR, n), ("".concat(header, p.text)), "utf8"); const logged = console.error(("".concat("[patch-header] ", n, ": added header (baseline=", current, ", touches=", p.touches.length, ")"))); const _recur_0 = (i + 1); const _recur_1 = (changed + 1); i = _recur_0; changed = _recur_1; continue; } }
  } })();
}

async function main_bang() {
  const cmd = process.argv[2];
  return ((($$bc$equiv(cmd, "check"))) ? (async () => { const problems = await check_all(); return process.exit((($$bc$equiv(problems, 0)) ? 0 : 2)); })() : (($$bc$equiv(cmd, "retrofit"))) ? await retrofit_all() : (() => { console.error("Usage: bun tools/prep/patch-header.ts <check|retrofit>");
return process.exit(1); })());
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
