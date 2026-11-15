import { existsSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';
import { spawnSync } from 'child_process';

const REPO = process.cwd();

const BUNDLE = join(REPO, "src", "gjoa", "toolkit", "components", "content-classifier", "scriptlet-resources.json");

const VERIFIER = join(REPO, "tools", "prep", "verify-scriptlet-resources.sh");

const REMOVED_NAME = "async-sugarcoat-8a459c41783885dc83d30f5b7da2359091f4e607.js";

const EXPECTED_SHA256 = "156b8d4c9cf833c141687ba33139fa98e8777c0bc95fee3ec05449760fb60e0a";

const PLANTED_SECRET = ("".concat("AI", "za", "odJFCrnl2edlBDdz1C5Jau2RJtBRnlWmTSH"));

function sha256hex(text) {
  return createHash("sha256")[text](.update, "utf8")["hex"](.digest);
}

describe("scriptlet-resources.json credential removal (019f79f3-1765)", () => { test("bundle exists", () => expect(existsSync(BUNDLE)).toBe(true));
test("removed resource name is absent from the committed bundle", () => { const raw = readFileSync(BUNDLE, "utf8");
return expect((raw.indexOf(REMOVED_NAME) >= 0)).toBe(false); });
test("committed bundle matches the newly pinned SHA-256 (old bytes cannot be restored silently)", () => { const raw = readFileSync(BUNDLE, "utf8");
return expect(sha256hex(raw)).toBe(EXPECTED_SHA256); });
test("verify-scriptlet-resources.sh is pinned to the same hash as the bundle", () => { const src = readFileSync(VERIFIER, "utf8");
return expect((src.indexOf(EXPECTED_SHA256) >= 0)).toBe(true); });
test("verify-scriptlet-resources.sh (Gate J) passes against the current bundle", () => { const r = spawnSync("bash", [VERIFIER], {encoding: "utf8"});
return expect(r.status).toBe(0); });
return test("gitleaks still detects a planted synthetic gcp-api-key secret (scanner sensitivity)", () => { const dir = mkdtempSync(join(tmpdir(), "gl-sensitivity-"));
const file = join(dir, "planted.js");
writeFileSync(file, ("".concat("const k = \"", PLANTED_SECRET, "\";\n")), "utf8");
const r = spawnSync("gitleaks", ["detect", "--no-banner", "--redact", "--no-git", "-s", dir], {encoding: "utf8"});
rmSync(dir, {recursive: true, force: true});
return expect(r.status).not.toBe(0); }); });
