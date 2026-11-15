import { existsSync, mkdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { load_config_bang } from './config.js';
import { ENGINE_DIR, REPO_ROOT, SOURCES_CACHE, CONFIGS_DIR } from './paths.js';
import { log } from './log.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const MOZILLA_SIGNING_FPR = "14F26682D0916CDD81E37B6D61B7B526D98F0353";

function tarballUrl(version) {
  return ("".concat("https://archive.mozilla.org/pub/firefox/releases/", version, "/source/firefox-", version, ".source.tar.xz"));
}

function checksumUrl(version) {
  return ("".concat("https://archive.mozilla.org/pub/firefox/releases/", version, "/SHA256SUMS"));
}

function signatureUrl(version) {
  return ("".concat("https://archive.mozilla.org/pub/firefox/releases/", version, "/SHA256SUMS.asc"));
}

function pinnedHashPath(version) {
  return join(CONFIGS_DIR, ("".concat("firefox-", version, ".sha256")));
}

function tarballName(version) {
  return ("".concat("firefox-", version, ".source.tar.xz"));
}

export function hashFromSums(text, version) {
  const want = tarballName(version);
  const lines = text.split("\n");
  return (() => { let i = 0; while (true) {
    if ((i >= lines.length)) { return null; } else { const parts = lines[i].trim().split(new RegExp("\\s+")); const hash = parts[0]; const file = parts[1]; if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(file, want)) || file.endsWith(("".concat("/", want)))) : _logical))(file))) { return hash; } else { const _recur_0 = (i + 1); i = _recur_0; continue; } }
  } })();
}

function pinnedSha256(version) {
  const p = pinnedHashPath(version);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(p)))) {
    (() => { throw new Error(("".concat("no pinned checksum for firefox ", version, ".\n  expected: ", p, "\n  add it from the GPG-verified SHA256SUMS (see that file's header)."))); })();
  }
  const text = readFileSync(p, "utf8");
  const hash = hashFromSums(text, version);
  return ((!((_truthy) => _truthy !== false && _truthy != null)(hash)) ? (() => { throw new Error(("".concat("pinned checksum file does not list ", tarballName(version), ": ", p))); })() : hash);
}

export async function verifySignature(version, sumsText, strict) {
  const available = (() => { try {
    return Bun.spawnSync(["gpg", "--version"], {stdout: "ignore", stderr: "ignore"}).success;
  } catch (__e) {
    return false;
  } })();
  if ((!((_truthy) => _truthy !== false && _truthy != null)(available))) {
    if (strict) {
      return (() => { throw new Error(("".concat("gpg is REQUIRED to establish a Firefox source pin but is not installed.\n", "  the committed pin must be proven signed by Mozilla's release key ", MOZILLA_SIGNING_FPR, " before it can be trusted; install gnupg and retry."))); })();
    } else {
      log.warn("gpg not available; skipping SHA256SUMS.asc signature check (pinned in-repo hash still enforced)");
      return false;
    }
  } else {
    const ascRes = await fetch(signatureUrl(version));
    if ((!((_truthy) => _truthy !== false && _truthy != null)(ascRes.ok))) {
      (() => { throw new Error(("".concat("failed to fetch SHA256SUMS.asc: ", ascRes.status))); })();
    }
    const asc = await ascRes.text();
    const tmpDir = join(SOURCES_CACHE, ".gpg-verify");
    const keyPath = join(tmpDir, "mozilla.key");
    const sumsPath = join(tmpDir, "SHA256SUMS");
    const ascPath = join(tmpDir, "SHA256SUMS.asc");
    const keyRes = await fetch(("".concat("https://archive.mozilla.org/pub/firefox/releases/", version, "/KEY")));
    if ((!((_truthy) => _truthy !== false && _truthy != null)(keyRes.ok))) {
      (() => { throw new Error(("".concat("failed to fetch Mozilla KEY: ", keyRes.status))); })();
    }
    mkdirSync(tmpDir, {recursive: true});
    await Bun.write(keyPath, await keyRes.text());
    await Bun.write(sumsPath, sumsText);
    await Bun.write(ascPath, asc);
    const kr = join(tmpDir, "keyring.gpg");
    const imp = Bun.spawnSync(["gpg", "--no-default-keyring", "--keyring", kr, "--import", keyPath], {stdout: "ignore", stderr: "ignore"});
    if ((!((_truthy) => _truthy !== false && _truthy != null)(imp.success))) {
      (() => { throw new Error("gpg: failed to import Mozilla KEY"); })();
    }
    const ver = Bun.spawnSync(["gpg", "--no-default-keyring", "--keyring", kr, "--status-fd", "1", "--verify", ascPath, sumsPath], {stdout: "pipe", stderr: "ignore"});
    const out = ver.stdout.toString();
    const valid = out.split("\n").some((line) => ((_logical) => (_logical !== false && _logical != null ? (() => { const f = line.trim().split(new RegExp("\\s+")); const field_count = f.length; return ($$bc$equiv(f[(field_count - 1)], MOZILLA_SIGNING_FPR)); })() : _logical))(line.includes("VALIDSIG ")));
    if ((!((_truthy) => _truthy !== false && _truthy != null)(valid))) {
      (() => { throw new Error(("".concat("SHA256SUMS.asc not signed by pinned Mozilla key ", MOZILLA_SIGNING_FPR, " (no VALIDSIG line whose primary-key fpr matches)", "\n  gpg --status output:\n", out))); })();
    }
    log.ok(("".concat("SHA256SUMS.asc GPG-verified against pinned Mozilla key ", MOZILLA_SIGNING_FPR)));
    return true;
  }
}

