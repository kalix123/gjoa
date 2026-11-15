import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { sh } from '../prep/sh.js';
import { build_doc } from './claims.js';

const REPO = process.cwd();

const REL = "browser/components/newtab/AboutNewTabRedirector.sys.mjs";

const ANCHORS = [{class: "AboutNewTabRedirectorParent", method: "newChannel"}, {class: "AboutNewTabRedirectorChild", method: "newChannel"}];

const OUT = join(REPO, "patches", "0003-newtab-redirector-gjoa.claims.json");

const FF_SRC = join(process.env.HOME, "code", "resources", "firefox");

const TMP = "/tmp/gjoa-gen";

function main_bang() {
  const v = JSON.parse(readFileSync(join(REPO, "gjoa.json"), "utf8")).firefox.version;
  const tag = ("".concat("FIREFOX_", v.replaceAll(".", "_"), "_RELEASE"));
  const dir = join(TMP, dirname(REL));
  sh(("".concat("rm -rf ", TMP, " && mkdir -p ", dir)), null);
  sh(("".concat("git -C ", FF_SRC, " show ", tag, ":", REL, " > ", join(TMP, "pristine.mjs"))), null);
  sh(("".concat("cp ", join(TMP, "pristine.mjs"), " ", join(TMP, REL))), null);
  sh(("".concat("cd ", TMP, " && patch -p1 < ", join(REPO, "patches", "0003-newtab-redirector-gjoa.patch"))), null);
  const patched = readFileSync(join(TMP, REL), "utf8");
  const pristine = readFileSync(join(TMP, "pristine.mjs"), "utf8");
  const edits = build_doc(patched, pristine, ANCHORS);
  const artifact = {file: REL, edits: edits};
  writeFileSync(OUT, ("".concat(JSON.stringify(artifact, null, 2), "\n")));
  return console.error(("".concat("wrote ", OUT, "  (", edits.length, " set-body verbs, anchored @ ", tag, ")")));
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
