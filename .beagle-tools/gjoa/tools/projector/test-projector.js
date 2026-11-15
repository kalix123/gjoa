import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { sh } from '../prep/sh.js';
import { round_trips_p } from './reflector.js';
import { json__gtdoc, replay } from './claims.js';
import { build_graph_bang, beagle_callers, projected_callers } from './codegraph.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO = process.cwd();

const ENGINE = join(REPO, "engine");

function fail_bang(msg) {
  console.error(("".concat("FAIL: ", msg)));
  return process.exit(1);
}

function assert_bundles_fresh_bang() {
  const js_dir = join(REPO, "dist", "chrome", "JS");
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(js_dir)))) {
    fail_bang("dist/chrome/JS missing — run `bun run chrome:dist` before projector:test");
  }
  const newest_src = sh(("".concat("find ", REPO, "/src/gjoa/chrome -type f \\( -name '*.bjs' -o -name '*.css' \\) -printf '%T@\\n' 2>/dev/null | sort -rn | head -1")), null).trim();
  const oldest_js = sh(("".concat("find ", js_dir, " -name '*.uc.js' -printf '%T@\\n' 2>/dev/null | sort -n | head -1")), null).trim();
  if (((_truthy) => _truthy !== false && _truthy != null)(((newest_src.length > 0) && ((oldest_js.length > 0) && (parseInt(newest_src, 10) > parseInt(oldest_js, 10)))))) {
    return fail_bang("dist/chrome/JS is STALE vs src/gjoa/chrome — run `bun run chrome:dist` first. (This stale-bundle false-green is what broke v0.4.1 CI; the gate now refuses it.)");
  }
}

function main_bang() {
  assert_bundles_fresh_bang();
  const files = sh(("".concat("find ", ENGINE, "/browser/components ", ENGINE, "/toolkit/modules -name '*.sys.mjs' 2>/dev/null | head -40")), null).split("\n").filter((s) => (s.length > 0));
  (() => { let i = 0; let bad = 0; while (true) {
    if ((i < files.length)) { const src = readFileSync(files[i], "utf8"); const _recur_0 = (i + 1); const _recur_1 = (round_trips_p(src) ? bad : (bad + 1)); i = _recur_0; bad = _recur_1; continue; } else { return (() => { const file_count = files.length;
console.error(("".concat("GATE A  reflector round-trip: ", (file_count - bad), "/", file_count, " byte-identical")));
if ((bad > 0)) {
  return fail_bang(("".concat(bad, " file(s) failed round-trip")));
} })(); }
  } })();
  const artifact = join(REPO, "patches", "0003-newtab-redirector-gjoa.claims.json");
  const patch = join(REPO, "patches", "0003-newtab-redirector-gjoa.patch");
  const doc = json__gtdoc(readFileSync(artifact, "utf8"));
  const rel = doc.file;
  const engine_target = join(ENGINE, rel);
  const tmp = "/tmp/gjoa-projtest";
  sh(("".concat("rm -rf ", tmp, " && mkdir -p ", join(tmp, dirname(rel)))), null);
  sh(("".concat("cp ", engine_target, " ", join(tmp, rel))), null);
  sh(("".concat("cd ", tmp, " && patch -R -p1 < ", patch)), null);
  const pristine = readFileSync(join(tmp, rel), "utf8");
  const patched = readFileSync(engine_target, "utf8");
  const r = replay(doc.edits, pristine);
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(r.src, patched)) : _logical))(r.ok))) {
    console.error("GATE B  claim-doc equivalence: replay(pristine) == engine (patch 0003) [byte-for-byte]");
  } else {
    fail_bang((((_truthy) => _truthy !== false && _truthy != null)(r.ok) ? "claim-doc replay does not reproduce the engine file" : r.reason));
  }
  const graph = build_graph_bang();
  const symbols = ["enabled?", "apply!", "parse-hosts", "allow-hosts", "make-sidebar-button!", "all-tabs"];
  symbols.forEach((sym) => {
  const truth = beagle_callers(sym);
  const proj = new Set(projected_callers(graph, sym));
  const missing = truth.filter((c) => (!((_truthy) => _truthy !== false && _truthy != null)(proj.has(c))));
  if ((missing.length > 0)) {
    fail_bang(("".concat("GATE C  who-calls(", sym, "): beagle reports caller(s) the projector misses: ", missing.join(", "))));
  }
});
  console.error(("".concat("GATE C  codegraph soundness: beagle-callers ⊆ projected for ", symbols.length, " function symbols")));
  return console.error("projector tests PASSED");
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
