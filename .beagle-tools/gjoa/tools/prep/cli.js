import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { download_bang } from './download.js';
import { import_sources_bang } from './import.js';
import { ENGINE_DIR } from './paths.js';
import { log } from './log.js';
import { check_bang } from '../security/check.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const USAGE = "\ngjoa prep — Firefox source preparation pipeline\n\nCommands:\n  download    Fetch + verify + extract mozilla-central into engine/\n  import      Apply src/gjoa/ overlays, patches/, and branding to engine/\n  clean       Remove engine/ (forces fresh download next time)\n  help        Show this message\n\nCold start: `bun run init` (= download + import).\nAfter editing src/gjoa/ or gjoa.json: `bun run import`.\n".trim();

async function printSecurityBanner_bang() {
  const r = await (async () => { try {
    return await check_bang();
  } catch (e) {
    const warn = log.warn;
    warn(("".concat("[security] check threw: ", e.message, " — proceeding without status")));
    return null;
  } })();
  return (((!((_truthy) => _truthy !== false && _truthy != null)(r))) ? null : (($$bc$equiv(r.status, "OK"))) ? (() => { const ok = log.ok; return ok(("".concat("[security] ", r.summary))); })() : (() => { const bar = "═".repeat(72); const header = ((($$bc$equiv(r.status, "CRITICAL"))) ? "🛑 SECURITY: CRITICAL" : (($$bc$equiv(r.status, "STALE"))) ? "⚠  SECURITY: STALE" : "?  SECURITY: UNKNOWN"); console.error("");
console.error(("".concat("\x1b[33m", bar, "\x1b[0m")));
console.error(("".concat("\x1b[1;33m", header, "\x1b[0m  — ", r.summary)));
console.error(("".concat("\x1b[33m", bar, "\x1b[0m")));
console.error(r.detail);
console.error(("".concat("\x1b[33m", bar, "\x1b[0m")));
if (($$bc$equiv(r.status, "CRITICAL"))) {
  console.error(("".concat("\x1b[1;31mAction: bump and rebuild within 24 hours. Run:  bun run security:bump\x1b[0m")));
  console.error(("".concat("\x1b[33m", bar, "\x1b[0m")));
} else if (($$bc$equiv(r.status, "STALE"))) {
  console.error(("".concat("Action: bump within the SLA in docs/security-policy.md. Run:  bun run security:bump")));
  console.error(("".concat("\x1b[33m", bar, "\x1b[0m")));
}
return console.error(""); })());
}

async function main_bang() {
  const cmd = process.argv[2];
  return ((($$bc$equiv(cmd, "download"))) ? (async () => { await printSecurityBanner_bang();
return await download_bang(); })() : (($$bc$equiv(cmd, "import"))) ? (async () => { if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(ENGINE_DIR)))) {
  const err = log.error;
  err("engine/ does not exist — run `bun run download` first");
  process.exit(1);
}
await printSecurityBanner_bang();
return await import_sources_bang(); })() : (($$bc$equiv(cmd, "clean"))) ? (((_truthy) => _truthy !== false && _truthy != null)(existsSync(ENGINE_DIR)) ? (async () => { const step = log.step; const ok = log.ok; step("removing engine/");
await rm(ENGINE_DIR, {recursive: true});
return ok("engine/ removed"); })() : (() => { const info = log.info; return info("engine/ already absent"); })()) : (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(cmd, "help")) || (($$bc$equiv(cmd, "--help")) || ($$bc$equiv(cmd, "-h")))))) ? console.log(USAGE) : (() => { console.error(USAGE);
if (((_truthy) => _truthy !== false && _truthy != null)(cmd)) {
  const err = log.error;
  err(("".concat("unknown command: ", cmd)));
}
return process.exit((((_truthy) => _truthy !== false && _truthy != null)(cmd) ? 1 : 0)); })());
}

main_bang().catch((err) => { const err_fn = log.error;
err_fn(((_logical) => (_logical !== false && _logical != null ? _logical : String(err)))(err.message));
if (((_truthy) => _truthy !== false && _truthy != null)(process.env.DEBUG)) {
  console.error(err.stack);
}
return process.exit(1); });
