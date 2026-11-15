import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { load_config_bang } from '../tools/prep/config.js';
import { ENGINE_BRANDING_DIR } from '../tools/prep/paths.js';

const cfg = load_config_bang();

const BRANDING_OUT = join(ENGINE_BRANDING_DIR, cfg.binaryName);

const HAS_ENGINE = existsSync(BRANDING_OUT);

function walk_bang(dir) {
  const out = [];
  readdirSync(dir).forEach((name) => {
  const path = join(dir, name);
  if (((_truthy) => _truthy !== false && _truthy != null)(statSync(path).isDirectory())) {
    walk_bang(path).forEach((p) => out.push(p));
  } else {
    out.push(path);
  }
});
  return out;
}

const TEXT_EXT = new RegExp("\\.(js|dtd|ftl|properties|sh|nsi|xml|css|json|mn|svg|html|txt|md)$", "i");

function isText(path) {
  const parts = path.split("/");
  const base = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(parts.pop());
  return (((_truthy) => _truthy !== false && _truthy != null)(["moz.build", "configure.sh", "branding.nsi", "jar.mn"].includes(base)) ? true : TEXT_EXT.test(path));
}

const suite = describe.skipIf((!((_truthy) => _truthy !== false && _truthy != null)(HAS_ENGINE)));
suite("branding regression", () => { const all_text = (((_truthy) => _truthy !== false && _truthy != null)(HAS_ENGINE) ? walk_bang(BRANDING_OUT).filter(isText).map((p) => { const path = p;
return {path: path, text: readFileSync(path, "utf8")}; }) : []);
test("no zen-browser.app references anywhere in generated branding", () => { const hits = all_text.filter((e) => e.text.includes("zen-browser.app"));
return expect(hits.map((h) => h.path)).toEqual([]); });
test("no nightly.mozilla.org references (we replaced these in gjoa.json)", () => { const hits = all_text.filter((e) => e.text.includes("nightly.mozilla.org"));
return expect(hits.map((h) => h.path)).toEqual([]); });
test("no Nightly brand string left over", () => { const ftl = all_text.find((f) => f.path.endsWith("brand.ftl"));
expect(ftl).toBeDefined();
expect(ftl.text).not.toMatch(new RegExp("= Nightly"));
return expect(ftl.text).toMatch(new RegExp(("".concat("= ", cfg.branding.shortName)))); });
test("welcome URL pref is empty (no auto-opened first-run tabs)", () => { const branding_bang = all_text.find((f) => f.path.endsWith("firefox-branding.js"));
expect(branding_bang).toBeDefined();
return expect(branding_bang.text).toMatch(new RegExp("pref\\(\"startup\\.homepage_welcome_url\",\\s*\"\"\\);")); });
test("update URLs point to gjoa.json's configured target", () => { const branding_bang = all_text.find((f) => f.path.endsWith("firefox-branding.js"));
expect(branding_bang).toBeDefined();
return expect(branding_bang.text).toContain(cfg.urls.updateManual); });
return test("configure.sh display name matches gjoa.json", () => { const cfgsh = all_text.find((f) => f.path.endsWith("configure.sh"));
expect(cfgsh).toBeDefined();
return expect(cfgsh.text).toContain(("".concat("MOZ_APP_DISPLAYNAME=", cfg.branding.displayName))); }); });
