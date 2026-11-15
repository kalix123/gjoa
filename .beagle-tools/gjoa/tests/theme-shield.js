import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const REPO = process.cwd();

const SHIELD = join(REPO, "src", "gjoa", "chrome", "css", "gjoa.uc.css");

describe("urlbar theme shield", () => { test("CSS source exists", () => expect(existsSync(SHIELD)).toBe(true));
return test("declares the current Firefox urlbar variables", () => { const css = readFileSync(SHIELD, "utf8");
expect(css).toContain("--toolbar-field-focus-background-color:");
return expect(css).toContain("--urlbar-box-background-color:"); }); });
