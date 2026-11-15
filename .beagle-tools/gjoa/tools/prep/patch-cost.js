import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { sh } from './sh.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO = process.cwd();

const PATCHES_DIR = join(REPO, "patches");

const FF = join(process.env.HOME, "code", "resources", "firefox");

function churn(file) {
  const n = parseInt(sh(("".concat("git -C ", FF, " log --oneline --since='1 year ago' -- '", file, "' 2>/dev/null | wc -l")), {quiet: true}).trim(), 10);
  return (((_truthy) => _truthy !== false && _truthy != null)(((typeof n === 'number') && ((_logical) => (_logical !== false && _logical != null ? (n >= 0) : _logical))(Number.isInteger(n)))) ? Math.trunc(n) : 0);
}

function touches(text) {
  const out = [];
  text.matchAll(new RegExp("^#     - (\\S+)\\s*$", "gm")).forEach((m) => {
  out.push(m[1]);
});
  return out;
}

function rung_base(files) {
  return ((((_truthy) => _truthy !== false && _truthy != null)(files.some((f) => new RegExp("\\.(rs|cpp|cc|h|webidl)$").test(f)))) ? 3.0 : (((_truthy) => _truthy !== false && _truthy != null)(files.some((f) => new RegExp("\\.(mjs|js)$").test(f)))) ? 0.5 : 0.05);
}

function rung_name(rb) {
  return ((($$bc$equiv(rb, 3.0))) ? "native-src" : (($$bc$equiv(rb, 0.5))) ? "sys.mjs" : "build");
}

function score_patch(name) {
  const text = readFileSync(join(PATCHES_DIR, name), "utf8");
  const files = touches(text);
  const rb = rung_base(files);
  const total_churn = files.reduce((acc, f) => (acc + churn(f)), 0);
  return {name: name, rung: rb, churn: total_churn, score: (rb * total_churn), nfiles: files.length};
}

function main_bang() {
  const names = readdirSync(PATCHES_DIR).filter((p) => p.endsWith(".patch")).sort();
  const rows = names.map(score_patch).sort((a, b) => { const bs = b.score;
const as = a.score;
return (bs - as); });
  console.log("patch seam-cost  =  rung x upstream-churn  (~expected rebases/yr; higher = demote first)\n");
  rows.forEach((r) => {
  console.log(("".concat("  ", r.score.toFixed(1).padStart(7), "   ", rung_name(r.rung).padEnd(11), " churn=", ("".concat(r.churn)).padEnd(4), " files=", ("".concat(r.nfiles)).padEnd(3), " ", r.name)));
});
  return console.log("");
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
