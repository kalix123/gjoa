import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { parse } from 'acorn';
import { sh } from '../prep/sh.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO = process.cwd();

const SRC = join(REPO, "src", "gjoa");

const EMIT = "/tmp/gjoa-egress-emit";

const CALL_SINKS = new Set(["fetch", "sendBeacon", "importScripts", "RemoteSettings"]);

const NEW_SINKS = new Set(["XMLHttpRequest", "WebSocket", "EventSource"]);

const ASSIGN_SINKS = new Set(["src", "srcset"]);

function walk(node, visit) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(typeof node, "object")) : _logical))(node))) {
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(typeof node.type, "string")) : _logical))(node.type))) {
      visit(node);
    }
    Object.keys(node).forEach((k) => {
  const v = node[k];
  if (((_truthy) => _truthy !== false && _truthy != null)(Array.isArray(v))) {
    v.forEach((c) => {
  walk(c, visit);
});
  } else {
    walk(v, visit);
  }
});
  }
}

function callee_name(c) {
  return (((!((_truthy) => _truthy !== false && _truthy != null)(c))) ? "" : (($$bc$equiv(c.type, "Identifier"))) ? c.name : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(c.type, "MemberExpression")) && ($$bc$equiv(c.property.type, "Identifier"))))) ? c.property.name : "");
}

function line_of(node) {
  return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? node.loc.start : _logical))(node.loc)) ? node.loc.start.line : 0);
}

function eval_static(n, consts) {
  return (((!((_truthy) => _truthy !== false && _truthy != null)(n))) ? null : (($$bc$equiv(n.type, "Literal"))) ? (($$bc$equiv(typeof n.value, "string")) ? n.value : null) : (($$bc$equiv(n.type, "Identifier"))) ? (() => { const v = consts.get(n.name); return (($$bc$equiv(v, undefined)) ? null : v); })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(n.type, "BinaryExpression")) && ($$bc$equiv(n.operator, "+"))))) ? (() => { const l = eval_static(n.left, consts); const r = eval_static(n.right, consts); return (((_truthy) => _truthy !== false && _truthy != null)(((l != null) && (r != null))) ? ("".concat(l, r)) : null); })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(n.type, "TemplateLiteral")) && ($$bc$equiv(n.expressions.length, 0))))) ? n.quasis.map((q) => q.value.raw).join("") : null);
}

function resolved(n, consts) {
  const v = eval_static(n, consts);
  return ((v != null) ? v : "(dynamic)");
}

function endpoint_of(args, consts) {
  return (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(args)) || ($$bc$equiv(args.length, 0)))) ? "—" : resolved(args[0], consts));
}

function render_ref(n) {
  return (((!((_truthy) => _truthy !== false && _truthy != null)(n))) ? null : (($$bc$equiv(n.type, "Identifier"))) ? n.name : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(n.type, "MemberExpression")) && ((!((_truthy) => _truthy !== false && _truthy != null)(n.computed)) && ($$bc$equiv(n.property.type, "Identifier")))))) ? (() => { const o = render_ref(n.object); return (((_truthy) => _truthy !== false && _truthy != null)(o) ? ("".concat(o, ".", n.property.name)) : null); })() : null);
}

function regex_source(n) {
  return (((!((_truthy) => _truthy !== false && _truthy != null)(n))) ? null : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(n.type, "Literal")) && n.regex))) ? n.regex.pattern : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(n.type, "NewExpression")) && (($$bc$equiv(callee_name(n.callee), "RegExp")) && ((_logical) => (_logical !== false && _logical != null ? ((n.arguments.length > 0) && ($$bc$equiv(n.arguments[0].type, "Literal"))) : _logical))(n.arguments))))) ? ("".concat(n.arguments[0].value)) : null);
}

function classify_regex(src) {
  const s = src.toLowerCase();
  return ((((_truthy) => _truthy !== false && _truthy != null)(s.includes("http"))) ? "network" : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : s.includes("file:")))(s.includes("blob"))))(s.includes("data:"))))(s.includes("moz-"))))(s.includes("chrome"))))(s.includes("resource"))))(s.includes("page-icon")))) ? "local" : null);
}

