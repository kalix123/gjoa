import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { get as $$bc$get } from 'beagle/core.js';

const REPO = process.cwd();

const MANIFEST = join(REPO, "configs", "security-mitigations.json");

function regex_from_literal(lit) {
  const m = lit.match(new RegExp("^/(.*)/([a-z]*)$"));
  return (((_truthy) => _truthy !== false && _truthy != null)(m) ? new RegExp(m[1], m[2]) : new RegExp(lit));
}

describe("security mitigation contracts", () => test("every source assertion and validator corpus holds", () => { expect(existsSync(MANIFEST)).toBe(true);
const mits = JSON.parse(readFileSync(MANIFEST, "utf8")).mitigations;
Object.keys(mits).forEach((id) => {
  const entry = $$bc$get(mits, id);
  const src = readFileSync(join(REPO, entry.file), "utf8");
  (() => { ((_logical) => (_logical !== false && _logical != null ? _logical : []))(entry.mustMatch).forEach((rx) => {
  expect(new RegExp(rx, "m").test(src)).toBe(true);
}); })();
  if (((_truthy) => _truthy !== false && _truthy != null)(entry.extractRegex)) {
    const m = src.match(new RegExp(entry.extractRegex.from));
    expect(m).toBeTruthy();
    const re = regex_from_literal(m[1]);
    (() => { entry.mustReject.forEach((s) => {
  expect(re.test(s)).toBe(true);
}); })();
    (() => { entry.mustAccept.forEach((s) => {
  expect(re.test(s)).toBe(false);
}); })();
  }
}); }));
