import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { sh } from './sh.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO = process.cwd();

const ENGINE = join(REPO, "engine");

export const STYLE_ROOT = join(ENGINE, "servo", "components", "style");

function slurp(f) {
  return (((_truthy) => _truthy !== false && _truthy != null)(existsSync(f)) ? readFileSync(f, "utf8") : "");
}

function rel(f) {
  return f.replace(("".concat(ENGINE, "/")), "");
}

function resolve_module_file(crate_root, mods) {
  return (() => { let file = join(crate_root, "lib.rs"); let dir = crate_root; let i = 0; while (true) {
    if ((i >= mods.length)) { return file; } else { const seg = mods[i]; const text = slurp(file); const pm = new RegExp(("".concat("#\\[path\\s*=\\s*\"([^\"]+)\"\\]\\s*(?:pub\\s+)?mod\\s+", seg, "\\b"))).exec(text); if (((_truthy) => _truthy !== false && _truthy != null)(pm)) { const nf = join(dir, pm[1]); const _recur_0 = nf; const _recur_1 = dirname(nf); const _recur_2 = (i + 1); file = _recur_0; dir = _recur_1; i = _recur_2; continue; } else if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(join(dir, ("".concat(seg, ".rs")))))) { const _recur_0 = join(dir, ("".concat(seg, ".rs"))); const _recur_1 = join(dir, seg); const _recur_2 = (i + 1); file = _recur_0; dir = _recur_1; i = _recur_2; continue; } else if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(join(dir, seg, "mod.rs")))) { const _recur_0 = join(dir, seg, "mod.rs"); const _recur_1 = join(dir, seg); const _recur_2 = (i + 1); file = _recur_0; dir = _recur_1; i = _recur_2; continue; } else { return null; } }
  } })();
}

function item_defined_p(file, item) {
  const text = slurp(file);
  return ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : new RegExp(("".concat("pub\\s+use\\s+[^;]*\\b", item, "\\b"))).test(text)))(new RegExp(("".concat("bitflags!\\s*\\{[\\s\\S]*?(?:pub\\s+)?struct\\s+", item, "\\b"))).test(text))))(new RegExp(("".concat("(?:pub\\s+)?(?:struct|enum|fn|const|type|trait|static)\\s+", item, "\\b"))).test(text));
}

function has_pub_glob_p(file) {
  return new RegExp("pub\\s+use\\s+[^;]*::\\*\\s*;").test(slurp(file));
}

export function resolve_rust_path(crate_root, sym) {
  const clean = sym.replace(new RegExp("^crate::"), "");
  const segs = clean.split("::");
  const upper_idx = segs.findIndex((s) => new RegExp("^[A-Z]").test(s));
  const n = segs.length;
  const mods = (($$bc$equiv(upper_idx, -1)) ? segs.slice(0, (n - 1)) : segs.slice(0, upper_idx));
  const item = (($$bc$equiv(upper_idx, -1)) ? segs[(n - 1)] : segs[upper_idx]);
  const file = resolve_module_file(crate_root, mods);
  return (((!((_truthy) => _truthy !== false && _truthy != null)(file))) ? {verdict: "not-found", detail: ("".concat("module chain broke (no `mod ", mods.join("::"), "`)"))} : (item_defined_p(file, item)) ? {verdict: "resolved", detail: ("".concat(item, " defined in ", rel(file)))} : (has_pub_glob_p(file)) ? {verdict: "ambiguous", detail: ("".concat(item, " not a direct pub item; module has a `pub use ::*` glob — can't prove"))} : {verdict: "not-found", detail: ("".concat(item, " not defined/re-exported in ", rel(file)))});
}

function objdir_properties() {
  return sh(("".concat("ls -t ", ENGINE, "/obj-*/x86_64-unknown-linux-gnu/release/build/style-*/out/properties.rs 2>/dev/null | head -1")), {quiet: true}).trim();
}

