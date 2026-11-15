import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { CONFIGS_DIR } from './paths.js';
import { verifySignature, hashFromSums } from './download.js';
import { log } from './log.js';

function checksumUrl(version) {
  return ("".concat("https://archive.mozilla.org/pub/firefox/releases/", version, "/SHA256SUMS"));
}

function tarballName(version) {
  return ("".concat("firefox-", version, ".source.tar.xz"));
}

export async function pin_firefox_bang(version) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(version.match(new RegExp("^[0-9]+(\\.[0-9]+){1,3}(esr)?$"))))) {
    (() => { throw new Error(("".concat("refusing unsafe version string: ", version))); })();
  }
  const p = join(CONFIGS_DIR, ("".concat("firefox-", version, ".sha256")));
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(p))) {
    log.warn(("".concat("pin already exists (", p, "); re-deriving after GPG-verify")));
  }
  log.step(("".concat("fetching SHA256SUMS for firefox ", version)));
  const res = await fetch(checksumUrl(version));
  if ((!((_truthy) => _truthy !== false && _truthy != null)(res.ok))) {
    (() => { throw new Error(("".concat("failed to fetch SHA256SUMS: ", res.status))); })();
  }
  const text = await res.text();
  await verifySignature(version, text, true);
  const hash = hashFromSums(text, version);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(hash))) {
    (() => { throw new Error(("".concat("SHA256SUMS does not list ", tarballName(version)))); })();
  }
  writeFileSync(p, ("".concat(hash, "  source/", tarballName(version), "\n")));
  return log.ok(("".concat("wrote GPG-verified pin ", p, "\n  ", hash)));
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  const v = process.argv[2];
  if ((!((_truthy) => _truthy !== false && _truthy != null)(v))) {
    console.error("usage: pin-firefox <version>");
    process.exit(1);
  } else {
    await pin_firefox_bang(v);
  }
}
