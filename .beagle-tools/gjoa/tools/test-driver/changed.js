import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

const REPO_ROOT = process.cwd();

const RUNNER = join(REPO_ROOT, ".beagle-tools", "gjoa", "tools", "test-driver", "runner.js");

const TAGS = join(REPO_ROOT, "tests", "integration", "tags.json");

const INFRA_PREFIXES = ["tools/test-driver/", "tools/chrome-bundle/", "tests/dsl", "tests/integration/marionette", "tests/integration/tags.json"];

function git(args) {
  return (() => { try {
    const r = spawnSync("git", args, {cwd: REPO_ROOT, encoding: "utf8"});
  return (($$bc$equiv(r.status, 0)) ? r.stdout : "");
  } catch (e) {
    return "";
  } })();
}

function lines(s) {
  return ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(s).split("\n").filter((l) => (!($$bc$equiv(l.trim(), ""))));
}

function changed_files() {
  const base = git(["merge-base", "HEAD", "main"]).trim();
  const committed = (($$bc$equiv(base, "")) ? [] : lines(git(["diff", "--name-only", ("".concat(base, "...HEAD"))])));
  const dirty = lines(git(["status", "--porcelain"])).map((l) => l.slice(3).trim());
  const set = new Set();
  committed.forEach((f) => {
  set.add(f);
});
  dirty.forEach((f) => {
  set.add(f);
});
  return Array.from(set);
}

function load_tags() {
  return (((_truthy) => _truthy !== false && _truthy != null)(existsSync(TAGS)) ? (() => { try {
    return JSON.parse(readFileSync(TAGS, "utf8"));
  } catch (e) {
    return {sources: {}};
  } })() : {sources: {}});
}

function infra_p(path) {
  const hit = INFRA_PREFIXES.find((p) => path.startsWith(p));
  return ((_truthy) => _truthy !== false && _truthy != null)(hit);
}

function strip_ext(f) {
  return f.replace(new RegExp("\\.[^.]+$"), "");
}

function resolve_impacted(files, tags) {
  const sources = ((_logical) => (_logical !== false && _logical != null ? _logical : {}))(tags.sources);
  const srcKeys = Object.keys(sources);
  const fileSet = new Set();
  const subSet = new Set();
  const infra = ((_truthy) => _truthy !== false && _truthy != null)(files.some((f) => infra_p(f)));
  files.forEach((f) => {
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? f.endsWith(".bjs") : _logical))(f.startsWith("tests/integration/")))) {
    fileSet.add(strip_ext(f.replace("tests/integration/", "")));
  } else if (infra_p(f)) {
    null;
  } else {
    srcKeys.forEach((k) => {
  if (((_truthy) => _truthy !== false && _truthy != null)(f.startsWith(k))) {
    const v = $$bc$get(sources, k);
    if (((_truthy) => _truthy !== false && _truthy != null)(Array.isArray(v))) {
      v.forEach((s) => {
  subSet.add(s);
});
    } else {
      subSet.add(v);
    }
  }
});
  }
});
  return {files: fileSet, subs: subSet, infra: infra};
}

function run_runner_bang(args) {
  const r = spawnSync("bun", [RUNNER].concat(args), {cwd: REPO_ROOT, stdio: "inherit"});
  return process.exit(((_logical) => (_logical !== false && _logical != null ? _logical : 0))(r.status));
}

function main_bang() {
  const tags = load_tags();
  const files = changed_files();
  const impacted = resolve_impacted(files, tags);
  const fset = impacted.files;
  const sset = impacted.subs;
  return ((((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : (($$bc$equiv(fset.size, 0)) && ($$bc$equiv(sset.size, 0)))))(impacted.infra))) ? (() => { process.stderr.write(("".concat("[changed] ", (((_truthy) => _truthy !== false && _truthy != null)(impacted.infra) ? "shared infra changed → full fast lane\n" : "no impacted subsystem resolved → full fast lane\n"))));
return run_runner_bang(["--exclude-lane", "slow,network"]); })() : (() => { const args = []; if ((fset.size > 0)) {
  args.push("--files");
  args.push(Array.from(fset).join(","));
}
if ((sset.size > 0)) {
  args.push("--subsystem");
  args.push(Array.from(sset).join(","));
}
process.stderr.write(("".concat("[changed] running: ", args.join(" "), "\n")));
return run_runner_bang(args); })());
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
