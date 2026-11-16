// Bundle gjoa's browser-chrome modules into the classic scripts the loader
// injects into browser.xhtml. Plain Node, no dependencies.
//
// Sources are ES modules under src/gjoa/chrome/. Each bundle in
// src/gjoa/chrome/bundles.json lists entry files; their relative imports are
// pulled in automatically, dependencies first. Every module keeps its own
// block scope, and imports are resolved through a per-bundle registry, so
// module-private names never collide.
//
// Supported module syntax (kept deliberately small):
//   import { a, b as c } from "./x.mjs";
//   import * as ns from "./x.mjs";
//   export function f() {}   export async function f() {}
//   export const x = ...;    export let x = ...;    export class C {}
//   export { a, b as c };

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const IMPORT_RE = /^import\s+(?:\{([^}]*)\}|\*\s+as\s+([\w$]+))\s+from\s+["'](\.{1,2}\/[^"']+)["'];?[ \t]*\n?/gm;
const EXPORT_DECL_RE = /^export\s+(?=(?:async\s+)?function\b|const\b|let\b|var\b|class\b)/gm;
const EXPORT_LIST_RE = /^export\s*\{([^}]*)\};?[ \t]*\n?/gm;

function declaredExports(src) {
  const names = [];
  for (const m of src.matchAll(/^export\s+(?:async\s+)?function\s*\*?\s*([\w$]+)/gm)) names.push([m[1], m[1]]);
  for (const m of src.matchAll(/^export\s+class\s+([\w$]+)/gm)) names.push([m[1], m[1]]);
  for (const m of src.matchAll(/^export\s+(?:const|let|var)\s+([\w$]+)/gm)) names.push([m[1], m[1]]);
  for (const m of src.matchAll(EXPORT_LIST_RE)) {
    for (const part of m[1].split(",").map((s) => s.trim()).filter(Boolean)) {
      const [local, exported = local] = part.split(/\s+as\s+/);
      names.push([exported, local]);
    }
  }
  return names;
}

function transform(id, src, chromeRoot, fileDir) {
  const deps = [];
  let body = src.replace(IMPORT_RE, (_m, list, ns, spec) => {
    const depId = posix.normalize(posix.join(posix.dirname(id), spec));
    deps.push(depId);
    if (ns) return `const ${ns} = __modules[${JSON.stringify(depId)}];\n`;
    const binds = list.split(",").map((s) => s.trim()).filter(Boolean)
      .map((p) => { const [a, b] = p.split(/\s+as\s+/); return b ? `${a}: ${b}` : a; });
    return `const { ${binds.join(", ")} } = __modules[${JSON.stringify(depId)}];\n`;
  });
  if (/^import\s/m.test(body)) {
    throw new Error(`${id}: unsupported import form (only relative named/namespace imports)`);
  }
  const exportsList = declaredExports(body);
  body = body.replace(EXPORT_LIST_RE, "").replace(EXPORT_DECL_RE, "");
  if (/^export\s/m.test(body)) throw new Error(`${id}: unsupported export form`);
  const exportObj = exportsList.map(([e, l]) => (e === l ? e : `${e}: ${l}`)).join(", ");
  return {
    deps,
    code: `// ---- ${id} ----\n{\n${body.trimEnd()}\n__modules[${JSON.stringify(id)}] = Object.freeze({ ${exportObj} });\n}\n`,
  };
}

function bundle(chromeRoot, entry) {
  const order = [];
  const seen = new Map(); // id -> "visiting" | "done"
  const cache = new Map();
  const load = (id) => {
    if (!cache.has(id)) {
      const file = join(chromeRoot, id);
      if (!existsSync(file)) throw new Error(`${entry.out}: missing module ${id}`);
      cache.set(id, transform(id, readFileSync(file, "utf8").replace(/\r\n/g, "\n"), chromeRoot));
    }
    return cache.get(id);
  };
  const visit = (id, from) => {
    const state = seen.get(id);
    if (state === "done") return;
    if (state === "visiting") throw new Error(`${entry.out}: import cycle through ${id} (from ${from})`);
    seen.set(id, "visiting");
    for (const dep of load(id).deps) visit(dep, id);
    seen.set(id, "done");
    order.push(id);
  };
  for (const id of entry.files) visit(id, "bundles.json");

  return [
    entry.banner.join("\n"),
    "",
    "(function () {",
    '"use strict";',
    "const __modules = Object.create(null);",
    "",
    ...order.map((id) => load(id).code),
    "})();",
    "",
  ].join("\n");
}

// dev: write the layout GjoaLoader's dev mode reads (<dir>/JS, <dir>/CSS and a
// .bundle-stamp whose mtime triggers a hot reload in running windows).
export function buildChrome({ root, outDir, dev = false }) {
  const chromeRoot = join(root, "src", "gjoa", "chrome");
  const config = JSON.parse(readFileSync(join(chromeRoot, "bundles.json"), "utf8"));
  const [jsSub, cssSub] = dev ? ["JS", "CSS"] : ["scripts", "styles"];
  mkdirSync(join(outDir, jsSub), { recursive: true });
  mkdirSync(join(outDir, cssSub), { recursive: true });
  for (const entry of config.scripts) {
    writeFileSync(join(outDir, jsSub, entry.out), bundle(chromeRoot, entry));
    console.log(`    ${jsSub}/${entry.out}`);
  }
  for (const css of config.styles) {
    copyFileSync(join(chromeRoot, "css", css), join(outDir, cssSub, css));
    console.log(`    ${cssSub}/${css}`);
  }
  if (dev) writeFileSync(join(outDir, ".bundle-stamp"), `${new Date().toISOString()}\n`);
}

// CLI:
//   node scripts/chrome-bundle.mjs [outDir]          (default: dist/chrome)
//   node scripts/chrome-bundle.mjs --dev <bin-dir>   writes <bin-dir>/gjoa-dev/
if (resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const argv = process.argv.slice(2);
  const dev = argv[0] === "--dev";
  if (dev && !argv[1]) {
    console.error("usage: node scripts/chrome-bundle.mjs --dev <dir containing the gjoa binary>");
    process.exit(2);
  }
  const outDir = dev ? resolve(argv[1], "gjoa-dev") : resolve(argv[0] || join(root, "dist", "chrome"));
  buildChrome({ root, outDir, dev });
  console.log(`chrome bundles written to ${relative(process.cwd(), outDir) || "."}`);
}