async function fetchSha256(version) {
  log.step(("".concat("fetching upstream SHA256SUMS for firefox ", version)));
  const res = await fetch(checksumUrl(version));
  if ((!((_truthy) => _truthy !== false && _truthy != null)(res.ok))) {
    (() => { throw new Error(("".concat("failed to fetch SHA256SUMS: ", res.status))); })();
  }
  const text = await res.text();
  const liveHash = hashFromSums(text, version);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(liveHash))) {
    (() => { throw new Error(("".concat("SHA256SUMS does not list ", tarballName(version)))); })();
  }
  const pinned = pinnedSha256(version);
  if ((!($$bc$equiv(liveHash, pinned)))) {
    (() => { throw new Error(("".concat("live SHA256SUMS disagrees with pinned checksum for firefox ", version, ".\n  pinned: ", pinned, "\n  live:   ", liveHash, "\n  refusing to trust same-origin checksum over the committed pin."))); })();
  }
  await verifySignature(version, text, false);
  return liveHash;
}

async function sha256OfFile(path) {
  const file = Bun.file(path);
  const buf = await file.arrayBuffer();
  const hash = new Bun.CryptoHasher("sha256");
  hash.update(buf);
  return hash.digest("hex");
}

async function downloadTo(url, dest) {
  log.step(("".concat("downloading ", url)));
  const res = await fetch(url);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(res.ok))) {
    (() => { throw new Error(("".concat("download failed (", res.status, "): ", url))); })();
  }
  const total = Number(((_logical) => (_logical !== false && _logical != null ? _logical : 0))(res.headers.get("content-length")));
  if (((_truthy) => _truthy !== false && _truthy != null)(total)) {
    log.info(("".concat("expecting ", (total / 1024 / 1024).toFixed(1), " MB")));
  }
  return await Bun.write(dest, res);
}

export async function download_bang() {
  const cfg = load_config_bang();
  mkdirSync(SOURCES_CACHE, {recursive: true});
  const version = cfg.firefox.version;
  const tarball = join(SOURCES_CACHE, tarballName(version));
  const expectedHash = await fetchSha256(version);
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(tarball))) {
    const have = await sha256OfFile(tarball);
    if (($$bc$equiv(have, expectedHash))) {
      log.ok("cached tarball matches upstream hash, skipping download");
    } else {
      log.warn("cached tarball hash mismatch, re-downloading");
      await downloadTo(tarballUrl(version), tarball);
    }
  } else {
    await downloadTo(tarballUrl(version), tarball);
  }
  const actualHash = await sha256OfFile(tarball);
  if ((!($$bc$equiv(actualHash, expectedHash)))) {
    (() => { throw new Error(("".concat("tarball SHA256 mismatch.\n  expected: ", expectedHash, "\n  got:      ", actualHash))); })();
  }
  const size = statSync(tarball).size;
  log.ok(("".concat("tarball verified (", (size / 1024 / 1024).toFixed(1), " MB)")));
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(ENGINE_DIR))) {
    log.warn("engine/ already exists; remove it first if you want a fresh extract");
    return null;
  } else {
    log.step("extracting tarball to engine/ (this takes a couple minutes)");
    mkdirSync(ENGINE_DIR);
    const proc = Bun.spawn({cmd: ["tar", "-xJf", tarball, "-C", ENGINE_DIR, "--strip-components=1"], cwd: REPO_ROOT, stdout: "inherit", stderr: "inherit"});
    const code = await proc.exited;
    if ((!($$bc$equiv(code, 0)))) {
      (() => { throw new Error(("".concat("tar extraction failed (exit ", code, ")"))); })();
    }
    return log.ok("engine/ ready");
  }
}