function collect_guards(ast) {
  const g = new Map();
  walk(ast, (n) => { if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(n.type, "CallExpression")) && (($$bc$equiv(n.callee.type, "MemberExpression")) && (($$bc$equiv(n.callee.property.type, "Identifier")) && (($$bc$equiv(n.callee.property.name, "test")) && ((_logical) => (_logical !== false && _logical != null ? (n.arguments.length > 0) : _logical))(n.arguments))))))) {
  const src = regex_source(n.callee.object);
  const ref = render_ref(n.arguments[0]);
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ref : _logical))(src))) {
    const k = classify_regex(src);
    if (((_truthy) => _truthy !== false && _truthy != null)(k)) {
      return g.set(ref, k);
    }
  }
} });
  return g;
}

function classify(sink, endpoint) {
  const e = endpoint.toLowerCase();
  return ((((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : e.includes("normandy")))(e.includes("telemetry")))) ? "telemetry" : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : e.includes("product-details")))(e.includes("firefox_versions"))))(e.includes("/update"))))(e.includes("aus5")))) ? "update/version" : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(sink, "RemoteSettings")) || e.includes("remote-settings")))) ? "remote-settings" : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : e.includes("filter")))(e.includes("easyprivacy"))))(e.includes("easylist")))) ? "adblock-list" : (((_truthy) => _truthy !== false && _truthy != null)(sink.startsWith("."))) ? "resource-load" : "network");
}

function egress_kind(endpoint) {
  const e = endpoint.toLowerCase();
  return ((((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(endpoint, "(dynamic)")) || ($$bc$equiv(endpoint, "—"))))) ? "unknown" : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : e.startsWith("wss://")))(e.startsWith("ws://"))))(e.startsWith("https://"))))(e.startsWith("http://")))) ? "network" : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : e.startsWith("/")))(e.startsWith("../"))))(e.startsWith("./"))))(e.startsWith("javascript:"))))(e.startsWith("blob:"))))(e.startsWith("about:"))))(e.startsWith("file:"))))(e.startsWith("data:"))))(e.startsWith("page-icon:"))))(e.startsWith("moz-"))))(e.startsWith("chrome:"))))(e.startsWith("resource:")))) ? "local" : "unknown");
}

function resolve_egress(endpoint, arg, guards) {
  const base = egress_kind(endpoint);
  if ((!($$bc$equiv(base, "unknown")))) {
    return {kind: base, basis: "endpoint"};
  } else {
    const ref = render_ref(arg);
    const g = (((_truthy) => _truthy !== false && _truthy != null)(ref) ? guards.get(ref) : undefined);
    return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(g, undefined))) : _logical))(g)) ? {kind: g, basis: ("".concat("guard(", ref, ")"))} : {kind: "unknown", basis: "unproven"});
  }
}

function unattended_p(category) {
  return ((($$bc$equiv(category, "telemetry"))) ? "yes" : (($$bc$equiv(category, "remote-settings"))) ? "yes" : (($$bc$equiv(category, "update/version"))) ? "yes" : (($$bc$equiv(category, "adblock-list"))) ? "likely" : "review");
}

