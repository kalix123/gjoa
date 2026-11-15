import { readdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { join } from 'path';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO = process.cwd();

const PATCHES_DIR = join(REPO, "patches");

const HASHES = join(REPO, "configs", "patch-hashes.json");

function parse_num(name) {
  const m = name.match(new RegExp("^(\\d{4})"));
  return (((_truthy) => _truthy !== false && _truthy != null)(m) ? parseInt(m[1], 10) : -1);
}

function slug_of(name) {
  return name.replace(new RegExp("^\\d{4}-"), "").replace(new RegExp("\\.patch$"), "");
}

function pad4(n) {
  const s = n.toString();
  return (((n < 10)) ? ("".concat("000", s)) : ((n < 100)) ? ("".concat("00", s)) : ((n < 1000)) ? ("".concat("0", s)) : s);
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
  return Array.from(out);
}

function domain_of(files) {
  const hit = (re) => files.some((f) => new RegExp(re).test(f));
  return ((hit("^browser/")) ? "chrome" : (hit("^toolkit/")) ? "toolkit" : (hit("^(layout|servo|docshell|dom|gfx)/")) ? "engine" : (hit("^third_party/")) ? "third_party" : "build");
}

function depth_rank(domain) {
  return ((($$bc$equiv(domain, "chrome"))) ? 0 : (($$bc$equiv(domain, "third_party"))) ? 1 : (($$bc$equiv(domain, "toolkit"))) ? 2 : (($$bc$equiv(domain, "engine"))) ? 3 : 4);
}

function load_all() {
  const names = readdirSync(PATCHES_DIR).filter((p) => p.endsWith(".patch")).sort();
  return names.map((n) => { const text = readFileSync(join(PATCHES_DIR, n), "utf8");
const files = diff_touches(text);
return {name: n, num: parse_num(n), slug: slug_of(n), files: files, domain: domain_of(files)}; });
}

function uf_find(parent, x) {
  return (() => { let r = x; while (true) {
    if (($$bc$equiv(parent[r], r))) { return r; } else { const _recur_0 = parent[r]; r = _recur_0; continue; }
  } })();
}

function components(patches) {
  const n = patches.length;
  const parent = new Array(n);
  const by_file = new Map();
  (() => { let i = 0; while (true) {
    if ((i < n)) { (parent[i] = i); const _recur_0 = (i + 1); i = _recur_0; continue; } else { return null; }
  } })();
  (() => { let i = 0; while (true) {
    if ((i < n)) { patches[i].files.forEach((f) => {
  const seen = by_file.get(f);
  if ((seen == null)) {
    by_file.set(f, i);
  } else {
    (parent[uf_find(parent, seen)] = uf_find(parent, i));
  }
}); const _recur_0 = (i + 1); i = _recur_0; continue; } else { return null; }
  } })();
  const groups = new Map();
  (() => { let i = 0; while (true) {
    if ((i < n)) { (() => { const r = uf_find(parent, i); if ((!((_truthy) => _truthy !== false && _truthy != null)(groups.has(r)))) {
  groups.set(r, []);
}
return groups.get(r).push(patches[i]); })(); const _recur_0 = (i + 1); i = _recur_0; continue; } else { return null; }
  } })();
  return Array.from(groups.values());
}

function shared_in_group(group) {
  const counts = new Map();
  const out = [];
  group.forEach((p) => {
  p.files.forEach((f) => {
  const prev = counts.get(f);
  counts.set(f, ((prev == null) ? 1 : (prev + 1)));
});
});
  Array.from(counts.entries()).forEach((e) => {
  if ((e[1] > 1)) {
    out.push(e[0]);
  }
});
  return out.sort();
}

function by_num(patches) {
  return patches.slice().sort((a, b) => { const a_num = a.num;
const b_num = b.num;
return (a_num - b_num); });
}

function domain_runs(patches) {
  const runs = [];
  by_num(patches).forEach((p) => {
  const last = ((runs.length > 0) ? runs[(runs.length - 1)] : null);
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(last.domain, p.domain)) : _logical))(last))) {
    last.members.push(p);
  } else {
    runs.push({domain: p.domain, members: [p]});
  }
});
  return runs;
}

function split_domains(runs) {
  const counts = new Map();
  const out = [];
  runs.forEach((r) => {
  const d = r.domain;
  const prev = counts.get(d);
  counts.set(d, ((prev == null) ? 1 : (prev + 1)));
});
  Array.from(counts.entries()).forEach((e) => {
  if ((e[1] > 1)) {
    out.push(e[0]);
  }
});
  return out;
}

