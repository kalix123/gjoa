import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO = process.cwd();

const PREF_DIR = join(REPO, "src", "gjoa", "defaults", "pref");

const CATALOG = [["toolkit.telemetry.enabled", "Telemetry upload", "false"], ["toolkit.telemetry.unified", "Unified telemetry", "false"], ["toolkit.telemetry.archive.enabled", "Telemetry archive", "false"], ["datareporting.healthreport.uploadEnabled", "Health Report upload", "false"], ["datareporting.policy.dataSubmissionEnabled", "Data submission (master)", "false"], ["app.normandy.enabled", "Normandy remote experiments", "false"], ["app.shield.optoutstudies.enabled", "Shield studies", "false"], ["browser.discovery.enabled", "Add-on discovery (TAAR)", "false"], ["extensions.pocket.enabled", "Pocket", "false"], ["browser.newtabpage.activity-stream.feeds.telemetry", "Activity-Stream telemetry", "false"], ["browser.ping-centre.telemetry", "ping-centre telemetry", "false"], ["browser.contile.enabled", "Sponsored top sites (Contile)", "false"], ["browser.newtabpage.activity-stream.showSponsored", "Sponsored stories", "false"], ["identity.fxaccounts.enabled", "Firefox Accounts", "false"], ["network.captive-portal-service.enabled", "Captive-portal probe", "false"], ["network.connectivity-service.enabled", "Connectivity check", "false"], ["app.normandy.api_url", "Normandy API endpoint", ""]];

function collect_prefs() {
  const m = new Map();
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(PREF_DIR))) {
    readdirSync(PREF_DIR).forEach((name) => {
  if (((_truthy) => _truthy !== false && _truthy != null)(name.endsWith(".bjs"))) {
    const src = readFileSync(join(PREF_DIR, name), "utf8");
    src.matchAll(new RegExp("\\(pref\\s+\"([^\"]+)\"\\s+([^)]+)\\)", "g")).forEach((mt) => {
  m.set(mt[1], mt[2].trim());
});
  }
});
  }
  return m;
}

function audit() {
  const prefs = collect_prefs();
  const disabled = [];
  const gaps = [];
  CATALOG.forEach((entry) => {
  const name = entry[0];
  const vector = entry[1];
  const want = entry[2];
  const have = prefs.get(name);
  if (((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(have, undefined))) && (($$bc$equiv(have, want)) || (($$bc$equiv(want, "")) && (($$bc$equiv(have, "\"\"")) || ($$bc$equiv(have, "")))))))) {
    disabled.push({name: name, vector: vector, value: have});
  } else {
    gaps.push({name: name, vector: vector, have: (($$bc$equiv(have, undefined)) ? "(unset — Firefox default)" : have)});
  }
});
  return {disabled: disabled, gaps: gaps, catalogued: CATALOG.length};
}

function main_bang() {
  const a = audit();
  const disabled = a.disabled;
  const gaps = a.gaps;
  if (((_truthy) => _truthy !== false && _truthy != null)(process.argv.includes("--json"))) {
    console.log(JSON.stringify(a, null, 2));
    process.exit(0);
  }
  console.log(("".concat("\nFirefox-inherited egress — what gjoa's default prefs disable\n", "(parsed from src/gjoa/defaults/pref/*.bjs)\n")));
  console.log(("".concat("DISABLED by gjoa (", disabled.length, "/", CATALOG.length, " catalogued vectors):")));
  disabled.forEach((d) => {
  console.log(("".concat("  ✓ ", d.vector, "  — ", d.name, "=", d.value)));
});
  if ((gaps.length > 0)) {
    console.log(("".concat("\nNOT disabled — Firefox default still applies (", gaps.length, ") — the gap list:")));
    gaps.forEach((g) => {
  console.log(("".concat("  • ", g.vector, "  — ", g.name, " ", g.have)));
});
  }
  console.log(("".concat("\nNOTE: SafeBrowsing egress is intentionally KEPT (security feature). This")));
  console.log("  catalog is the known-vector set; absence here ≠ proof of no other egress —");
  return console.log("  it is the audited, named list, paired with egress-scan.js (our own code).");
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