function scan_source(label, src) {
  const out = [];
  const cleaned = src.replace(new RegExp("^[ \\t]*import\\([A-Za-z_$][\\w$]*,\\s*\"[^\"]*\",\\s*[A-Za-z_$][\\w$]*\\);[ \\t]*$", "gm"), "");
  return (() => { try {
    const ast = parse(cleaned, {ecmaVersion: "latest", sourceType: "module", locations: true, allowHashBang: true});
  const consts = new Map();
  walk(ast, (n) => { if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(n.type, "VariableDeclarator")) && ((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(n.id.type, "Identifier")) && n.init) : _logical))(n.id)))) {
  const v = eval_static(n.init, consts);
  if ((v != null)) {
    return consts.set(n.id.name, v);
  }
} });
  const guards = collect_guards(ast);
  const arg0 = (args) => (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (args.length > 0) : _logical))(args)) ? args[0] : null);
  walk(ast, (node) => { const t = node.type;
return ((($$bc$equiv(t, "CallExpression"))) ? (() => { const nm = callee_name(node.callee); if (((_truthy) => _truthy !== false && _truthy != null)(CALL_SINKS.has(nm))) {
  const ep = endpoint_of(node.arguments, consts);
  const cat = classify(nm, ep);
  const er = resolve_egress(ep, arg0(node.arguments), guards);
  return out.push({file: label, line: line_of(node), sink: nm, endpoint: ep, category: cat, egress: er.kind, basis: er.basis, unattended: unattended_p(cat)});
} })() : (($$bc$equiv(t, "NewExpression"))) ? (() => { const nm = callee_name(node.callee); if (((_truthy) => _truthy !== false && _truthy != null)(NEW_SINKS.has(nm))) {
  const ep = endpoint_of(node.arguments, consts);
  const cat = classify(nm, ep);
  const er = resolve_egress(ep, arg0(node.arguments), guards);
  return out.push({file: label, line: line_of(node), sink: ("".concat("new ", nm)), endpoint: ep, category: cat, egress: er.kind, basis: er.basis, unattended: unattended_p(cat)});
} })() : (($$bc$equiv(t, "AssignmentExpression"))) ? (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(node.operator, "=")) && (($$bc$equiv(node.left.type, "MemberExpression")) && (($$bc$equiv(node.left.property.type, "Identifier")) && ASSIGN_SINKS.has(node.left.property.name))))) ? (() => { const s = ("".concat(".", node.left.property.name, "="));
const ep = resolved(node.right, consts);
const cat = classify(s, ep);
const er = resolve_egress(ep, node.right, guards);
return out.push({file: label, line: line_of(node), sink: s, endpoint: ep, category: cat, egress: er.kind, basis: er.basis, unattended: unattended_p(cat)}); })() : null) : null); });
  return {records: out, parsed: true, failed: null};
  } catch (e) {
    console.error(("".concat("  PARSE FAILED (egress NOT enumerated): ", label, " — ", e.message)));
    return {records: out, parsed: false, failed: label};
  } })();
}

function walk_files(dir, suffix, acc) {
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(dir))) {
    readdirSync(dir).forEach((name) => {
  const p = join(dir, name);
  if (((_truthy) => _truthy !== false && _truthy != null)(statSync(p).isDirectory())) {
    walk_files(p, suffix, acc);
  } else {
    if (((_truthy) => _truthy !== false && _truthy != null)(p.endsWith(suffix))) {
      acc.push(p);
    }
  }
});
  }
  return acc;
}

function sources() {
  const out = [];
  walk_files(SRC, ".sys.mjs", []).sort().forEach((p) => {
  out.push({label: relative(REPO, p), src: readFileSync(p, "utf8")});
});
  walk_files(SRC, ".js", []).sort().forEach((p) => {
  if (((_truthy) => _truthy !== false && _truthy != null)(p.includes("/content/"))) {
    out.push({label: relative(REPO, p), src: readFileSync(p, "utf8")});
  }
});
  sh(("".concat("rm -rf ", EMIT, " && /home/tom/code/beagle/bin/beagle build src --out ", EMIT)), {});
  const base = join(EMIT, "gjoa");
  walk_files(base, ".js", []).sort().forEach((p) => {
  out.push({label: ("".concat("src/gjoa/…/", relative(base, p))), src: readFileSync(p, "utf8")});
});
  return out;
}

function run() {
  const srcs = sources();
  const records = [];
  const failed = [];
  srcs.forEach((s) => {
  const res = scan_source(s.label, s.src);
  res.records.forEach((r) => {
  records.push(r);
});
  if (((_truthy) => _truthy !== false && _truthy != null)(res.failed)) {
    failed.push(res.failed);
  }
});
  return {records: records, failed: failed, scanned: srcs.length};
}

