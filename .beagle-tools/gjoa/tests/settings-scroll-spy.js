import { readFileSync } from 'fs';
import { join } from 'path';

const SETTINGS_DIR = "src/gjoa/browser/components/gjoa/content/settings";

const JS = readFileSync(join(SETTINGS_DIR, "settings.js"), "utf8");

const GUARD_RE = new RegExp("scrollHeight\\s*-\\s*(\\d+)");

describe("about:gjoa settings scroll-spy", () => test("activates the final section before the literal page end", () => { const m = JS.match(GUARD_RE);
expect(m).toBeTruthy();
return expect(parseInt(m[1], 10)).toBeGreaterThanOrEqual(100); }));
