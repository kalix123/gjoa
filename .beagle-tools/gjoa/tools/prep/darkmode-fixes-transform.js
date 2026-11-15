import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { REPO_ROOT } from './paths.js';
import { log } from './log.js';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';
import { hamtMap } from 'beagle/hamt.js';

function oset_bang(o, k, v) {
  Reflect.set(o, k, v);
  return v;
}

const SNAPSHOT_PATH = join(REPO_ROOT, "tools", "prep", "darkreader-fixes.snapshot");

const REGISTRY_PATH = join(REPO_ROOT, "src", "gjoa", "toolkit", "components", "content-classifier", "darkmode-fixes.json");

const DARKREADER_PIN = "v4.9.127";

const PROVENANCE = ("".concat("darkreader@", DARKREADER_PIN, " MIT"));

const EXPECTED_SNAPSHOT_SHA256 = "0e6d82b4df349edeb789e4dbb346f427caff4861f071020525fd81e6f50e638f";

function sha256(text) {
  const hash = new Bun.CryptoHasher("sha256");
  hash.update(text);
  return hash.digest("hex");
}

const NAMED_COLORS = {["black"]: [0, 0, 0], ["white"]: [255, 255, 255], ["red"]: [255, 0, 0], ["blue"]: [0, 0, 255], ["cyan"]: [0, 255, 255], ["yellow"]: [255, 255, 0], ["orange"]: [255, 165, 0], ["purple"]: [128, 0, 128], ["gold"]: [255, 215, 0], ["goldenrod"]: [218, 165, 32], ["khaki"]: [240, 230, 140], ["gray"]: [128, 128, 128], ["grey"]: [128, 128, 128], ["lightgray"]: [211, 211, 211], ["lightgrey"]: [211, 211, 211], ["darkgray"]: [169, 169, 169], ["darkgrey"]: [169, 169, 169], ["dimgrey"]: [105, 105, 105], ["dimgray"]: [105, 105, 105], ["slategray"]: [112, 128, 144], ["lightblue"]: [173, 216, 230], ["darkblue"]: [0, 0, 139], ["darkred"]: [139, 0, 0], ["aliceblue"]: [240, 248, 255]};

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function parse_hex(h) {
  const n = h.length;
  const valid = new RegExp("^[0-9a-fA-F]+$").test(h);
  return (((!((_truthy) => _truthy !== false && _truthy != null)(valid))) ? null : (($$bc$equiv(n, 3))) ? [parseInt(("".concat(h[0], h[0])), 16), parseInt(("".concat(h[1], h[1])), 16), parseInt(("".concat(h[2], h[2])), 16), 1] : (($$bc$equiv(n, 4))) ? [parseInt(("".concat(h[0], h[0])), 16), parseInt(("".concat(h[1], h[1])), 16), parseInt(("".concat(h[2], h[2])), 16), (parseInt(("".concat(h[3], h[3])), 16) / 255)] : (($$bc$equiv(n, 6))) ? [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1] : (($$bc$equiv(n, 8))) ? [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), (parseInt(h.slice(6, 8), 16) / 255)] : null);
}

function split_args(body) {
  const raw = body.trim().split(new RegExp("[\\s,/]+"));
  return raw.filter((s) => (s.length > 0));
}

function parse_component(s, whole) {
  if (((_truthy) => _truthy !== false && _truthy != null)(s.endsWith("%"))) {
    const pct = parseFloat(s.slice(0, -1));
    return ((pct / 100) * whole);
  } else {
    return parseFloat(s);
  }
}

function hsl__gtrgb(h, s, l) {
  const hh = ((h - (360 * Math.floor((h / 360)))) / 360);
  const q = ((l < 0.5) ? (l * (1 + s)) : ((l + s) - (l * s)));
  const p = ((2 * l) - q);
  const hue__gtrgb = (t0) => { const t = (((t0 < 0)) ? (t0 + 1) : ((t0 > 1)) ? (t0 - 1) : t0);
return (((t < (1.0 / 6.0))) ? (p + ((q - p) * 6 * t)) : ((t < (1.0 / 2.0))) ? q : ((t < (2.0 / 3.0))) ? (p + ((q - p) * ((2.0 / 3.0) - t) * 6)) : p); };
  return (($$bc$equiv(s, 0)) ? [Math.round((l * 255)), Math.round((l * 255)), Math.round((l * 255))] : [Math.round((hue__gtrgb((hh + (1.0 / 3.0))) * 255)), Math.round((hue__gtrgb(hh) * 255)), Math.round((hue__gtrgb((hh - (1.0 / 3.0))) * 255))]);
}

