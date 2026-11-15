import * as $beagle$import$fs from 'fs';
import * as $beagle$import$path from 'path';
import { parse } from 'acorn';
import { sh } from '../prep/sh.js';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

const JS_DIR = "dist/chrome/JS";

const TOPLEVEL = "<toplevel>";

function node_p(v) {
  return ((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(typeof v, "object")) && ((!((_truthy) => _truthy !== false && _truthy != null)(Array.isArray(v))) && ($$bc$equiv(typeof v.type, "string")))) : _logical))(v);
}

function demangle(s) {
  const bang = s.replace(new RegExp("_bang$"), "!");
  const pred = bang.replace(new RegExp("_p$"), "?");
  const arrow = pred.replaceAll("_GT_", "->");
  return arrow.replaceAll("_", "-");
}

function mangle(s) {
  const arrow = s.replaceAll("->", "_GT_");
  const dash = arrow.replaceAll("-", "_");
  const pred = dash.replaceAll("?", "_p");
  const bang = pred.replaceAll("!", "_bang");
  return bang.replaceAll("*", "_star");
}

function module_of(file) {
  const base = path.basename(file);
  const unprefixed = base.replace("gjoa-", "");
  return unprefixed.replace(".uc.js", "");
}

function register_bang(acc, nm) {
  acc.names.add(nm);
  const counts = acc.counts;
  const prev = counts.get(nm);
  return counts.set(nm, ((typeof prev === 'number') ? (prev + 1) : 1));
}

function walk_bang(node, enclosing, acc) {
  const t = node.type;
  const top_p = ($$bc$equiv(enclosing, TOPLEVEL));
  return ((($$bc$equiv(t, "FunctionDeclaration"))) ? (() => { const nm = ((_logical) => (_logical !== false && _logical != null ? node.id.name : _logical))(node.id); const reg_p = ((_logical) => (_logical !== false && _logical != null ? top_p : _logical))(nm); if (((_truthy) => _truthy !== false && _truthy != null)(reg_p)) {
  register_bang(acc, nm);
}
return walk_children_bang(node, (((_truthy) => _truthy !== false && _truthy != null)(reg_p) ? nm : enclosing), acc); })() : (($$bc$equiv(t, "VariableDeclarator"))) ? (() => { const init = node.init; const id = node.id; const nm = ((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(id.type, "Identifier")) && id.name) : _logical))(id); const is_fn = ((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(init.type, "ArrowFunctionExpression")) || ($$bc$equiv(init.type, "FunctionExpression"))) : _logical))(init); const reg_p = ((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? top_p : _logical))(is_fn) : _logical))(nm); if (((_truthy) => _truthy !== false && _truthy != null)(reg_p)) {
  register_bang(acc, nm);
}
if (((_truthy) => _truthy !== false && _truthy != null)(init)) {
  walk_bang(init, (((_truthy) => _truthy !== false && _truthy != null)(reg_p) ? nm : enclosing), acc);
}
return null; })() : (($$bc$equiv(t, "CallExpression"))) ? (() => { const callee = node.callee; if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(callee.type, "Identifier")) : _logical))(callee))) {
  acc.edges.push([enclosing, callee.name]);
}
return walk_children_bang(node, enclosing, acc); })() : walk_children_bang(node, enclosing, acc));
}

function walk_children_bang(node, enclosing, acc) {
  Object.keys(node).forEach((k) => {
  const v = $$bc$get(node, k);
  if (((_truthy) => _truthy !== false && _truthy != null)(Array.isArray(v))) {
    v.forEach((el) => {
  if (node_p(el)) {
    walk_bang(el, enclosing, acc);
  }
});
  }
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(Array.isArray(v))) && node_p(v)))) {
    walk_bang(v, enclosing, acc);
  }
});
}

function parse_module_bang(file) {
  const src = fs.readFileSync(file, "utf8");
  const ast = parse(src, {ecmaVersion: "latest", sourceType: "script", allowHashBang: true});
  const acc = {names: new Set(), counts: new Map(), edges: []};
  const __walk = walk_bang(ast, TOPLEVEL, acc);
  const names = acc.names;
  const kept = acc.edges.filter((e) => ((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(e[0], TOPLEVEL)) || names.has(e[0])) : _logical))(names.has(e[1])));
  const merges = Array.from(acc.counts.entries()).filter((kv) => (kv[1] > 1));
  return {module: module_of(file), names: Array.from(names), edges: kept, merges: merges};
}

