import { spawn } from 'child_process';
import * as $beagle$import$fs from 'fs';
import * as $beagle$import$os from 'os';
import * as $beagle$import$path from 'path';
import { connect_marionette_bang } from '../test-driver/marionette.js';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

const RAF_JS = "const d=arguments[arguments.length-1];requestAnimationFrame(()=>requestAnimationFrame(()=>d(true)));";

function make_profile_bang() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gjoa-dmregress-"));
  const mode = ((_logical) => (_logical !== false && _logical != null ? _logical : "dark"))($$bc$get(process.env, "GJOA_DM_MODE"));
  const enabled = (($$bc$equiv(mode, "off")) ? "false" : "true");
  const normpref = (($$bc$equiv($$bc$get(process.env, "GJOA_DM_NORMALIZE_PREF"), "0")) ? "false" : "true");
  const nova = ((_logical) => (_logical !== false && _logical != null ? _logical : "false"))($$bc$get(process.env, "GJOA_DM_NOVA"));
  const verify = ($$bc$equiv($$bc$get(process.env, "GJOA_DM_NORMALIZE_PREF"), "1"));
  fs.writeFileSync(path.join(dir, "prefs.js"), ("".concat("user_pref(\"marionette.port\", 2828);\n", "user_pref(\"marionette.enabled\", true);\n", "user_pref(\"gjoa.darkmode.enabled\", ", enabled, ");\n", "user_pref(\"gjoa.darkmode.mode\", \"", mode, "\");\n", "user_pref(\"gjoa.darkmode.normalize.enabled\", ", normpref, ");\n", "user_pref(\"browser.nova.enabled\", ", (($$bc$equiv(nova, "1")) ? "true" : "false"), ");\n", (verify ? ("".concat("user_pref(\"gjoa.darkmode.force\", true);\n", "user_pref(\"gjoa.darkmode.invert.enabled\", true);\n", "user_pref(\"layout.css.prefers-color-scheme.content-override\", 1);\n", "user_pref(\"gjoa.darkmode.normalize.logms\", true);\n", "user_pref(\"browser.dom.window.dump.enabled\", true);\n")) : ""))));
  return dir;
}

function host_of(url) {
  return (() => { try {
    return new URL(url).hostname;
  } catch (e) {
    return "site";
  } })();
}

function sleep_bang(ms) {
  return new Promise((res, __rej) => setTimeout(res, ms));
}

function parse_normalizer_timings(dumplog) {
  const text = (() => { try {
    return fs.readFileSync(dumplog, "utf8");
  } catch (e) {
    return "";
  } })();
  const timings = [];
  text.split("\n").forEach((ln) => {
  if (((_truthy) => _truthy !== false && _truthy != null)(ln.startsWith("GJOA_NORMALIZE_MS"))) {
    const p = ln.split("\t");
    if ((p.length >= 3)) {
      timings.push({url: p[1], ms: parseInt(p[2].replace("ms=", ""), 10), detail: p.slice(3).join(" ")});
    }
  }
});
  return timings;
}

async function safe_shot(client) {
  return (async () => { try {
    return await client.takeScreenshot();
  } catch (e) {
    return null;
  } })();
}

async function safe_nav_bang(client, url) {
  return (async () => { try {
    await client.navigate(url);
  return null;
  } catch (e) {
    return ((_logical) => (_logical !== false && _logical != null ? _logical : ("".concat(e))))(e.message);
  } })();
}