function parse_color(raw) {
  const s = raw.trim();
  const lower = s.toLowerCase();
  return ((((_truthy) => _truthy !== false && _truthy != null)(s.startsWith("#"))) ? parse_hex(s.slice(1)) : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : lower.startsWith("rgba(")))(lower.startsWith("rgb(")))) ? (() => { const body = s.slice((s.indexOf("(") + 1), s.lastIndexOf(")")); const parts = split_args(body); if ((parts.length >= 3)) {
  return [clamp(Math.round(parse_component(parts[0], 255)), 0, 255), clamp(Math.round(parse_component(parts[1], 255)), 0, 255), clamp(Math.round(parse_component(parts[2], 255)), 0, 255), ((parts.length >= 4) ? clamp(parse_component(parts[3], 1), 0, 1) : 1)];
} })() : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : lower.startsWith("hsla(")))(lower.startsWith("hsl(")))) ? (() => { const body = s.slice((s.indexOf("(") + 1), s.lastIndexOf(")")); const parts = split_args(body); if ((parts.length >= 3)) {
  const h = parseFloat(parts[0]);
  const sat_raw = parse_component(parts[1], 100);
  const lit_raw = parse_component(parts[2], 100);
  const sat = (sat_raw / 100);
  const lit = (lit_raw / 100);
  const rgb = hsl__gtrgb(h, clamp(sat, 0, 1), clamp(lit, 0, 1));
  return [rgb[0], rgb[1], rgb[2], ((parts.length >= 4) ? clamp(parse_component(parts[3], 1), 0, 1) : 1)];
} })() : (((_truthy) => _truthy !== false && _truthy != null)(new RegExp("^[0-9a-fA-F]{3,8}$").test(s))) ? parse_hex(s) : (((_truthy) => _truthy !== false && _truthy != null)($$bc$get(NAMED_COLORS, lower))) ? (() => { const rgb = $$bc$get(NAMED_COLORS, lower); return [rgb[0], rgb[1], rgb[2], 1]; })() : null);
}

function compute(u) {
  const f = (u / 255);
  return ((f <= 0.03928) ? (f / 12.92) : Math.pow(((f + 0.055) / 1.055), 2.4));
}

function decompute(x) {
  const s = ((x <= (0.03928 / 12.92)) ? (x * 12.92) : ((1.055 * Math.pow(x, (1.0 / 2.4))) - 0.055));
  return clamp(Math.round((s * 255)), 0, 255);
}

function flip_rgba(rgba) {
  const r = rgba[0];
  const g = rgba[1];
  const b = rgba[2];
  const a = rgba[3];
  const lr = compute(r);
  const lg = compute(g);
  const lb = compute(b);
  const lum = ((0.2126 * lr) + (0.7152 * lg) + (0.0722 * lb));
  const target = (1 - lum);
  const factor = ((target + 0.05) / (lum + 0.05));
  const adj = (l) => decompute(Math.max(0.0, (((l + 0.05) * factor) - 0.05)));
  return [adj(lr), adj(lg), adj(lb), a];
}

function luminance(rgba) {
  return ((0.2126 * compute(rgba[0])) + (0.7152 * compute(rgba[1])) + (0.0722 * compute(rgba[2])));
}

function byte__gthex(n) {
  return clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
}

function rgba__gtcss(rgba) {
  const r = rgba[0];
  const g = rgba[1];
  const b = rgba[2];
  const a = rgba[3];
  return ((a >= 1) ? ("".concat("#", byte__gthex(r), byte__gthex(g), byte__gthex(b))) : ("".concat("rgba(", clamp(Math.round(r), 0, 255), ", ", clamp(Math.round(g), 0, 255), ", ", clamp(Math.round(b), 0, 255), ", ", Number(a.toFixed(3)), ")")));
}