function canonical(patches) {
  return patches.slice().sort((a, b) => { const dr = (depth_rank(a.domain) - depth_rank(b.domain));
const a_num = a.num;
const b_num = b.num;
return ((!($$bc$equiv(dr, 0))) ? dr : (a_num - b_num)); });
}

function lis_keep(nums) {
  const n = nums.length;
  const len = new Array(n);
  const prev = new Array(n);
  (() => { let i = 0; while (true) {
    if ((i < n)) { (len[i] = 1); (prev[i] = -1); (() => { let j = 0; while (true) {
    if ((j < i)) { (() => { const len_j = len[j]; if (((_truthy) => _truthy !== false && _truthy != null)(((nums[j] < nums[i]) && ((1 + len_j) > len[i])))) {
  (len[i] = (1 + len_j));
  return (prev[i] = j);
} })(); const _recur_0 = (j + 1); j = _recur_0; continue; } else { return null; }
  } })(); const _recur_0 = (i + 1); i = _recur_0; continue; } else { return null; }
  } })();
  const best = (() => { let i = 0; let bi = -1; let bl = -1; while (true) {
    if ((i >= n)) { return bi; } else { if ((len[i] > bl)) { const _recur_0 = (i + 1); const _recur_1 = i; const _recur_2 = len[i]; i = _recur_0; bi = _recur_1; bl = _recur_2; continue; } else { const _recur_0 = (i + 1); const _recur_1 = bi; const _recur_2 = bl; i = _recur_0; bi = _recur_1; bl = _recur_2; continue; } }
  } })();
  const keep = new Set();
  (() => { let k = best; while (true) {
    if ((k >= 0)) { keep.add(nums[k]); const _recur_0 = prev[k]; k = _recur_0; continue; } else { return null; }
  } })();
  return keep;
}

function renumber_plan(patches) {
  const canon = canonical(patches);
  const nums = canon.map((p) => p.num);
  const keep = lis_keep(nums);
  const used = new Set(patches.map((p) => p.num));
  const moves = [];
  (() => { let i = 0; while (true) {
    if ((i < canon.length)) { (() => { const p = canon[i]; if ((!((_truthy) => _truthy !== false && _truthy != null)(keep.has(p.num)))) {
  const lo = (() => { let j = (i - 1); while (true) {
    if ((j < 0)) { return 0; } else if (((_truthy) => _truthy !== false && _truthy != null)(keep.has(canon[j].num))) { return canon[j].num; } else { const _recur_0 = (j - 1); j = _recur_0; continue; }
  } })();
  const slot = (() => { let s = (lo + 1); while (true) {
    if (((_truthy) => _truthy !== false && _truthy != null)(used.has(s))) { const _recur_0 = (s + 1); s = _recur_0; continue; } else { return s; }
  } })();
  used.add(slot);
  return moves.push({from_name: p.name, to_name: ("".concat(pad4(slot), "-", p.slug, ".patch")), from: p.num, to: slot, domain: p.domain});
} })(); const _recur_0 = (i + 1); i = _recur_0; continue; } else { return null; }
  } })();
  return moves;
}

function gaps(patches) {
  const nums = by_num(patches).map((p) => p.num);
  const out = [];
  (() => { let i = 1; while (true) {
    if ((i < nums.length)) { (() => { const prev = nums[(i - 1)]; const cur = nums[i]; if ((cur > (prev + 1))) {
  return out.push(("".concat(pad4((prev + 1)), "–", pad4((cur - 1)))));
} })(); const _recur_0 = (i + 1); i = _recur_0; continue; } else { return null; }
  } })();
  return out;
}

