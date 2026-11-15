import { readFile, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { entries } from './build-config.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO_ROOT = process.cwd();

const OUT_DIR = join(REPO_ROOT, "dist", "chrome", "JS");

function rewrite_core_import(clause) {
  const binds = clause.split(",").map((c) => { const t = c.trim();
if (($$bc$equiv(t.length, 0))) {
  return "";
} else {
  const parts = t.split(new RegExp("\\s+as\\s+"));
  const exp = parts[0].trim();
  const loc = ((parts.length > 1) ? parts[1].trim() : exp);
  return ("".concat(loc, " = $$bc.", exp));
} }).filter((s) => (s.length > 0));
  return (($$bc$equiv(binds.length, 0)) ? "" : ("".concat("const ", binds.join(", "), ";")));
}

function process_file(code) {
  const exports = [];
  const processed = code.split("\n").filter((line) => ((((_truthy) => _truthy !== false && _truthy != null)(new RegExp("from\\s+['\"][^'\"]*beagle/core\\.js['\"]").test(line))) ? true : (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? new RegExp("from\\s+['\"]").test(line) : _logical))(new RegExp("^import\\s+").test(line)))) ? false : (((_truthy) => _truthy !== false && _truthy != null)(new RegExp("^import\\(").test(line))) ? false : true)).map((line) => { const core_match = line.match(new RegExp("^import\\s*\\{([^}]*)\\}\\s*from\\s*['\"][^'\"]*beagle/core\\.js['\"]"));
if (((_truthy) => _truthy !== false && _truthy != null)(core_match)) {
  return rewrite_core_import(core_match[1]);
} else {
  const fn_match = line.match(new RegExp("^export\\s+function\\s+(\\w+)"));
  if (((_truthy) => _truthy !== false && _truthy != null)(fn_match)) {
    exports.push(fn_match[1]);
    return line.replace(new RegExp("^export\\s+function\\s+(\\w+)"), "$1 = function");
  } else {
    const decl_match = line.match(new RegExp("^export\\s+(?:const|let|var)\\s+(\\w+)"));
    if (((_truthy) => _truthy !== false && _truthy != null)(decl_match)) {
      exports.push(decl_match[1]);
      return line.replace(new RegExp("^export\\s+(?:const|let|var)\\s+"), "");
    } else {
      return line;
    }
  }
} }).join("\n");
  return {code: processed, exports: exports};
}

async function build_one(entry) {
  const all_exports = [];
  const blocks = [];
  const files = entry.files;
  const n = files.length;
  const failed = await (async () => { let i = 0; while (true) {
    if ((i >= n)) { return false; } else { const file = files[i]; const abs_path = join(REPO_ROOT, file); const fail = await (async () => { try {
    const raw = await readFile(abs_path, "utf-8");
  const result = process_file(raw);
  const code = result.code;
  const exports = result.exports;
  (() => { exports.forEach((e) => {
  all_exports.push(e);
}); })();
  blocks.push(("".concat("{\n", code, "\n}")));
  return false;
  } catch (err) {
    console.error(("".concat("✗ ", file, ": ", err.message)));
    return true;
  } })(); if (fail) { return true; } else { const _recur_0 = (i + 1); i = _recur_0; continue; } }
  } })();
  if (((_truthy) => _truthy !== false && _truthy != null)(failed)) {
    return false;
  } else {
    const unique = Array.from(new Set(all_exports));
    const var_decl = ((unique.length > 0) ? ("".concat("var ", unique.join(", "), ";\n\n")) : "");
    const body = blocks.join("\n\n");
    const iife = ("".concat("(function() {\n\"use strict\";\n", var_decl, body, "\n})();"));
    const output = ("".concat(entry.banner, "\n\n", iife));
    const out_path = join(OUT_DIR, entry.out);
    await writeFile(out_path, output);
    console.log(("".concat("✓ ", out_path, "  (", body.length, " bytes)")));
    return true;
  }
}

await mkdir(OUT_DIR, {recursive: true});

const results = await Promise.all(entries.map(build_one));

if (((_truthy) => _truthy !== false && _truthy != null)(results.some((ok) => (!ok)))) {
  process.exit(1);
}