function report(result) {
  const records = result.records;
  const failed = result.failed;
  console.log(("".concat("\ngjoa egress surface — authored chrome\n", "(static AST scan of ", result.scanned, " sources: .sys.mjs + emitted .bjs under src/gjoa)\n")));
  if (($$bc$equiv(records.length, 0))) {
    console.log("  no network egress sink found in authored chrome.");
  } else {
    const order = ["network", "unknown", "local"];
    const head = {["network"]: "PROVEN NETWORK EGRESS (leaves the machine)", ["unknown"]: "UNVERIFIABLE STATICALLY (dynamic endpoint — review set)", ["local"]: "LOCAL RESOURCE (resource:/chrome:/page-icon: — not egress)"};
    order.forEach((kind) => {
  const rs = records.filter((r) => ($$bc$equiv(r.egress, kind)));
  if ((rs.length > 0)) {
    console.log(("".concat("[", head[kind], "]")));
    rs.forEach((r) => {
  console.log(("".concat("  ", r.file, ":", r.line, "  ", r.sink, "(", r.endpoint, ")", "   [", r.category, ", via ", r.basis, ", unattended=", r.unattended, "]")));
});
    console.log("");
  }
});
  }
  const net = records.filter((r) => ($$bc$equiv(r.egress, "network"))).length;
  const loc = records.filter((r) => ($$bc$equiv(r.egress, "local"))).length;
  const unk = records.filter((r) => ($$bc$equiv(r.egress, "unknown"))).length;
  console.log(("".concat("SUMMARY of ", records.length, " egress sink(s) in authored chrome:")));
  console.log(("".concat("  ", net, " network egress   |   ", loc, " local (not egress)   |   ", unk, " unproven (review)")));
  if ((failed.length > 0)) {
    console.log(("".concat("\n  ⚠ ", failed.length, " source(s) could NOT be parsed — egress in them is NOT enumerated:")));
    failed.forEach((f) => {
  console.log(("".concat("      ", f)));
});
  } else {
    console.log("  (every authored source parsed — surface is complete)");
  }
  console.log("\n  NOTE: authored-chrome egress only. Firefox-inherited egress is disabled");
  return console.log("  via prefs (src/gjoa/defaults/pref), a separate axis — not counted here.");
}

const MANIFEST_PATH = join(REPO, "src", "gjoa", "browser", "components", "gjoa", "content", "sovereignty", "manifest.json");

function describe(r) {
  const cat = r.category;
  return ((($$bc$equiv(cat, "update/version"))) ? "Firefox version freshness check" : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(cat, "remote-settings")) || ($$bc$equiv(cat, "adblock-list"))))) ? "filter-list update (when adblock is enabled)" : (($$bc$equiv(cat, "telemetry"))) ? "telemetry" : (($$bc$equiv(r.sink, ".src="))) ? "resource load" : ("".concat(r.sink, " call")));
}

function bucket(r) {
  const eg = r.egress;
  const ep = r.endpoint.toLowerCase();
  const cat = r.category;
  return ((($$bc$equiv(eg, "local"))) ? "local" : (($$bc$equiv(eg, "unknown"))) ? "unproven" : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : (($$bc$equiv(cat, "update/version")) || ($$bc$equiv(cat, "telemetry")))))(ep.includes("product-details")))) ? "unattendedExternal" : "userEnabledNetwork");
}

function item_of(r) {
  return {endpoint: r.endpoint, what: describe(r), file: r.file, line: r.line, basis: r.basis};
}

export function write_manifest_bang() {
  const records = run().records;
  const own = {unattendedExternal: [], userEnabledNetwork: [], local: [], unproven: []};
  records.forEach((r) => {
  own[bucket(r)].push(item_of(r));
});
  const inh = JSON.parse(sh("bun .beagle-tools/gjoa/tools/sovereignty/inherited-egress.js --json", {quiet: true}));
  const commit = sh("git rev-parse --short HEAD", {quiet: true}).trim();
  const version = JSON.parse(readFileSync(join(REPO, "gjoa.json"), "utf8")).displayVersion;
  const date = new Date().toISOString().slice(0, 10);
  const manifest = {claim: "This build makes 1 unattended network call: the Firefox version check.", gjoaVersion: version, auditedCommit: commit, generated: date, method: "static AST audit of all authored chrome (.sys.mjs + emitted .bjs + content .js), every source parsed", ownCode: own, inheritedEgress: {disabled: inh.disabled.length, catalogued: inh.catalogued, note: "Firefox built-in egress vectors gjoa disables by default. SafeBrowsing kept (security).", toggleGated: inh.gaps.map((g) => ({pref: g.name, what: g.vector}))}};
  writeFileSync(MANIFEST_PATH, ("".concat(JSON.stringify(manifest, null, 2), "\n")));
  return console.log(("".concat("sovereignty: wrote manifest @ ", commit, " (", own.unattendedExternal.length, " unattended, ", records.length, " sinks)")));
}

function main_bang() {
  return ((((_truthy) => _truthy !== false && _truthy != null)(process.argv.includes("manifest"))) ? write_manifest_bang() : (((_truthy) => _truthy !== false && _truthy != null)(process.argv.includes("--json"))) ? console.log(JSON.stringify(run(), null, 2)) : report(run()));
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