async function normalize_pass_bang(client, meta, threshold, refresh_js, snap_js, apply_js, normalize_p, correctives, pre_fails) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(normalize_p)) || ($$bc$equiv(correctives.length, 0))))) {
    return pre_fails;
  } else {
    const __c = await client.setContext("content");
    const __ap = await client.executeScript(apply_js, [correctives]);
    const __raf = await client.executeAsyncScript(RAF_JS, []);
    const fresh = await client.executeScript(refresh_js, []);
    const __c2 = await client.setContext("chrome");
    const res2 = await client.executeAsyncScript(snap_js, [fresh, threshold, false]);
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (((_logical) => (_logical !== false && _logical != null ? _logical : 0))(res2.total) > 0) : _logical))($$bc$get(process.env, "GJOA_DM_DEBUG")))) {
      console.error(("".concat("  residual ", res2.total, ": ", JSON.stringify(((_logical) => (_logical !== false && _logical != null ? _logical : []))(res2.fails).slice(0, 6)))));
    }
    return ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(res2.total);
  }
}

async function process_site_bang(client, url, threshold, rects_js, refresh_js, snap_js, apply_js, normalize_p, preinvert_p, outdir) {
  const host = host_of(url);
  return (async () => { try {
    const __c0 = await client.setContext("content");
  const navwarn = await safe_nav_bang(client, url);
  const __raf = await client.executeAsyncScript(RAF_JS, []);
  const meta = await client.executeScript(rects_js, []);
  const __c2 = await client.setContext("chrome");
  const res = await client.executeAsyncScript(snap_js, [meta, threshold, normalize_p, preinvert_p]);
  const pre_fails = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(res.total);
  const correctives = ((_logical) => (_logical !== false && _logical != null ? _logical : []))(res.correctives);
  const post_fails = await normalize_pass_bang(client, meta, threshold, refresh_js, snap_js, apply_js, normalize_p, correctives, pre_fails);
  const shot = await safe_shot(client);
  if (((_truthy) => _truthy !== false && _truthy != null)(shot)) {
    fs.writeFileSync(path.join(outdir, ("".concat(host, ".png"))), shot, {encoding: "base64"});
  }
  return {url: url, host: host, checked: ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(res.checked), fails: pre_fails, postFails: post_fails, applied: correctives.length, halation: ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(res.halationCount), painted: ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(res.paintedFailCount), worst: ((_logical) => (_logical !== false && _logical != null ? _logical : []))(res.fails), err: ((_logical) => (_logical !== false && _logical != null ? _logical : null))(res.err), navwarn: navwarn};
  } catch (e) {
    return {url: url, host: host, checked: 0, fails: 0, postFails: 0, applied: 0, worst: [], err: ((_logical) => (_logical !== false && _logical != null ? _logical : ("".concat(e))))(e.message)};
  } })();
}

