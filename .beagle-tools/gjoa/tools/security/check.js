import { readFile } from 'fs/promises';
import { join } from 'path';
import { REPO_ROOT } from '../prep/paths.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const PRODUCT_DETAILS_URL = "https://product-details.mozilla.org/1.0/firefox_versions.json";

const KNOWN_VULNS_URL = "https://www.mozilla.org/en-US/security/known-vulnerabilities/firefox/";

function parseVersion(v) {
  const cleaned = v.replace(new RegExp("esr$", "i"), "").trim();
  const parts = cleaned.split(".").map((x) => ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(parseInt(x, 10)));
  return [((_logical) => (_logical !== false && _logical != null ? _logical : 0))(parts[0]), ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(parts[1]), ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(parts[2])];
}

function cmpVersion(a, b) {
  return (() => { let i = 0; while (true) {
    if ((i >= 3)) { return 0; } else { if ((!($$bc$equiv(a[i], b[i])))) { return ((a[i] < b[i]) ? -1 : 1); } else { const _recur_0 = (i + 1); i = _recur_0; continue; } }
  } })();
}

async function fetchVersions() {
  const r = await fetch(PRODUCT_DETAILS_URL, {signal: AbortSignal.timeout(10000)});
  if ((!((_truthy) => _truthy !== false && _truthy != null)(r.ok))) {
    (() => { throw new Error(("".concat("product-details HTTP ", r.status))); })();
  } else {
    null;
  }
  return await r.json();
}

async function fetchAdvisories_bang() {
  const r = await fetch(KNOWN_VULNS_URL, {signal: AbortSignal.timeout(10000)});
  if ((!((_truthy) => _truthy !== false && _truthy != null)(r.ok))) {
    (() => { throw new Error(("".concat("known-vulns HTTP ", r.status))); })();
  } else {
    null;
  }
  const html = await r.text();
  const sectionRe = new RegExp("<h3 id=\"firefox([0-9.]+(?:esr)?)\"[^>]*>[\\s\\S]*?Fixed in Firefox ([0-9.]+(?:esr)?)\\s*</a>\\s*</h3>([\\s\\S]*?)(?=<h3 id=\"firefox|</main|<footer|$)", "g");
  const advRe = new RegExp("<a href=\"(/en-US/security/advisories/mfsa(\\d{4}-\\d+)/?)\"[^>]*>\\s*<span class=\"level ([a-z]+)\">[^<]*</span>([^<]*)</a>", "g");
  const out = [];
  (() => {  while (true) {
    const sm = sectionRe.exec(html); if (((_truthy) => _truthy !== false && _truthy != null)(sm)) { (() => { const version = sm[2]; const sectionBody = sm[3]; (advRe.lastIndex = 0);
return (() => {  while (true) {
    const am = advRe.exec(sectionBody); if (((_truthy) => _truthy !== false && _truthy != null)(am)) {  const path = am[1]; const slug = ("".concat("mfsa", am[2])); const severity = am[3]; const title = am[4].trim(); out.push({id: slug, title: ((_logical) => (_logical !== false && _logical != null ? _logical : ("".concat("Security advisory ", slug))))(title), link: ("".concat("https://www.mozilla.org", path)), severity: severity, affectsVersion: version, published: "", description: ""});  continue; } else { return null; }
  } })(); })();  continue; } else { return null; }
  } })();
  return out;
}

function advisoryAffectsOurPin(entry, pinned) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(entry.affectsVersion))) {
    return false;
  } else {
    if (((_truthy) => _truthy !== false && _truthy != null)(entry.affectsVersion.endsWith("esr"))) {
      return false;
    } else {
      const v = parseVersion(entry.affectsVersion);
      return (cmpVersion(v, pinned) > 0);
    }
  }
}

function isInTheWild(entry) {
  const text = ("".concat(entry.title, " ", entry.description)).toLowerCase();
  return (($$bc$equiv(entry.severity, "critical")) || ((_logical) => (_logical !== false && _logical != null ? _logical : new RegExp("actively\\s+exploited").test(text)))(new RegExp("(exploit|exploited)\\s+in\\s+the\\s+wild").test(text)));
}

function classify(pinnedTuple, latestTuple, advisories, inTheWild) {
  return (((inTheWild.length > 0)) ? {status: "CRITICAL", summary: ("".concat(inTheWild.length, " in-the-wild CVE(s) unaddressed"))} : (() => { const latest_major = latestTuple[0]; const pinned_major = pinnedTuple[0]; const majorDelta = (latest_major - pinned_major); return (((majorDelta >= 2)) ? {status: "CRITICAL", summary: ("".concat(majorDelta, " major versions behind"))} : (() => { const cmp = cmpVersion(pinnedTuple, latestTuple); return ((($$bc$equiv(cmp, 0))) ? {status: "OK", summary: ("".concat("at latest stable (", latestTuple.join("."), ")"))} : ((cmp > 0)) ? {status: "OK", summary: ("".concat("ahead of latest stable (", latestTuple.join("."), ")"))} : {status: "STALE", summary: ("".concat(((majorDelta > 0) ? ("".concat(majorDelta, " major(s)")) : "point release"), " behind", (((_truthy) => _truthy !== false && _truthy != null)(advisories.length) ? ("".concat("; ", advisories.length, " advisor", (($$bc$equiv(advisories.length, 1)) ? "y" : "ies"))) : "")))}); })()); })());
}

