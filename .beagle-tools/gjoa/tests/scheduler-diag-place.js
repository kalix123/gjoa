import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const REPO = process.cwd();

const SCHEDULER = join(REPO, "src", "gjoa", "chrome", "bjs", "platform", "scheduler.bjs");

function has_p(s, pat) {
  return new RegExp(pat).test(s);
}

describe("scheduler diag() place-safety (E009 019f79cd)", () => { test("source exists", () => expect(existsSync(SCHEDULER)).toBe(true));
test("diag does not assign through (set! (aget ...))", () => { const src = readFileSync(SCHEDULER, "utf8");
return expect(has_p(src, "\\(set!\\s*\\(aget")).toBe(false); });
return test("diag rebuilds pending map via reduce/assoc over DOMAIN-ORDER", () => { const src = readFileSync(SCHEDULER, "utf8");
expect(has_p(src, "reduce[\\s\\S]{0,80}assoc")).toBe(true);
expect(has_p(src, "\\(or \\(\\.get pending domain\\) \\[\\]\\)")).toBe(true);
return expect(has_p(src, "DOMAIN-ORDER")).toBe(true); }); });