function list_modules() {
  const ensure = ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (fs.readdirSync(JS_DIR).length > 0) : _logical))(fs.existsSync(JS_DIR)))) ? (() => { console.log("codegraph: dist/chrome empty — running `bun run chrome:dist`…");
return sh("bun run chrome:dist", {quiet: true}); })() : null);
  const files = fs.readdirSync(JS_DIR);
  const filtered = files.filter((f) => ((_logical) => (_logical !== false && _logical != null ? f.endsWith(".uc.js") : _logical))(f.startsWith("gjoa-")));
  return filtered.map((f) => path.join(JS_DIR, f));
}

function build_graph() {
  const mods = list_modules().map(parse_module_bang);
  const fwd = new Map();
  const rev = new Map();
  const disp = new Map();
  const mod_of = new Map();
  const ensure_node = (id, m, nm) => { if ((!((_truthy) => _truthy !== false && _truthy != null)(fwd.has(id)))) {
  fwd.set(id, new Set());
  rev.set(id, new Set());
  disp.set(id, demangle(nm));
  return mod_of.set(id, m);
} };
  mods.forEach((pm) => {
  const m = pm.module;
  pm.names.forEach((nm) => {
  ensure_node(("".concat(nm, "@", m)), m, nm);
});
  fwd.set(("".concat(TOPLEVEL, "@", m)), new Set());
  rev.set(("".concat(TOPLEVEL, "@", m)), new Set());
  disp.set(("".concat(TOPLEVEL, "@", m)), ("".concat("<toplevel:", m, ">")));
  mod_of.set(("".concat(TOPLEVEL, "@", m)), m);
  pm.edges.forEach((e) => {
  const from = ("".concat(e[0], "@", m));
  const to = ("".concat(e[1], "@", m));
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? fwd.has(to) : _logical))(fwd.has(from)))) {
    fwd.get(from).add(to);
    rev.get(to).add(from);
  }
});
});
  return {fwd: fwd, rev: rev, disp: disp, modOf: mod_of, ids: Array.from(fwd.keys())};
}

function closure(adj, seed) {
  const seen = new Set();
  const stack = [seed];
  (() => {  while (true) {
    if ((stack.length > 0)) { (() => { const cur = stack.pop(); Array.from(((_logical) => (_logical !== false && _logical != null ? _logical : new Set()))(adj.get(cur))).forEach((nxt) => {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(seen.has(nxt)))) {
    seen.add(nxt);
    stack.push(nxt);
  }
}); })();  continue; } else { return null; }
  } })();
  return seen;
}

function resolve_ids(graph, sym) {
  const ids = graph.ids;
  const want_mangled = mangle(sym);
  return ids.filter((id) => { const at = id.indexOf("@");
const base = id.substring(0, at);
return ((id === sym) || (($$bc$equiv(base, sym)) || (($$bc$equiv(base, want_mangled)) || ($$bc$equiv(graph.disp.get(id), sym))))); });
}

function who_calls_bang(graph, sym) {
  const ids = resolve_ids(graph, sym);
  if (($$bc$equiv(ids.length, 0))) {
    console.log(("".concat("no function matching '", sym, "'")));
    process.exit(1);
  }
  ids.forEach((id) => {
  const callers = Array.from(graph.rev.get(id));
  console.log(("".concat("\n", graph.disp.get(id), "  (", graph.modOf.get(id), ")  ← ", callers.length, " direct caller(s):")));
  callers.map((x) => graph.disp.get(x)).sort().forEach((c) => {
  console.log(("".concat("  ", c)));
});
});
}

function blast_radius_bang(graph, sym) {
  const ids = resolve_ids(graph, sym);
  if (($$bc$equiv(ids.length, 0))) {
    console.log(("".concat("no function matching '", sym, "'")));
    process.exit(1);
  }
  ids.forEach((id) => {
  const deps = Array.from(closure(graph.rev, id));
  console.log(("".concat("\n", graph.disp.get(id), "  (", graph.modOf.get(id), ")  blast-radius = ", deps.length, " transitive dependent(s):")));
  deps.map((x) => graph.disp.get(x)).sort().forEach((d) => {
  console.log(("".concat("  ", d)));
});
});
}

function leverage_bang(graph, n) {
  const scored = graph.ids.filter((id) => (!((_truthy) => _truthy !== false && _truthy != null)(id.startsWith(TOPLEVEL)))).map((id) => ({id: id, n: closure(graph.rev, id).size}));
  const ranked = scored.sort((a, b) => { const a_n = a.n;
const b_n = b.n;
return (b_n - a_n); });
  console.log(("".concat("\nTop ", n, " functions by blast-radius (transitive dependents):\n")));
  ranked.slice(0, n).forEach((row) => {
  console.log(("".concat("  ", ("".concat(row.n)).padStart(4), "  ", graph.disp.get(row.id), "  (", graph.modOf.get(row.id), ")")));
});
}

