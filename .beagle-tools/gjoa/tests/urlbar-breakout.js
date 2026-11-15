import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const REPO = process.cwd();

const CSS = join(REPO, "src", "gjoa", "chrome", "css", "gjoa.uc.css");

const URLBAR = join(REPO, "src", "gjoa", "chrome", "bjs", "drawer", "urlbar.bjs");

function has_p(s, pat) {
  return new RegExp(pat).test(s);
}

describe("floating-urlbar breakout (#149/#150)", () => { test("sources exist", () => { expect(existsSync(CSS)).toBe(true);
return expect(existsSync(URLBAR)).toBe(true); });
test("#149 two-phase teardown present (gjoa-urlbar-teardown + finish-teardown)", () => { const ub = readFileSync(URLBAR, "utf8");
const css = readFileSync(CSS, "utf8");
expect(has_p(ub, "gjoa-urlbar-teardown")).toBe(true);
expect(has_p(ub, "finish-teardown")).toBe(true);
return expect(has_p(css, "gjoa-urlbar-teardown")).toBe(true); });
test("#150 flip-aware breakout branch (sidebar-positionend + breakout-extend)", () => { const css = readFileSync(CSS, "utf8");
expect(has_p(css, "sidebar-positionend")).toBe(true);
return expect(has_p(css, "breakout-extend")).toBe(true); });
return test("palette width is the owner-spec 400-600px clamp", () => expect(has_p(readFileSync(CSS, "utf8"), "--gjoa-floating-w:\\s*min\\(clamp\\(400px,\\s*40vw,\\s*600px\\)")).toBe(true)); });