export function resolve_rust_field(field, accessor) {
  const gen = objdir_properties();
  if (($$bc$equiv(gen, ""))) {
    return {verdict: "ambiguous", detail: "objdir properties.rs absent (no prior build) — can't verify generated bindings"};
  } else {
    const text = slurp(gen);
    const has_acc = (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(accessor, ""))) : _logical))(accessor)) ? new RegExp(("".concat("fn\\s+", accessor, "\\b"))).test(text) : false);
    const has_field = new RegExp(("".concat("\\b", field, "\\b"))).test(text);
    return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : has_field))(has_acc)) ? {verdict: "resolved", detail: ("".concat((((_truthy) => _truthy !== false && _truthy != null)(has_acc) ? ("".concat("accessor ", accessor, "()")) : ("".concat("field ", field))), " present in generated properties.rs"))} : {verdict: "not-found", detail: ("".concat("neither field `", field, "` nor accessor `", accessor, "()` in generated bindings"))});
  }
}

function match_object_body(text, mod) {
  const m = new RegExp(("".concat("export\\s+(?:const|let|var)\\s+", mod, "\\s*=\\s*\\{"))).exec(text);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(m))) {
    return null;
  } else {
    const match_at = m.index;
    const match_len = m[0].length;
    const start = (match_at + match_len + -1);
    const len = text.length;
    return (() => { let i = (start + 1); let depth = 1; while (true) {
    if ((i >= len)) { return text.slice((start + 1), i); } else { const ch = text.charAt(i); const nd = ((($$bc$equiv(ch, "{"))) ? (depth + 1) : (($$bc$equiv(ch, "}"))) ? (depth - 1) : depth); if (($$bc$equiv(nd, 0))) { return text.slice((start + 1), i); } else { const _recur_0 = (i + 1); const _recur_1 = nd; i = _recur_0; depth = _recur_1; continue; } }
  } })();
  }
}

export function resolve_js_prop(rel_path, mod, prop, must_read) {
  const file = join(ENGINE, rel_path);
  const text = slurp(file);
  if (($$bc$equiv(text, ""))) {
    return {verdict: "not-found", detail: ("".concat(rel_path, " not found"))};
  } else {
    const body = match_object_body(text, mod);
    if ((!((_truthy) => _truthy !== false && _truthy != null)(body))) {
      return {verdict: "not-found", detail: ("".concat(mod, " is no longer an exported object literal in ", rel_path))};
    } else {
      const present = new RegExp(("".concat("(?:get|set)\\s+", prop, "\\s*\\(|\\b", prop, "\\s*[:(]"))).test(body);
      if ((!((_truthy) => _truthy !== false && _truthy != null)(present))) {
        return {verdict: "not-found", detail: ("".concat(prop, " not a member of ", mod, " (deleted/renamed)"))};
      } else {
        if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(must_read, ""))) : _logical))(must_read))) {
          const readers = sh(("".concat("rg -l --no-messages '\\.", prop, "\\b' ", join(ENGINE, must_read), " 2>/dev/null | head -1")), {quiet: true}).trim();
          return (($$bc$equiv(readers, "")) ? {verdict: "not-found", detail: ("".concat(prop, " exists but is ORPHANED — no reader under ", must_read, " (override silently ignored, like FF152 newTabURL)"))} : {verdict: "resolved", detail: ("".concat(prop, " present + read under ", must_read))});
        } else {
          return {verdict: "resolved", detail: ("".concat(prop, " present on ", mod))};
        }
      }
    }
  }
}

const CPP_ROOTS = ["layout", "widget", "dom", "gfx", "view"];

function cpp_search_roots() {
  return CPP_ROOTS.map((r) => join(ENGINE, r)).filter((p) => existsSync(p)).join(" ");
}