export async function check_bang() {
  const gjoaJsonPath = join(REPO_ROOT, "gjoa.json");
  const gjoaJson = JSON.parse(await readFile(gjoaJsonPath, "utf8"));
  const pinned = gjoaJson.firefox.version;
  const pinnedTuple = parseVersion(pinned);
  const state = {versions: null, advisories: [], netError: null};
  await (async () => { try {
    return (state.versions = await fetchVersions());
  } catch (e) {
    return (state.netError = ("".concat("version probe failed: ", e.message)));
  } })();
  if (((_truthy) => _truthy !== false && _truthy != null)(state.versions)) {
    await (async () => { try {
    return (state.advisories = await fetchAdvisories_bang());
  } catch (e) {
    return (state.netError = ("".concat("advisory probe failed: ", e.message)));
  } })();
  }
  const versions = state.versions;
  const advisories = state.advisories;
  const netError = state.netError;
  if ((!((_truthy) => _truthy !== false && _truthy != null)(versions))) {
    return {pinned: pinned, latest: null, esr: null, majorDelta: 0, patchDelta: null, advisories: [], inTheWild: [], status: "UNKNOWN", summary: "could not verify — network probe failed", detail: ("".concat("Pinned: ", pinned, "\nCould not reach Mozilla product-details (", netError, ").\nRe-run on a working network to verify.")), unverified: netError};
  } else {
    const latest = versions.LATEST_FIREFOX_VERSION;
    const esr = versions.FIREFOX_ESR;
    const latestTuple = parseVersion(latest);
    const matchedAdvisories = advisories.filter((a) => advisoryAffectsOurPin(a, pinnedTuple));
    const inTheWild = matchedAdvisories.filter(isInTheWild);
    const result = classify(pinnedTuple, latestTuple, matchedAdvisories, inTheWild);
    const status = result.status;
    const summary = result.summary;
    const detailLines = [("".concat("Pinned:        ", pinned)), ("".concat("Latest stable: ", latest)), ("".concat("ESR track:     ", esr))];
    if ((matchedAdvisories.length > 0)) {
      detailLines.push("");
      detailLines.push(("".concat("Unfixed advisories on your pin (", matchedAdvisories.length, "):")));
      const sevRank = {critical: 0, high: 1, moderate: 2, low: 3};
      const sorted = Array.from(matchedAdvisories).sort((a, b) => { const sa = (() => { const r = sevRank[((_logical) => (_logical !== false && _logical != null ? _logical : "low"))(a.severity)]; return (($$bc$equiv(r, undefined)) ? 4 : r); })();
const sb = (() => { const r = sevRank[((_logical) => (_logical !== false && _logical != null ? _logical : "low"))(b.severity)]; return (($$bc$equiv(r, undefined)) ? 4 : r); })();
return ((!(sa === sb)) ? (sa - sb) : ((a.id < b.id) ? 1 : -1)); });
      sorted.slice(0, 8).forEach((a) => {
  const sev = ((_logical) => (_logical !== false && _logical != null ? _logical : "?"))(a.severity).padEnd(8);
  const wild = (((_truthy) => _truthy !== false && _truthy != null)(isInTheWild(a)) ? "  [in-the-wild]" : "");
  detailLines.push(("".concat("  [", sev, "] ", a.id, "  fixes Firefox ", a.affectsVersion, wild)));
});
      if ((sorted.length > 8)) {
        const advisory_count = sorted.length;
        detailLines.push(("".concat("  ... and ", (advisory_count - 8), " more")));
      }
      detailLines.push("");
      detailLines.push("Details: https://www.mozilla.org/en-US/security/known-vulnerabilities/firefox/");
    }
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? versions : _logical))(netError))) {
      detailLines.push("");
      detailLines.push(("".concat("Note: ", netError)));
    }
    const latest_major = latestTuple[0];
    const pinned_major = pinnedTuple[0];
    const majorDelta = (latest_major - pinned_major);
    const patchDelta = (($$bc$equiv(majorDelta, 0)) ? cmpVersion(pinnedTuple, latestTuple) : null);
    const base = {pinned: pinned, latest: latest, esr: esr, majorDelta: majorDelta, patchDelta: patchDelta, advisories: matchedAdvisories, inTheWild: inTheWild, status: status, summary: summary, detail: detailLines.join("\n")};
    if (((_truthy) => _truthy !== false && _truthy != null)(netError)) {
      (base.unverified = netError);
    }
    return base;
  }
}

function statusColor(status) {
  return ((($$bc$equiv(status, "OK"))) ? "\x1b[32m" : (($$bc$equiv(status, "STALE"))) ? "\x1b[33m" : (($$bc$equiv(status, "CRITICAL"))) ? "\x1b[31m" : "\x1b[36m");
}

function exitCodeFor(status) {
  return ((($$bc$equiv(status, "OK"))) ? 0 : (($$bc$equiv(status, "STALE"))) ? 2 : (($$bc$equiv(status, "CRITICAL"))) ? 3 : 1);
}

async function main_bang() {
  const jsonMode = process.argv.includes("--json");
  const quietMode = process.argv.includes("--quiet");
  const r = await check_bang();
  if (jsonMode) {
    console.log(JSON.stringify(r, null, 2));
  } else if ((!quietMode)) {
    const color = statusColor(r.status);
    const reset = "\x1b[0m";
    console.error(("".concat(color, "[security] ", r.status, reset, " — ", r.summary)));
    console.error(r.detail);
  }
  return process.exit(exitCodeFor(r.status));
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang().catch((err) => { console.error(("".concat("[security] check threw: ", err.message)));
return process.exit(1); });
}
