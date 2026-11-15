import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const REPO = process.cwd();

const CSS = join(REPO, "src", "gjoa", "chrome", "css", "gjoa.uc.css");

const LAYOUT = join(REPO, "src", "gjoa", "chrome", "bjs", "drawer", "layout.bjs");

function has_p(s, pat) {
  return new RegExp(pat).test(s);
}

describe("drawer flip-symmetry (#145/#146/#147)", () => { test("sources exist", () => { expect(existsSync(CSS)).toBe(true);
return expect(existsSync(LAYOUT)).toBe(true); });
test("flip mechanism (sidebar-positionend) present in CSS + shadow overrides", () => { const css = readFileSync(CSS, "utf8");
const layout = readFileSync(LAYOUT, "utf8");
expect(has_p(css, "sidebar-positionend")).toBe(true);
return expect(has_p(layout, "sidebar-positionend")).toBe(true); });
test("#146 toolbar mirrors on flip (row-reverse)", () => expect(has_p(readFileSync(CSS, "utf8"), "row-reverse")).toBe(true));
test("#147 bottom buttons anchor to the edge (align-items: end)", () => expect(has_p(readFileSync(LAYOUT, "utf8"), "align-items:\\s*end")).toBe(true));
return test("#145 customize panel uses #sidebar-box + the uniform --gjoa-card-gap", () => { const css = readFileSync(CSS, "utf8");
expect(has_p(css, "sidebar-box")).toBe(true);
return expect(has_p(css, "--gjoa-card-gap")).toBe(true); }); });