export function resolve_cpp_symbol(sym, kind) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(ENGINE)))) {
    return {verdict: "ambiguous", detail: ("".concat(kind, " ", sym, " — engine/ not extracted (no `bun run import`); can't verify C++ anchors"))};
  } else {
    const parts = sym.split("::");
    const part_count = parts.length;
    const klass = ((part_count >= 2) ? parts[(part_count - 2)] : "");
    const member = parts[(part_count - 1)];
    const roots = cpp_search_roots();
    const qualified = sh(("".concat("rg -l --no-messages -F '", klass, "::", member, "' ", roots, " 2>/dev/null | head -1")), {quiet: true}).trim();
    if (((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(klass, ""))) && (!($$bc$equiv(qualified, "")))))) {
      return {verdict: "resolved", detail: ("".concat(klass, "::", member, " referenced in ", rel(qualified)))};
    } else {
      const cls_files = sh(("".concat("rg -l --no-messages -e '(class|struct)\\s+([A-Z_][A-Z0-9_]*\\s+)*", klass, "\\b\\s*(\\{|:|final)' ", roots, " 2>/dev/null")), {quiet: true}).trim();
      if (($$bc$equiv(cls_files, ""))) {
        return (($$bc$equiv(klass, "")) ? {verdict: "not-found", detail: ("".concat("unqualified cpp symbol `", member, "` — declare as Class::Member"))} : {verdict: "not-found", detail: ("".concat("no `class ", klass, "`/`struct ", klass, "` found under ", CPP_ROOTS.join("/"), " (class moved/renamed?)"))});
      } else {
        const hit = sh(("".concat("rg -l --no-messages '\\b", member, "\\b' ", cls_files.replaceAll("\n", " "), " 2>/dev/null | head -1")), {quiet: true}).trim();
        return ((!($$bc$equiv(hit, ""))) ? {verdict: "resolved", detail: ("".concat(member, " declared in ", klass, " (", rel(hit), ")"))} : {verdict: "not-found", detail: ("".concat(member, " not found in any file declaring ", klass, " — member removed/renamed"))});
      }
    }
  }
}

function parse_dep_entry(kind, rest) {
  const at_m = new RegExp("@\\s*(\\S+)").exec(rest);
  const acc_m = new RegExp("accessor=(\\S+)").exec(rest);
  const read_m = new RegExp("must-be-read-by:\\s*(\\S+)").exec(rest);
  const sym = rest.split(new RegExp("\\s*[@|]\\s*|\\s*must-be-read-by:|\\s{2,}|\\s+\\("))[0].trim();
  return {kind: kind, symbol: sym, at: (((_truthy) => _truthy !== false && _truthy != null)(at_m) ? at_m[1] : null), accessor: (((_truthy) => _truthy !== false && _truthy != null)(acc_m) ? acc_m[1] : null), mustRead: (((_truthy) => _truthy !== false && _truthy != null)(read_m) ? read_m[1] : null)};
}

export function parse_depends_on(text) {
  const out = [];
  const re = new RegExp("(?:#|;;)\\s*-\\s*(rust-path|rust-field|rust-method|cpp-symbol|cpp-method|cpp-field|cpp-member|webidl-attr|js-prop)\\s+(.+?)\\s*$", "gm");
  text.matchAll(re).forEach((m) => {
  out.push(parse_dep_entry(m[1].trim(), m[2].trim()));
});
  return out;
}

export function check_contract(text) {
  const entries = parse_depends_on(text);
  const out = [];
  entries.forEach((e) => {
  const kind = e.kind;
  const sym = e.symbol;
  const r = ((($$bc$equiv(kind, "rust-path"))) ? resolve_rust_path(STYLE_ROOT, sym) : (($$bc$equiv(kind, "rust-field"))) ? resolve_rust_field(((_logical) => (_logical !== false && _logical != null ? _logical : sym))(sym.split(".")[1]), ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(e.accessor)) : (($$bc$equiv(kind, "js-prop"))) ? (() => { const parts = sym.split("."); return resolve_js_prop(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(e.at), parts[0], ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(parts[1]), ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(e.mustRead)); })() : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(kind, "cpp-symbol")) || (($$bc$equiv(kind, "cpp-method")) || (($$bc$equiv(kind, "cpp-field")) || ($$bc$equiv(kind, "cpp-member"))))))) ? resolve_cpp_symbol(sym, kind) : {verdict: "unsupported", detail: ("".concat(kind, " — no resolver for this dep kind (fail-closed; add a resolver or fix the kind)"))});
  out.push({kind: kind, symbol: sym, verdict: r.verdict, detail: r.detail});
});
  return out;
}