function resolve_token(inner) {
  const parsed = parse_color(inner);
  if (((_truthy) => _truthy !== false && _truthy != null)(parsed)) {
    return rgba__gtcss(flip_rgba(parsed));
  }
}

const DARKREADER_VARS = {["--darkreader-neutral-background"]: "#181a1b", ["--darkreader-neutral-text"]: "#e8e6e3", ["--darkreader-neutral-color"]: "#e8e6e3", ["--darkreader-selection-background"]: "#0060df", ["--darkreader-selection-text"]: "#ffffff"};

const SEPARATOR = new RegExp("^=+\\s*$", "m");

const SECTION_HEADER = new RegExp("^[A-Z][A-Z ]+$");

const KNOWN_SECTIONS = ["INVERT", "CSS", "IGNORE INLINE STYLE", "IGNORE IMAGE ANALYSIS", "INVERT SIZE", "PLUS"];

function parse_snapshot_bang(text) {
  const blocks = text.split(SEPARATOR);
  const out = [];
  blocks.forEach((block) => {
  const lines = block.trimEnd().split("\n");
  const patterns = [];
  const sections = {};
  const cur_name = ({value: null, watches: {}});
  const cur_lines = ({value: [], watches: {}});
  const flush_bang = () => { if (((_truthy) => _truthy !== false && _truthy != null)(cur_name.value)) {
  oset_bang(sections, cur_name.value, cur_lines.value.join("\n").trim());
}
return (() => { const _a = cur_lines, _v = []; const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })(); };
  lines.forEach((line) => {
  const trimmed = line.trim();
  if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(trimmed, "")) && (cur_name.value == null)))) {
    null;
  } else if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? KNOWN_SECTIONS.includes(trimmed) : _logical))(SECTION_HEADER.test(trimmed)))) {
    flush_bang();
    (() => { const _a = cur_name, _v = trimmed; const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
  } else if (((_truthy) => _truthy !== false && _truthy != null)(((cur_name.value == null) && (!($$bc$equiv(trimmed, "")))))) {
    patterns.push(trimmed);
  } else {
    cur_lines.value.push(line);
  }
});
  flush_bang();
  if ((patterns.length > 0)) {
    out.push({patterns: patterns, sections: sections});
  }
});
  return out;
}

function pattern_host(pat) {
  const no_scheme = pat.replace(new RegExp("^[a-z]+://"), "");
  const host = no_scheme.split("/")[0];
  return host.trim().toLowerCase();
}

function host_matches_p(pat, host) {
  const p = pattern_host(pat);
  const h = host.toLowerCase();
  return ((($$bc$equiv(p, "*"))) ? false : (($$bc$equiv(p, h))) ? true : (((_truthy) => _truthy !== false && _truthy != null)(p.startsWith("*."))) ? (() => { const base = p.slice(2); return (($$bc$equiv(h, base)) || h.endsWith(("".concat(".", base)))); })() : (((_truthy) => _truthy !== false && _truthy != null)(h.endsWith(("".concat(".", p))))) ? true : false);
}

function find_block(blocks, host) {
  return blocks.find((b) => b.patterns.some((pat) => host_matches_p(pat, host)));
}

function resolve_tokens(css, unresolved) {
  return css.replace(new RegExp("\\$\\{([^}]*)\\}", "g"), (__match, inner) => { const trimmed = inner.trim();
return ((($$bc$equiv(trimmed.toLowerCase(), "transparent"))) ? "transparent" : (() => { const resolved = resolve_token(trimmed); if (((_truthy) => _truthy !== false && _truthy != null)(resolved)) {
  return resolved;
} else {
  unresolved.push(trimmed);
  return trimmed;
} })()); });
}

