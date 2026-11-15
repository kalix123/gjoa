import { branding_bang } from './branding.js';
import { chrome_bake } from './chrome-bake.js';
import { fingerprint_bang } from './fingerprint.js';
import { locales_bang } from './locales.js';
import { mozconfig_bang } from './mozconfig.js';
import { overlay_src_bang } from './overlay.js';
import { patches } from './patches.js';
import { sh } from './sh.js';
import { log } from './log.js';
import { writeFileSync, existsSync } from 'fs';

function regen_sovereignty_manifest_bang() {
  const tool = ".beagle-tools/gjoa/tools/sovereignty/egress-scan.js";
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(tool)))) {
    return log.info("sovereignty: egress tool not present — keeping committed manifest");
  } else {
    log.step("phase 0 — regenerating about:sovereignty egress manifest");
    sh(("".concat("bun ", tool, " manifest")), {quiet: true});
    return log.ok("sovereignty: manifest regenerated for this build");
  }
}

function regen_patch_disclosure_bang() {
  const tool = ".beagle-tools/gjoa/tools/security/patch-disclosure.js";
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(tool)))) {
    return log.info("security: patch-disclosure tool not present — keeping committed configs/security-patches.json");
  } else {
    log.step("phase 0 — regenerating configs/security-patches.json (security-patch disclosure)");
    sh(("".concat("bun ", tool)), {quiet: true});
    return log.ok("security: patch-disclosure regenerated for this build");
  }
}

export async function import_sources_bang() {
  await regen_sovereignty_manifest_bang();
  await regen_patch_disclosure_bang();
  log.step("phase 1/7 — overlaying src/gjoa/");
  await overlay_src_bang();
  log.step("phase 2/7 — applying patches/");
  await patches();
  log.step("phase 3/7 — baking chrome bundles into engine/");
  await chrome_bake();
  log.step("phase 4/7 — generating branding");
  await branding_bang();
  log.step("phase 5/7 — rewriting locale Firefox-isms");
  await locales_bang();
  log.step("phase 6/7 — generating engine/mozconfig");
  await mozconfig_bang();
  log.step("phase 7/7 — generating build fingerprint");
  await fingerprint_bang();
  writeFileSync("engine/.gjoa-import-stamp", "gjoa engine import stamp\n");
  return log.ok("import complete");
}
