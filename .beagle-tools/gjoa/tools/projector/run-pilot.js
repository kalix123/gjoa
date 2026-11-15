import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { sh } from '../prep/sh.js';

const REPO = process.cwd();

const REL = "browser/components/newtab/AboutNewTabRedirector.sys.mjs";

const FF_SRC = join(process.env.HOME, "code", "resources", "firefox");

const TMP = "/tmp/gjoa-pilot";

function ff_version() {
  return JSON.parse(readFileSync(join(REPO, "gjoa.json"), "utf8")).firefox.version;
}

function main_bang() {
  const v = ff_version();
  const tag = ("".concat("FIREFOX_", v.replaceAll(".", "_"), "_RELEASE"));
  const dir = join(TMP, dirname(REL));
  sh(("".concat("rm -rf ", TMP, " && mkdir -p ", dir)), null);
  sh(("".concat("git -C ", FF_SRC, " show ", tag, ":", REL, " > ", join(TMP, "pristine.mjs"))), null);
  sh(("".concat("cp ", join(TMP, "pristine.mjs"), " ", join(TMP, REL))), null);
  sh(("".concat("cd ", TMP, " && patch -p1 < ", join(REPO, "patches", "0003-newtab-redirector-gjoa.patch"))), null);
  sh(("".concat("cp ", join(TMP, REL), " ", join(TMP, "patched.mjs"))), null);
  console.error(("".concat("pilot inputs ready (pristine @ ", tag, ", patched via patches/0003)")));
  return execSync(("".concat("bun ", join(REPO, ".beagle-tools", "gjoa", "tools", "projector", "pilot-0003.js"), " ", join(TMP, "pristine.mjs"), " ", join(TMP, "patched.mjs"), " ", join(TMP, "0003.claims.json"))), {stdio: "inherit"});
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