function resolve_dr_vars(css, unmapped) {
  return css.replace(new RegExp("var\\(\\s*(--darkreader-[A-Za-z0-9_-]+)\\s*(?:,[^)]*)?\\)", "g"), (__match, name) => { const v = $$bc$get(DARKREADER_VARS, name);
if (((_truthy) => _truthy !== false && _truthy != null)(v)) {
  return v;
} else {
  unmapped.push(name);
  return "#181a1b";
} });
}

const FORBIDDEN_CSS = new RegExp("url\\s*\\(|@import\\b|expression\\s*\\(", "i");

function selector_lines(body) {
  return (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(body)) || ($$bc$equiv(body.trim(), "")))) ? [] : body.split("\n").map((s) => s.trim()).filter((s) => (s.length > 0)));
}

function ignore_field(body) {
  const sels = selector_lines(body);
  return ((($$bc$equiv(sels.length, 0))) ? null : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(sels.length, 1)) && ($$bc$equiv(sels[0], "*"))))) ? true : sels);
}

function resolve_tokens_fixpoint(css, passes) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((passes <= 0) || (!((_truthy) => _truthy !== false && _truthy != null)(css.includes("${")))))) {
    return {css: css, unresolved: []};
  } else {
    const u = [];
    const next = resolve_tokens(css, u);
    return (((_truthy) => _truthy !== false && _truthy != null)(((next === css) || (!((_truthy) => _truthy !== false && _truthy != null)(next.includes("${"))))) ? {css: next, unresolved: u} : resolve_tokens_fixpoint(next, (passes - 1)));
  }
}

function build_css(css) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(css)) || ($$bc$equiv(css.trim(), ""))))) {
    return {css: "", unresolved: [], unmapped: []};
  } else {
    const unmapped = [];
    const fixed = resolve_tokens_fixpoint(css, 5);
    const resolved = resolve_dr_vars(fixed.css, unmapped);
    const compact = resolved.replace(new RegExp("\\s*\\n\\s*", "g"), " ").replace(new RegExp("  +", "g"), " ").trim();
    return (((_truthy) => _truthy !== false && _truthy != null)(FORBIDDEN_CSS.test(compact)) ? {rejected: "resolved CSS contains a forbidden construct (url()/@import/expression())"} : {css: compact, unresolved: fixed.unresolved, unmapped: unmapped});
  }
}

function build_entry_bang(block, keep_invert_p) {
  const secs = block.sections;
  const css_built = build_css($$bc$get(secs, "CSS"));
  if (((_truthy) => _truthy !== false && _truthy != null)(css_built.rejected)) {
    return {rejected: css_built.rejected};
  } else {
    const invert_sels = selector_lines($$bc$get(secs, "INVERT"));
    const ign_inline = ignore_field($$bc$get(secs, "IGNORE INLINE STYLE"));
    const ign_image = ignore_field($$bc$get(secs, "IGNORE IMAGE ANALYSIS"));
    const has_css = (css_built.css.length > 0);
    const entry = {mode: "css", override: "auto"};
    oset_bang(entry, "_provenance", PROVENANCE);
    if (has_css) {
      oset_bang(entry, "css", css_built.css);
    }
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (invert_sels.length > 0) : _logical))(keep_invert_p))) {
      oset_bang(entry, "invertSelectors", invert_sels);
    }
    if ((!(ign_inline == null))) {
      oset_bang(entry, "ignoreInlineStyle", ign_inline);
    }
    if ((!(ign_image == null))) {
      oset_bang(entry, "ignoreImageAnalysis", ign_image);
    }
    return {entry: entry, substantive: (has_css || ((!(ign_inline == null)) || (!(ign_image == null)))), unresolved: css_built.unresolved, unmapped: css_built.unmapped, directives: {invert: (invert_sels.length > 0), css: has_css, ignoreInline: (!(ign_inline == null)), ignoreImage: (!(ign_image == null))}};
  }
}

