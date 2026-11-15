import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { REPO_ROOT } from './paths.js';
import { log } from './log.js';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';
import { asHamtMap, hamtMap, hamtMapAssoc } from 'beagle/hamt.js';

const SNAPSHOT_PATH = join(REPO_ROOT, "tools", "prep", "darkreader-fixes.snapshot");

const REGISTRY_PATH = join(REPO_ROOT, "src", "gjoa", "toolkit", "components", "content-classifier", "darkmode-fixes.json");

const DARKREADER_PIN = "v4.9.127";

const EXPECTED_SNAPSHOT_SHA256 = "0e6d82b4df349edeb789e4dbb346f427caff4861f071020525fd81e6f50e638f";

function sha256(text) {
  const hash = new Bun.CryptoHasher("sha256");
  hash.update(text);
  return hash.digest("hex");
}

const NAMED_COLORS = {["black"]: [0, 0, 0], ["white"]: [255, 255, 255], ["red"]: [255, 0, 0], ["blue"]: [0, 0, 255], ["cyan"]: [0, 255, 255], ["yellow"]: [255, 255, 0], ["orange"]: [255, 165, 0], ["purple"]: [128, 0, 128], ["gold"]: [255, 215, 0], ["goldenrod"]: [218, 165, 32], ["khaki"]: [240, 230, 140], ["gray"]: [128, 128, 128], ["grey"]: [128, 128, 128], ["lightgray"]: [211, 211, 211], ["lightgrey"]: [211, 211, 211], ["darkgray"]: [169, 169, 169], ["darkgrey"]: [169, 169, 169], ["slategray"]: [112, 128, 144], ["lightblue"]: [173, 216, 230], ["darkblue"]: [0, 0, 139], ["darkred"]: [139, 0, 0], ["aliceblue"]: [240, 248, 255]};

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
  const sections = ({value: {}, watches: {}});
  const cur_name = ({value: null, watches: {}});
  const cur_lines = ({value: [], watches: {}});
  const flush_bang = () => { if (((_truthy) => _truthy !== false && _truthy != null)(cur_name.value)) {
  (() => { const _a = sections, _v = hamtMapAssoc(asHamtMap(sections.value), cur_name.value, cur_lines.value.join("\n").trim()); const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
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
    out.push({patterns: patterns, sections: sections.value});
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

function build_entry(block) {
  const css = $$bc$get(block.sections, "CSS");
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(css)) || ($$bc$equiv(css.trim(), ""))))) {
    return null;
  } else {
    const unresolved = [];
    const unmapped = [];
    const resolved = resolve_dr_vars(resolve_tokens(css, unresolved), unmapped);
    const compact = resolved.replace(new RegExp("\\s*\\n\\s*", "g"), " ").replace(new RegExp("  +", "g"), " ").trim();
    return (((_truthy) => _truthy !== false && _truthy != null)(FORBIDDEN_CSS.test(compact)) ? {rejected: "resolved CSS contains a forbidden construct (url()/@import/expression()) — not safe for a USER_SHEET"} : {css: compact, entry: {mode: "css", override: "active", css: compact}, unresolved: unresolved, unmapped_vars: unmapped});
  }
}

function selftest_bang() {
  const white = flip_rgba([255, 255, 255, 1]);
  const black = flip_rgba([0, 0, 0, 1]);
  const grey = [119, 119, 119, 1];
  const grey_flip = flip_rgba(grey);
  const grey_round = flip_rgba(grey_flip);
  const white_lum = luminance(white);
  const black_lum = luminance(black);
  const grey_lum = luminance(grey);
  const grey_round_lum = luminance(grey_round);
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
  info("flip self-test (exact engine luminance port)");
  info(("".concat("  flip(#ffffff) = ", rgba__gtcss(white), "  luminance=", white_lum.toFixed(4))));
  info(("".concat("  flip(#000000) = ", rgba__gtcss(black), "  luminance=", black_lum.toFixed(4))));
  info(("".concat("  flip(#777777) = ", rgba__gtcss(grey_flip), "  luminance=", luminance(grey_flip).toFixed(4))));
  info(("".concat("  flip(flip(#777777)) = ", rgba__gtcss(grey_round), "  luminance=", grey_round_lum.toFixed(4))));
  check_bang("white→dark", (white_lum < 0.22), ("".concat("luminance ", white_lum.toFixed(4), " < 0.22")));
  check_bang("black→light", (black_lum > 0.5), ("".concat("luminance ", black_lum.toFixed(4), " > 0.5")));
  check_bang("mid-grey round-trips", (Math.abs((grey_round_lum - grey_lum)) < 0.05), ("".concat("|", grey_round_lum.toFixed(4), " - ", grey_lum.toFixed(4), "| = ", Math.abs((grey_round_lum - grey_lum)).toFixed(4), " < 0.05")));
  if ((failures.value > 0)) {
    err(("".concat(failures.value, " self-test assertion(s) failed")));
    return 1;
  } else {
    ok("all self-test assertions passed");
    return 0;
  }
}

