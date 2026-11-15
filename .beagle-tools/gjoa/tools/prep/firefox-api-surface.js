import { sh } from './sh.js';
import { join } from 'path';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO = process.cwd();

const CHROME = join(REPO, "src", "gjoa", "chrome", "bjs");

const ENGINE = join(REPO, "engine");

const GLOBALS = ["gBrowser", "ChromeUtils", "PathUtils", "IOUtils"];

function scan_surface() {
  const result = [];
  GLOBALS.forEach((g) => {
  const out = sh(("".concat("grep -rhoE '\\(\\.[a-zA-Z]+ ", g, "\\b' ", CHROME, " 2>/dev/null")), {quiet: true});
  const members = [];
  out.split("\n").forEach((line) => {
  const m = line.match(new RegExp("\\(\\.([a-zA-Z]+)"));
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!((_truthy) => _truthy !== false && _truthy != null)(members.includes(m[1]))) : _logical))(m))) {
    members.push(m[1]);
  }
});
  if ((members.length > 0)) {
    result.push({global: g, members: members.sort()});
  }
});
  return result;
}

function resolves_p(member) {
  const hits = sh(("".concat("grep -rl --include=*.js --include=*.jsm --include=*.mjs --include=*.webidl --include=*.idl ", "-e '", member, "' ", ENGINE, " 2>/dev/null | grep -vE '/test/|/tests/|_test' | head -1")), {quiet: true});
  return (hits.trim().length > 0);
}

function main_bang() {
  const surface = scan_surface();
  const missing = [];
  const total = [0];
  console.log("Firefox-API seam ratchet — gjoa's chrome dependency on upstream host globals:\n");
  surface.forEach((entry) => {
  const g = entry.global;
  const members = entry.members;
  console.log(("".concat("  ", g, " (", members.length, " members)")));
  members.forEach((member) => {
  const seen = total[0];
  (total[0] = (seen + 1));
  if ((!resolves_p(member))) {
    missing.push(("".concat(g, ".", member)));
  }
});
});
  console.log("");
  if (($$bc$equiv(missing.length, 0))) {
    return console.log(("".concat("✓ all ", total[0], " Firefox-API members resolve in non-test engine/ source — no drift.")));
  } else {
    console.log(("".concat("⚠ ", missing.length, " of ", total[0], " members did NOT resolve in engine/ — review before shipping a bump:")));
    missing.forEach((m) => {
  console.log(("".concat("    ", m)));
});
    return process.exit(1);
  }
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