function selftest_bang() {
  const info = log.info;
  const ok = log.ok;
  const err = log.error;
  const failures = ({value: 0, watches: {}});
  const check_bang = (label, pass, detail) => { if (((_truthy) => _truthy !== false && _truthy != null)(pass)) {
  return ok(("".concat(label, " — ", detail)));
} else {
  err(("".concat(label, " FAILED — ", detail)));
  return (() => { const _a = failures, _v = (failures.value + 1); const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
} };
  const white = flip_rgba([255, 255, 255, 1]);
  const black = flip_rgba([0, 0, 0, 1]);
  const sample = ("".concat("*.example.com\n\nINVERT\n.logo\n.brand-mark\n\n", "CSS\n.box {\n  background: ${#ffffff} !important;\n}\n\n", "IGNORE INLINE STYLE\n.entry *\n\n", "IGNORE IMAGE ANALYSIS\n*\n"));
  const blocks = parse_snapshot_bang(sample);
  const blk = find_block(blocks, "example.com");
  const built = ((_logical) => (_logical !== false && _logical != null ? build_entry_bang(blk, true) : _logical))(blk);
  const e = ((_logical) => (_logical !== false && _logical != null ? built.entry : _logical))(built);
  info("darkmode-fixes-transform self-test");
  check_bang("white→dark", (luminance(white) < 0.22), ("".concat("luminance ", luminance(white).toFixed(4))));
  check_bang("black→light", (luminance(black) > 0.5), ("".concat("luminance ", luminance(black).toFixed(4))));
  check_bang("block matched", (!(blk == null)), "example.com block found");
  check_bang("INVERT → invertSelectors[2]", ((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(e.invertSelectors.length, 2)) : _logical))(e.invertSelectors) : _logical))(e), ("".concat("got ", JSON.stringify(((_logical) => (_logical !== false && _logical != null ? e.invertSelectors : _logical))(e)))));
  check_bang("CSS token resolved (no ${} left, no #ffffff)", ((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ((!((_truthy) => _truthy !== false && _truthy != null)(e.css.includes("${"))) && (!((_truthy) => _truthy !== false && _truthy != null)(e.css.includes("#ffffff")))) : _logical))(e.css) : _logical))(e), ("".concat("css=", ((_logical) => (_logical !== false && _logical != null ? e.css : _logical))(e))));
  check_bang("IGNORE INLINE STYLE (explicit) → [selectors]", ((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(e.ignoreInlineStyle.length, 1)) : _logical))(Array.isArray(e.ignoreInlineStyle)) : _logical))(e), ("".concat("got ", JSON.stringify(((_logical) => (_logical !== false && _logical != null ? e.ignoreInlineStyle : _logical))(e)))));
  check_bang("IGNORE IMAGE ANALYSIS (*) → true", ((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(e.ignoreImageAnalysis, true)) : _logical))(e), ("".concat("got ", JSON.stringify(((_logical) => (_logical !== false && _logical != null ? e.ignoreImageAnalysis : _logical))(e)))));
  check_bang("_provenance stamped", ((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(e._provenance, PROVENANCE)) : _logical))(e), ("".concat("got ", ((_logical) => (_logical !== false && _logical != null ? e._provenance : _logical))(e))));
  if ((failures.value > 0)) {
    err(("".concat(failures.value, " self-test assertion(s) failed")));
    return 1;
  } else {
    ok("all self-test assertions passed");
    return 0;
  }
}

const USAGE = "\ngjoa darkmode-fixes-transform — Dark Reader → gjoa curated entry generator (full directives)\n\nUsage:\n  bun .beagle-tools/gjoa/tools/prep/darkmode-fixes-transform.js <host> [host...]\n  bun .beagle-tools/gjoa/tools/prep/darkmode-fixes-transform.js --selftest\n  bun .beagle-tools/gjoa/tools/prep/darkmode-fixes-transform.js --write-all\n\nPer-host: prints CANDIDATE darkmode-fixes.json entries (directives expanded, DR\ntokens PRE-RESOLVED to fixed dark constants — LOSSY, eyeball before committing).\n\n--write-all: BULK-imports the WHOLE pinned DR corpus into darkmode-fixes.json.\nEach entry is PRUNED to the cheap, high-value parts (CSS color corrections, the\noverride mode, IGNORE-* flags); DR's per-element INVERT selectors are dropped\nbecause gjoa's engine already inverts at style-resolution (re-emitting them as\nper-element compositor filters is the low-performance trap). The existing curated\nregistry is AUTHORITATIVE — its keys are merged ON TOP and win over any bulk\ncounterpart. Output is minified (the actor lazy-loads + caches it once).\n".trim();

