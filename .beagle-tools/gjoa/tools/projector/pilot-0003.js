import { readFileSync, writeFileSync } from 'fs';
import { build_doc, replay, doc__gtjson, json__gtdoc } from './claims.js';
import { parses_p } from './set-body.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const ANCHORS = [{class: "AboutNewTabRedirectorParent", method: "newChannel"}, {class: "AboutNewTabRedirectorChild", method: "newChannel"}];

function count_occurrences(s, needle) {
  return (() => { let from = 0; let n = 0; while (true) {
    const i = s.slice(from).indexOf(needle); if ((i < 0)) { return n; } else { const _recur_0 = (from + i + 1); const _recur_1 = (n + 1); from = _recur_0; n = _recur_1; continue; }
  } })();
}

function main_bang() {
  const pristine = readFileSync(process.argv[2], "utf8");
  const patched = readFileSync(process.argv[3], "utf8");
  const claim_path = ((_logical) => (_logical !== false && _logical != null ? _logical : "/tmp/0003.claims.json"))(process.argv[4]);
  const doc0 = build_doc(patched, pristine, ANCHORS);
  const json = doc__gtjson(doc0);
  const __ = writeFileSync(claim_path, json);
  const doc = json__gtdoc(readFileSync(claim_path, "utf8"));
  const r1 = replay(doc, pristine);
  const equiv = ((_logical) => (_logical !== false && _logical != null ? ($$bc$equiv(r1.src, patched)) : _logical))(r1.ok);
  const churned = pristine.replace("  newChannel(uri, loadInfo) {", "  // FF153: upstream inserted a telemetry hook\n  _recordOpen(k) {\n    Glean.newtab.opened.add(1);\n  }\n\n  newChannel(uri, loadInfo) {").replace("let chromeURI = this.getChromeURI(uri);", "let chromeURI = this.getChromeURI(uri); // FF153 upstream reflow");
  const r2 = replay(doc, churned);
  const churn_ok = ((_logical) => (_logical !== false && _logical != null ? (parses_p(r2.src) && ($$bc$equiv(count_occurrences(r2.src, "gjoa-newtab"), 2))) : _logical))(r2.ok);
  const renamed = pristine.replaceAll("newChannel(uri, loadInfo)", "createChannel(uri, loadInfo)");
  const r3 = replay(doc, renamed);
  const rename_ok = ((_logical) => (_logical !== false && _logical != null ? (parses_p(r3.src) && (($$bc$equiv(count_occurrences(r3.src, "gjoa-newtab"), 2)) && (r3.recoveries.length > 0))) : _logical))(r3.ok);
  console.error(("".concat("claim-doc: ", doc.length, " set-body verbs, ", json.length, " bytes JSON -> ", claim_path)));
  console.error(("".concat("GATE 1  equivalence (claim-replay == patch 0003, byte-for-byte): ", equiv)));
  console.error(("".concat("GATE 2  churn-resilience (name-anchored claim survives reflow that .rej's the patch): ", churn_ok)));
  console.error(("".concat("GATE 3  rename-recovery (claim survives a method rename that .rej's the patch): ", rename_ok)));
  if (((_truthy) => _truthy !== false && _truthy != null)(rename_ok)) {
    r3.recoveries.forEach((rec) => {
  console.error(("".concat("          recovered: ", rec)));
});
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? rename_ok : _logical))(churn_ok) : _logical))(equiv)))) {
    console.error("PILOT FAILED");
    if ((!((_truthy) => _truthy !== false && _truthy != null)(r1.ok))) {
      console.error(("".concat("  gate1: ", r1.reason)));
    }
    process.exit(1);
  }
  return console.error("PILOT PASSED — 0011 as a claim-doc: equivalent, reflow-resilient, AND rename-recoverable.");
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
