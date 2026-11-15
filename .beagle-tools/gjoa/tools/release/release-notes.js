import { readFileSync, existsSync } from 'fs';
import { sh } from '../prep/sh.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const PLACEHOLDER = "Draft assembled by CI";

const SECTIONS = [["feat", "Features"], ["harden", "Security & hardening"], ["fix", "Fixes"], ["perf", "Performance"], ["refactor", "Refactors"], ["revert", "Reverts"], ["build", "Build"], ["docs", "Docs"], ["chore", "Chores"]];

function known_type_p(ty) {
  return SECTIONS.some((s) => ($$bc$equiv(s[0], ty)));
}

function last_tag() {
  return sh("git tag --list 'v*' --sort=-v:refname | head -1", {quiet: true}).trim();
}

function parse_subject(s) {
  const m = s.match(new RegExp("^([a-z]+)(?:\\(([^)]+)\\))?!?:\\s*(.+?)(?:\\s*\\(#([0-9]+)\\))?$"));
  return ((!((_truthy) => _truthy !== false && _truthy != null)(m)) ? {type: "other", scope: null, subject: s.trim(), pr: null} : {type: m[1], scope: m[2], subject: m[3], pr: m[4]});
}

function fmt_row(p) {
  return ("".concat("- ", (((_truthy) => _truthy !== false && _truthy != null)(p.scope) ? ("".concat("**", p.scope, "**: ")) : ""), p.subject, (((_truthy) => _truthy !== false && _truthy != null)(p.pr) ? ("".concat(" (#", p.pr, ")")) : "")));
}

function section_bang(heading, rows) {
  if ((rows.length > 0)) {
    console.log(("".concat("### ", heading)));
    rows.forEach((p) => {
  console.log(fmt_row(p));
});
    return console.log("");
  }
}

function generate_bang(prev, end) {
  const range = ("".concat((($$bc$equiv(prev, "")) ? "" : ("".concat(prev, ".."))), end));
  const raw = sh(("".concat("git log ", range, " --no-merges --pretty=format:%s")), {quiet: true});
  const subjects = raw.split("\n").filter((s) => (s.trim().length > 0));
  const parsed = subjects.map(parse_subject);
  console.log(("".concat("## Changes since ", (($$bc$equiv(prev, "")) ? "the beginning" : prev), "  (", parsed.length, " commits)\n")));
  SECTIONS.forEach((section) => {
  section_bang(section[1], parsed.filter((p) => ($$bc$equiv(p.type, section[0]))));
});
  section_bang("Other", parsed.filter((p) => ((!($$bc$equiv(p.type, "other"))) && (!known_type_p(p.type)))));
  section_bang("Uncategorized (non-conventional commits)", parsed.filter((p) => ($$bc$equiv(p.type, "other"))));
  return console.log("_Generated from the merged commit log — factual changelog, not announcement copy._");
}

function gate_bang(target) {
  const body = (((_truthy) => _truthy !== false && _truthy != null)(existsSync(target)) ? readFileSync(target, "utf8") : target);
  if (((_truthy) => _truthy !== false && _truthy != null)(body.includes(PLACEHOLDER))) {
    console.error(("".concat("release-notes: body still contains the CI placeholder (\"", PLACEHOLDER, "\") — refusing. Generate real notes first.")));
    return process.exit(1);
  } else {
    return console.log("release-notes: OK — no CI placeholder in the body.");
  }
}

function main_bang() {
  const argv = process.argv;
  const cmd = argv[2];
  return ((($$bc$equiv(cmd, "check"))) ? gate_bang(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(argv[3])) : generate_bang(((_logical) => (_logical !== false && _logical != null ? _logical : last_tag()))(cmd), ((_logical) => (_logical !== false && _logical != null ? _logical : "HEAD"))(argv[3])));
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