function read_snapshot_bang() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(SNAPSHOT_PATH)))) {
    const err = log.error;
    err(("".concat("snapshot not found at ", SNAPSHOT_PATH)));
    err(("".concat("refresh (pinned): curl -sL https://raw.githubusercontent.com/darkreader/darkreader/", DARKREADER_PIN, "/src/config/dynamic-theme-fixes.config -o tools/prep/darkreader-fixes.snapshot")));
    process.exit(1);
  }
  return readFileSync(SNAPSHOT_PATH, "utf8");
}

function generate_for_host_bang(blocks, host) {
  const block = find_block(blocks, host);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(block))) {
    return {host: host, missing: true, reason: "no matching DR block"};
  } else {
    const built = build_entry_bang(block, true);
    return ((((_truthy) => _truthy !== false && _truthy != null)(built.rejected)) ? {host: host, missing: true, reason: built.rejected} : {host: host, entry: built.entry, unresolved: built.unresolved, unmapped: built.unmapped, directives: built.directives, matched_by: block.patterns.join(", ")});
  }
}

function print_result_bang(r) {
  const warn = log.warn;
  const step = log.step;
  if (((_truthy) => _truthy !== false && _truthy != null)(r.missing)) {
    return warn(("".concat(r.host, ": skipped — ", r.reason)));
  } else {
    step(("".concat(r.host, "  (matched DR patterns: ", r["matched-by"], ")")));
    const d = r.directives;
    log.info(("".concat("  directives: ", ["INVERT", "CSS", "IGNORE INLINE STYLE", "IGNORE IMAGE ANALYSIS"].filter((name) => ((($$bc$equiv(name, "INVERT"))) ? d.invert : (($$bc$equiv(name, "CSS"))) ? d.css : (($$bc$equiv(name, "IGNORE INLINE STYLE"))) ? d.ignoreInline : (($$bc$equiv(name, "IGNORE IMAGE ANALYSIS"))) ? d.ignoreImage : false)).join(", "))));
    if ((r.unresolved.length > 0)) {
      warn(("".concat("  ⚠ unresolved tokens left literal (QA): ", r.unresolved.join(", "))));
    }
    if ((r.unmapped.length > 0)) {
      warn(("".concat("  ⚠ unmapped --darkreader vars → fixed dark palette (QA): ", r.unmapped.join(", "))));
    }
    return console.log(JSON.stringify(hamtMap([[r.host, r.entry]]), null, 2));
  }
}

function block_host_keys_bang(block) {
  const seen = {};
  const keys = [];
  block.patterns.forEach((pat) => {
  const ph = pattern_host(pat);
  const key = (((_truthy) => _truthy !== false && _truthy != null)(ph.startsWith("*.")) ? ph.slice(2) : ph);
  if (((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(key, ""))) && ((!($$bc$equiv(key, "*"))) && ((!((_truthy) => _truthy !== false && _truthy != null)(key.includes("*"))) && (!((_truthy) => _truthy !== false && _truthy != null)($$bc$get(seen, key)))))))) {
    oset_bang(seen, key, true);
    keys.push(key);
  }
});
  return keys;
}

function build_all_bang(blocks) {
  const out = {};
  const stats = {blocks: blocks.length, written: 0, skippedEmpty: 0, rejected: 0};
  blocks.forEach((block) => {
  const built = build_entry_bang(block, false);
  if (((_truthy) => _truthy !== false && _truthy != null)(built.rejected)) {
    const rejected = stats.rejected;
    oset_bang(stats, "rejected", (rejected + 1));
  } else if ((!((_truthy) => _truthy !== false && _truthy != null)(built.substantive))) {
    const skipped = stats.skippedEmpty;
    oset_bang(stats, "skippedEmpty", (skipped + 1));
  } else {
    block_host_keys_bang(block).forEach((key) => {
  if ((!((_truthy) => _truthy !== false && _truthy != null)($$bc$get(out, key)))) {
    oset_bang(out, key, built.entry);
    const written = stats.written;
    oset_bang(stats, "written", (written + 1));
  }
});
  }
});
  return {fixes: out, stats: stats};
}