async function run_bang() {
  const bin = ((_logical) => (_logical !== false && _logical != null ? _logical : $$bc$get(process.env, "GJOA_BIN")))(process.argv[2]);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(bin))) {
    console.error("usage: runner <gjoa-bin>");
    process.exit(2);
  }
  const corpus = JSON.parse(fs.readFileSync(((_logical) => (_logical !== false && _logical != null ? _logical : "tools/darkmode-regress/corpus.json"))($$bc$get(process.env, "GJOA_DM_CORPUS")), "utf8"));
  const threshold = ((_logical) => (_logical !== false && _logical != null ? _logical : 45))(corpus.threshold);
  const sites = corpus.sites;
  const rects_js = fs.readFileSync("tools/darkmode-regress/rects.js", "utf8");
  const colormath_js = fs.readFileSync("tools/darkmode-regress/colormath.cjs", "utf8");
  const snap_js = ("".concat(colormath_js, "\n", fs.readFileSync("tools/darkmode-regress/snap.js", "utf8")));
  const apply_js = fs.readFileSync("tools/darkmode-regress/apply-correctives.js", "utf8");
  const refresh_js = fs.readFileSync("tools/darkmode-regress/refresh.js", "utf8");
  const normalize_p = ($$bc$equiv($$bc$get(process.env, "GJOA_DM_NORMALIZE"), "1"));
  const preinvert_p = ($$bc$equiv($$bc$get(process.env, "GJOA_DM_PREINVERT"), "1"));
  const outdir = "dist/darkmode-regress";
  const __mk = fs.mkdirSync(outdir, {recursive: true});
  const profile = make_profile_bang();
  const dumplog = path.join(outdir, "normalize-dump.log");
  const logfd = fs.openSync(dumplog, "w");
  const child = spawn(bin, ["--profile", profile, "--marionette", "--no-remote", "--remote-allow-system-access", "--headless"], {stdio: ["ignore", logfd, "ignore"], env: Object.assign({}, process.env, {["GJOA_ALLOW_INSECURE"]: "1", ["MOZ_HEADLESS"]: "1"})});
  const client = await connect_marionette_bang({connectTimeoutMs: 60000});
  const __ses = await client.newSession({pageLoadStrategy: "eager"});
  const __to = await client.setTimeouts({pageLoad: 30000, script: 30000});
  const results = [];
  for (const site of sites) {
  const r = await process_site_bang(client, site.url, threshold, rects_js, refresh_js, snap_js, apply_js, normalize_p, preinvert_p, outdir);
  const eff = (normalize_p ? r.postFails : r.fails);
  results.push(r);
  console.log(("".concat((((_truthy) => _truthy !== false && _truthy != null)(r.err) ? "ERR  " : (($$bc$equiv(eff, 0)) ? "PASS " : "FAIL ")), r.host, "  ", (((_truthy) => _truthy !== false && _truthy != null)(r.err) ? r.err : (normalize_p ? ("".concat("(", r.checked, " els, ", r.fails, "->", r.postFails, " after ", r.applied, " fixes)")) : ("".concat("(", r.checked, " text els, ", r.fails, " low-contrast)")))))));
};
  const fail_of = (r) => (normalize_p ? r.postFails : r.fails);
  const failed = results.filter((r) => (fail_of(r) > 0));
  const errored = results.filter((r) => r.err);
  console.log(("".concat("\n=== ", failed.length, "/", results.length, " sites with low-contrast text", (normalize_p ? " (AFTER normalization)" : ""), "  (", errored.length, " errored) ===")));
  await client.quit(["eAttemptQuit"]);
  client.disconnect();
  if (((_truthy) => _truthy !== false && _truthy != null)(child)) {
    child.kill();
  }
  const verify_p = ($$bc$equiv($$bc$get(process.env, "GJOA_DM_NORMALIZE_PREF"), "1"));
  const __settle = (verify_p ? (async () => { return await sleep_bang(800); })() : null);
  const t1 = (verify_p ? parse_normalizer_timings(dumplog) : []);
  const __settle2 = (((_truthy) => _truthy !== false && _truthy != null)((verify_p && ($$bc$equiv(t1.length, 0)))) ? (async () => { return await sleep_bang(2500); })() : null);
  const norm_timings = (((_truthy) => _truthy !== false && _truthy != null)((verify_p && ($$bc$equiv(t1.length, 0)))) ? parse_normalizer_timings(dumplog) : t1);
  if ((norm_timings.length > 0)) {
    const mss = norm_timings.map((t) => t.ms);
    const tot = mss.reduce((a, b) => (a + b), 0);
    console.log(("".concat("normalizer: ", norm_timings.length, " passes measured, ", "mean ", (() => { const pass_count = norm_timings.length; return Math.round((tot / pass_count)); })(), "ms")));
  }
  fs.writeFileSync(path.join(outdir, "report.json"), JSON.stringify({threshold: threshold, normalize: normalize_p, results: results, normalizeTimings: norm_timings}, null, 2));
  console.log(("".concat("report: ", outdir, "/report.json  + per-site PNGs in ", outdir, "/")));
  return process.exit(((failed.length > 0) ? 1 : 0));
}

run_bang().catch((e) => { console.error(("".concat("regress failed: ", ((_logical) => (_logical !== false && _logical != null ? _logical : e))(e.stack))));
return process.exit(1); });