function emit_claims_bang(graph) {
  const ids = graph.ids.filter((id) => (!((_truthy) => _truthy !== false && _truthy != null)(id.startsWith(TOPLEVEL))));
  const idx = new Map();
  const __n = (() => { ids.keys().forEach((i) => {
  idx.set(ids[i], i);
}); })();
  const rows = [];
  const push_bang = (s, p, o, link_p) => rows.push({s: s, p: p, o: o, link: link_p});
  ids.keys().forEach((i) => {
  const id = ids[i];
  push_bang(i, "kind", "function", false);
  push_bang(i, "name", graph.disp.get(id), false);
  push_bang(i, "module", graph.modOf.get(id), false);
  push_bang(i, "leverage", closure(graph.rev, id).size, false);
  Array.from(graph.fwd.get(id)).forEach((callee) => {
  if (((_truthy) => _truthy !== false && _truthy != null)(idx.has(callee))) {
    push_bang(i, "calls", idx.get(callee), true);
  }
});
});
  rows.forEach((r) => {
  console.log(("".concat("[", r.s, " ", JSON.stringify(r.p), " ", (((_truthy) => _truthy !== false && _truthy != null)(r.link) ? r.o : JSON.stringify(r.o)), "]")));
});
  return console.error(("".concat("\n; ", ids.length, " nodes, ", rows.length, " claims")));
}

function stats_bang(graph) {
  const fns = graph.ids.filter((id) => (!((_truthy) => _truthy !== false && _truthy != null)(id.startsWith(TOPLEVEL))));
  const edges = fns.reduce((a, id) => { const fanout = graph.fwd.get(id).size;
return (a + fanout); }, 0);
  const mods = list_modules().map(parse_module_bang);
  const merges = mods.flatMap((m) => m.merges.map((kv) => ("".concat(demangle(kv[0]), " (", m.module, ", ×", kv[1], ")"))));
  console.log(("".concat("modules: ", list_modules().length, "\nfunction nodes: ", fns.length, "\ncall edges (intra-module): ", edges)));
  console.log(("".concat("within-bundle node merges (same top-level name in >1 bundled file): ", merges.length)));
  merges.forEach((m) => {
  console.log(("".concat("  - ", m)));
});
}

export function beagle_callers(sym) {
  const out = sh(("".concat("/home/tom/code/beagle/bin/beagle callers ", sym, " src/gjoa/chrome/bjs")), {quiet: true});
  const lines = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(out).split("\n").filter((l) => l.includes("  in  "));
  return Array.from(new Set(lines.map((l) => { const location = l.split("  in  ")[1];
const callable = location.split("  (")[0];
return callable.trim(); })));
}

export function projected_callers(graph, sym) {
  const ids = resolve_ids(graph, sym);
  const names = new Set();
  ids.forEach((id) => {
  Array.from(graph.rev.get(id)).forEach((c) => {
  const at = c.indexOf("@");
  names.add(demangle(c.substring(0, at)));
});
});
  return Array.from(names);
}

export function build_graph_bang() {
  return build_graph();
}

function usage_bang() {
  console.log("usage: codegraph <who-calls|blast-radius> <fn> | leverage [N] | emit | stats");
  return process.exit(2);
}

function main_bang() {
  const argv = process.argv;
  const cmd = argv[2];
  const arg = argv[3];
  const graph = build_graph();
  return ((($$bc$equiv(cmd, "who-calls"))) ? (((_truthy) => _truthy !== false && _truthy != null)(arg) ? who_calls_bang(graph, arg) : usage_bang()) : (($$bc$equiv(cmd, "blast-radius"))) ? (((_truthy) => _truthy !== false && _truthy != null)(arg) ? blast_radius_bang(graph, arg) : usage_bang()) : (($$bc$equiv(cmd, "leverage"))) ? leverage_bang(graph, ((_logical) => (_logical !== false && _logical != null ? _logical : 20))(((_logical) => (_logical !== false && _logical != null ? Number.parseInt(arg, 10) : _logical))(arg))) : (($$bc$equiv(cmd, "emit"))) ? emit_claims_bang(graph) : (($$bc$equiv(cmd, "stats"))) ? stats_bang(graph) : usage_bang());
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