const USAGE = "\ngjoa darkmode-registry — Dark Reader → gjoa curated dark-mode entry generator\n\nUsage:\n  bun .beagle-tools/gjoa/tools/prep/darkmode-registry.js <host> [host...]   print entries\n  bun .beagle-tools/gjoa/tools/prep/darkmode-registry.js --write <host>...  merge into registry\n  bun .beagle-tools/gjoa/tools/prep/darkmode-registry.js --selftest         run the flip self-test\n\nDefault prints the generated JSON entry/entries for each host so a human can\neyeball before --write merges them into darkmode-fixes.json (existing keys kept).\nReads the local snapshot at tools/prep/darkreader-fixes.snapshot.\n".trim();

function read_snapshot_bang() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(SNAPSHOT_PATH)))) {
    const err = log.error;
    err(("".concat("snapshot not found at ", SNAPSHOT_PATH)));
    err(("".concat("refresh it (pinned): curl -sL https://raw.githubusercontent.com/darkreader/darkreader/", DARKREADER_PIN, "/src/config/dynamic-theme-fixes.config -o tools/prep/darkreader-fixes.snapshot")));
    err("then update EXPECTED-SNAPSHOT-SHA256 (sha256sum tools/prep/darkreader-fixes.snapshot)");
    process.exit(1);
  }
  return readFileSync(SNAPSHOT_PATH, "utf8");
}

function generate_for_host(blocks, host) {
  const block = find_block(blocks, host);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(block))) {
    return {host: host, missing: true, reason: "no matching DR block"};
  } else {
    const built = build_entry(block);
    return (((!((_truthy) => _truthy !== false && _truthy != null)(built))) ? {host: host, missing: true, reason: "matched block has no CSS section (INVERT/IGNORE only)"} : (((_truthy) => _truthy !== false && _truthy != null)(built.rejected)) ? {host: host, missing: true, reason: built.rejected} : {host: host, entry: built.entry, unresolved: built.unresolved, unmapped_vars: built["unmapped-vars"], matched_by: block.patterns.join(", ")});
  }
}

function print_result_bang(r) {
  const info = log.info;
  const warn = log.warn;
  const step = log.step;
  if (((_truthy) => _truthy !== false && _truthy != null)(r.missing)) {
    return warn(("".concat(r.host, ": skipped — ", r.reason)));
  } else {
    step(("".concat(r.host, "  (matched DR patterns: ", r["matched-by"], ")")));
    if ((r.unresolved.length > 0)) {
      warn(("".concat("  unresolved tokens left literal: ", r.unresolved.join(", "))));
    }
    if ((r["unmapped-vars"].length > 0)) {
      warn(("".concat("  unmapped --darkreader vars (fell back to neutral bg): ", r["unmapped-vars"].join(", "))));
    }
    return console.log(JSON.stringify(hamtMap([[r.host, r.entry]]), null, 2));
  }
}

function main_bang() {
  const argv = process.argv.slice(2);
  const write_p = argv.includes("--write");
  const selftest_p = argv.includes("--selftest");
  const hosts = argv.filter((a) => (!((_truthy) => _truthy !== false && _truthy != null)(a.startsWith("--"))));
  return ((((_truthy) => _truthy !== false && _truthy != null)(selftest_p)) ? process.exit(selftest_bang()) : (($$bc$equiv(hosts.length, 0))) ? (() => { console.log(USAGE);
return process.exit(0); })() : (() => { const snapshot = read_snapshot_bang(); const blocks = parse_snapshot_bang(snapshot); const results = hosts.map((h) => generate_for_host(blocks, h)); const generated = results.filter((r) => (!((_truthy) => _truthy !== false && _truthy != null)(r.missing))); (() => { results.forEach((r) => {
  print_result_bang(r);
}); })();
if (((_truthy) => _truthy !== false && _truthy != null)(write_p)) {
  const actual = sha256(snapshot);
  if ((!($$bc$equiv(actual, EXPECTED_SNAPSHOT_SHA256)))) {
    const err = log.error;
    err(("".concat("snapshot SHA-256 does not match the pinned hash for Dark Reader ", DARKREADER_PIN, ".\n", "  expected: ", EXPECTED_SNAPSHOT_SHA256, "\n", "  got:      ", actual, "\n", "  --write refused. Re-pin deliberately: refresh from the pinned tag, eyeball the diff,\n", "  then update DARKREADER-PIN + EXPECTED-SNAPSHOT-SHA256 to match.")));
    process.exit(1);
  }
  if (($$bc$equiv(generated.length, 0))) {
    const warn = log.warn;
    return warn("nothing to write (no hosts produced entries)");
  } else {
    const existing = ({value: (((_truthy) => _truthy !== false && _truthy != null)(existsSync(REGISTRY_PATH)) ? JSON.parse(readFileSync(REGISTRY_PATH, "utf8")) : {}), watches: {}});
    const added = [];
    (() => { generated.forEach((r) => {
  (() => { const _a = existing, _v = hamtMapAssoc(asHamtMap(existing.value), r.host, r.entry); const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
  added.push(r.host);
}); })();
    writeFileSync(REGISTRY_PATH, ("".concat(JSON.stringify(existing.value, null, 2), "\n")));
    const ok = log.ok;
    return ok(("".concat("merged ", added.length, " entr", (($$bc$equiv(added.length, 1)) ? "y" : "ies"), " into darkmode-fixes.json: ", added.join(", "))));
  }
} })());
}

main_bang();