function write_all_bang() {
  const info = log.info;
  const ok = log.ok;
  const warn = log.warn;
  const err = log.error;
  const snapshot = read_snapshot_bang();
  const actual = sha256(snapshot);
  if ((!($$bc$equiv(actual, EXPECTED_SNAPSHOT_SHA256)))) {
    err(("".concat("snapshot SHA-256 does not match the pinned hash for Dark Reader ", DARKREADER_PIN, ".\n", "  expected: ", EXPECTED_SNAPSHOT_SHA256, "\n", "  got:      ", actual, "\n", "  --write-all refused. Re-pin deliberately, then update EXPECTED-SNAPSHOT-SHA256.")));
    process.exit(1);
  }
  const blocks = parse_snapshot_bang(snapshot);
  const built = build_all_bang(blocks);
  const bulk = built.fixes;
  const st = built.stats;
  const curated = (((_truthy) => _truthy !== false && _truthy != null)(existsSync(REGISTRY_PATH)) ? JSON.parse(readFileSync(REGISTRY_PATH, "utf8")) : {});
  const merged = {};
  const curated_keys = Object.keys(curated);
  const bulk_keys = Object.keys(bulk);
  const overlap = ({value: 0, watches: {}});
  bulk_keys.forEach((k) => {
  oset_bang(merged, k, $$bc$get(bulk, k));
});
  curated_keys.forEach((k) => {
  if (((_truthy) => _truthy !== false && _truthy != null)($$bc$get(bulk, k))) {
    (() => { const _a = overlap, _v = (overlap.value + 1); const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
  }
  oset_bang(merged, k, $$bc$get(curated, k));
});
  const merged_keys = Object.keys(merged);
  const json = JSON.stringify(merged);
  writeFileSync(REGISTRY_PATH, ("".concat(json, "\n")));
  info("darkmode bulk import (Dark Reader → gjoa, pruned)");
  info(("".concat("  blocks parsed:        ", st.blocks)));
  info(("".concat("  bulk entries written: ", st.written)));
  info(("".concat("  skipped (INVERT-only / no correction after prune): ", st.skippedEmpty)));
  info(("".concat("  rejected (forbidden CSS): ", st.rejected)));
  info(("".concat("  curated entries kept (authoritative): ", curated_keys.length)));
  info(("".concat("  curated∩bulk (curated won): ", overlap.value)));
  ok(("".concat("wrote ", merged_keys.length, " total entries → ", "src/gjoa/toolkit/components/content-classifier/darkmode-fixes.json ", "(", (() => { const json_bytes = json.length; return Math.round((json_bytes / 1024)); })(), " KB, minified)")));
  return 0;
}

function main_bang() {
  const argv = process.argv.slice(2);
  const selftest_p = argv.includes("--selftest");
  const write_all_p = argv.includes("--write-all");
  const hosts = argv.filter((a) => (!((_truthy) => _truthy !== false && _truthy != null)(a.startsWith("--"))));
  return ((((_truthy) => _truthy !== false && _truthy != null)(selftest_p)) ? process.exit(selftest_bang()) : (((_truthy) => _truthy !== false && _truthy != null)(write_all_p)) ? process.exit(write_all_bang()) : (($$bc$equiv(hosts.length, 0))) ? (() => { console.log(USAGE);
return process.exit(0); })() : (() => { const snapshot = read_snapshot_bang(); const blocks = parse_snapshot_bang(snapshot); const results = hosts.map((h) => generate_for_host_bang(blocks, h)); (() => { results.forEach((r) => {
  print_result_bang(r);
}); })();
const warn = log.warn;
warn("candidates only — DR tokens PRE-RESOLVED (lossy). Eyeball + visual QA before merging into darkmode-fixes.json.");
return 0; })());
}

main_bang();