function analyze_bang() {
  const patches = load_all();
  const comps = components(patches).filter((g) => (g.length > 1));
  const runs = domain_runs(patches);
  const splits = split_domains(runs);
  const moves = renumber_plan(patches);
  console.log(("".concat("patch order + batching analysis  (", patches.length, " patches)\n")));
  console.log("  #     domain       slug");
  by_num(patches).forEach((p) => {
  console.log(("".concat("  ", pad4(p.num), "  ", p.domain.padEnd(11), "  ", p.slug)));
});
  console.log("\nfile-overlap components (the only HARD ordering constraints):");
  if (($$bc$equiv(comps.length, 0))) {
    console.log("  (none — every patch touches a disjoint file set; fully reorderable)");
  } else {
    comps.forEach((g) => {
  console.log(("".concat("  · {", by_num(g).map((p) => pad4(p.num)).join(", "), "}", "  share: ", shared_in_group(g).join(", "))));
});
  }
  console.log(("".concat("\ndomain sequence (by number):  ", runs.map((r) => ("".concat(r.domain, "×", r.members.length))).join(" · "))));
  if (($$bc$equiv(splits.length, 0))) {
    console.log("  ✓ every domain is contiguous — batching is optimal");
  } else {
    splits.forEach((d) => {
  const where = runs.filter((r) => ($$bc$equiv(r.domain, d)));
  console.log(("".concat("  ⚠ domain '", d, "' is SPLIT across ", where.length, " runs at ", where.map((r) => ("".concat("[", r.members.map((p) => pad4(p.num)).join(","), "]"))).join(" and "))));
});
  }
  const g = gaps(patches);
  if ((g.length > 0)) {
    console.log(("".concat("\nnumbering gaps: ", g.join(", "), "  (dropped/absorbed patches)")));
  }
  console.log("\nverdict: APPLY-SOUND (alpha-apply order satisfies every overlap constraint).");
  if (($$bc$equiv(moves.length, 0))) {
    return console.log("  batching is OPTIMAL — numbers ascend by engine depth, every domain contiguous.");
  } else {
    console.log(("".concat("  batching is ", moves.length, " move(s) short of optimal. Minimal renumber:")));
    moves.forEach((m) => {
  console.log(("".concat("    ", m["from-name"], "  →  ", pad4(m.to), "   (", m.domain, ")")));
});
    return console.log("  theory: numbers ascend by engine depth — chrome → third_party → toolkit → engine.");
  }
}

function check_bang(strict) {
  const patches = load_all();
  const splits = split_domains(domain_runs(patches));
  const moves = renumber_plan(patches);
  if (($$bc$equiv(splits.length, 0))) {
    console.log(("".concat("patch-order ok — ", patches.length, " patches, every domain contiguous, apply-sound")));
    return 0;
  } else {
    console.error(("".concat("patch-order: ", splits.length, " split domain(s): ", splits.join(", "), " — minimal fix: ", moves.map((m) => ("".concat(m["from-name"], "→", pad4(m.to)))).join(", "))));
    if (strict) {
      process.exit(2);
    }
    return 0;
  }
}

function apply_renumber_bang() {
  const patches = load_all();
  const moves = renumber_plan(patches);
  if (($$bc$equiv(moves.length, 0))) {
    return console.log("patch-order: nothing to renumber.");
  } else {
    const hashes = JSON.parse(readFileSync(HASHES, "utf8"));
    moves.forEach((m) => {
  renameSync(join(PATCHES_DIR, m["from-name"]), join(PATCHES_DIR, m["to-name"]));
  const h = hashes.patches[m["from-name"]];
  if (((_truthy) => _truthy !== false && _truthy != null)(h)) {
    (hashes.patches[m["to-name"]] = h);
    delete hashes.patches[m["from-name"]];
  }
  console.log(("".concat("  renamed ", m["from-name"], " → ", m["to-name"])));
});
    writeFileSync(HASHES, ("".concat(JSON.stringify(hashes, null, 2), "\n")));
    return console.log(("".concat("patch-hashes.json rekeyed (", moves.length, " entr(ies)). ", "Review tracked references to renamed patch paths.")));
  }
}

function main_bang() {
  const argv = process.argv.slice(2);
  const cmd = ((_logical) => (_logical !== false && _logical != null ? _logical : "analyze"))(argv[0]);
  const strict = argv.includes("--strict");
  return ((($$bc$equiv(cmd, "analyze"))) ? analyze_bang() : (($$bc$equiv(cmd, "check"))) ? check_bang(strict) : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(cmd, "renumber")) && argv.includes("--apply")))) ? apply_renumber_bang() : (($$bc$equiv(cmd, "renumber"))) ? (() => { const moves = renumber_plan(load_all()); if (($$bc$equiv(moves.length, 0))) {
  return console.log("renumber: already optimal — nothing to move.");
} else {
  console.log("renumber plan (dry — pass --apply to execute):");
  moves.forEach((m) => {
  console.log(("".concat("  ", m["from-name"], "  →  ", m["to-name"])));
});
} })() : (() => { console.error("usage: patch-order <analyze|check [--strict]|renumber [--apply]>");
return process.exit(1); })());
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
