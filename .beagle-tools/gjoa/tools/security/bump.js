import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { REPO_ROOT } from '../prep/paths.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const PRODUCT_DETAILS_URL = "https://product-details.mozilla.org/1.0/firefox_versions.json";

async function fetchVersions() {
  const r = await fetch(PRODUCT_DETAILS_URL, {signal: AbortSignal.timeout(10000)});
  if ((!((_truthy) => _truthy !== false && _truthy != null)(r.ok))) {
    (() => { throw new Error(("".concat("product-details HTTP ", r.status))); })();
  } else {
    null;
  }
  return await r.json();
}

async function main_bang() {
  const esrMode = process.argv.includes("--esr");
  const checkOnly = process.argv.includes("--check");
  const versions = await fetchVersions();
  const latest = (esrMode ? versions.FIREFOX_ESR.replace(new RegExp("esr$", "i"), "") : versions.LATEST_FIREFOX_VERSION);
  const path = join(REPO_ROOT, "gjoa.json");
  const text = await readFile(path, "utf8");
  const cfg = JSON.parse(text);
  const oldVersion = cfg.firefox.version;
  if (($$bc$equiv(oldVersion, latest))) {
    console.error(("".concat("[bump] gjoa.json already at ", latest, " — no change.")));
    process.exit(0);
  } else {
    null;
  }
  console.error(("".concat("[bump] ", oldVersion, "  →  ", latest, (esrMode ? "  (ESR)" : ""))));
  if (checkOnly) {
    console.error("[bump] --check: not writing. Re-run without --check to apply.");
    process.exit(0);
  } else {
    null;
  }
  (cfg.firefox.version = latest);
  (cfg.firefox.candidate = latest);
  (cfg.firefox.candidateBuild = 1);
  await writeFile(path, ("".concat(JSON.stringify(cfg, null, 2), "\n")), "utf8");
  console.error("[bump] wrote gjoa.json");
  console.error("");
  console.error("Next steps:");
  console.error("  1. bun run import      # re-download tarball, re-apply overlays");
  console.error("  2. nix build .#gjoa --impure   # full rebuild (Lane 3)");
  console.error("  3. relaunch — verify everything still works");
  console.error("");
  console.error("If the new version breaks something, restore the pin from git:");
  return console.error("  git checkout gjoa.json");
}

main_bang().catch((err) => { console.error(("".concat("[bump] failed: ", err.message)));
return process.exit(1); });
