import { spawn } from 'child_process';
import * as $beagle$import$fs from 'fs';
import * as $beagle$import$os from 'os';
import * as $beagle$import$path from 'path';
import { connect_marionette_bang } from '../test-driver/marionette.js';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

const RAF_JS = "const d=arguments[arguments.length-1];requestAnimationFrame(()=>requestAnimationFrame(()=>d(true)));";

const SETTLE_JS = ("".concat("const d=arguments[arguments.length-1];const t0=Date.now();", "(function poll(){const de=document.documentElement;", "if(de&&de.hasAttribute('data-gjoa-normalized')){return d(true);}", "if(Date.now()-t0>6000){return d(false);}", "requestAnimationFrame(()=>requestAnimationFrame(poll));})();"));

function host_of(url) {
  return (() => { try {
    return new URL(url).hostname;
  } catch (e) {
    return "site";
  } })();
}

function slug_of(url) {
  const s = url.replace(new RegExp("^https?://", ""), "").replace(new RegExp("[^a-zA-Z0-9]+", "g"), "_");
  return s.slice(0, 90);
}

function make_profile_bang(port, enabled_p) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gjoa-darkcheck-"));
  const en = (((_truthy) => _truthy !== false && _truthy != null)(enabled_p) ? "true" : "false");
  const mode = (((_truthy) => _truthy !== false && _truthy != null)(enabled_p) ? "dark" : "off");
  const scheme = (((_truthy) => _truthy !== false && _truthy != null)(enabled_p) ? "" : "user_pref(\"layout.css.prefers-color-scheme.content-override\", 1);\n");
  fs.writeFileSync(path.join(dir, "prefs.js"), ("".concat("user_pref(\"marionette.port\", ", port, ");\n", "user_pref(\"marionette.enabled\", true);\n", "user_pref(\"gjoa.darkmode.enabled\", ", en, ");\n", "user_pref(\"gjoa.darkmode.mode\", \"", mode, "\");\n", "user_pref(\"gjoa.darkmode.normalize.enabled\", ", en, ");\n", scheme)));
  return dir;
}

async function safe_nav_bang(client, url) {
  return (async () => { try {
    await client.navigate(url);
  return null;
  } catch (e) {
    return ((_logical) => (_logical !== false && _logical != null ? _logical : ("".concat(e))))(e.message);
  } })();
}

async function safe_shot(client) {
  return (async () => { try {
    return await client.takeScreenshot();
  } catch (e) {
    return null;
  } })();
}

async function collect_site_bang(client, url, collect_js) {
  const __c0 = await client.setContext("content");
  const navwarn = await safe_nav_bang(client, url);
  const __raf = await client.executeAsyncScript(RAF_JS, []);
  const __settle = await client.executeAsyncScript(SETTLE_JS, []);
  const meta = await client.executeScript(collect_js, []);
  return {meta: meta, navwarn: navwarn};
}

async function with_arm_bang(bin, port, enabled_p, sites, f) {
  const profile = make_profile_bang(port, enabled_p);
  const child = spawn(bin, ["--profile", profile, "--marionette", "--no-remote", "--remote-allow-system-access", "--headless"], {stdio: ["ignore", "ignore", "ignore"], env: Object.assign({}, process.env, {["GJOA_ALLOW_INSECURE"]: "1", ["MOZ_HEADLESS"]: "1"})});
  const client = await connect_marionette_bang({port: port, connectTimeoutMs: 60000});
  const __ses = await client.newSession({pageLoadStrategy: "eager"});
  const __to = await client.setTimeouts({pageLoad: 30000, script: 30000});
  const results = [];
  for (const site of sites) {
  const r = await f(client, site);
  results.push(r);
};
  await client.quit(["eAttemptQuit"]);
  client.disconnect();
  if (((_truthy) => _truthy !== false && _truthy != null)(child)) {
    child.kill();
  }
  return results;
}

async function run_bang() {
  const bin = ((_logical) => (_logical !== false && _logical != null ? _logical : $$bc$get(process.env, "GJOA_BIN")))(process.argv[2]);
  if ((!((_truthy) => _truthy !== false && _truthy != null)(bin))) {
    console.error("usage: darkcheck-runner <gjoa-bin>");
    process.exit(2);
  }
  const corpus = JSON.parse(fs.readFileSync(((_logical) => (_logical !== false && _logical != null ? _logical : "tools/darkmode-regress/corpus.json"))($$bc$get(process.env, "GJOA_DM_CORPUS")), "utf8"));
  const sites = corpus.sites;
  const colormath_js = fs.readFileSync("tools/darkmode-regress/colormath.cjs", "utf8");
  const collect_js = fs.readFileSync("tools/darkmode-regress/darkcheck-collect.js", "utf8");
  const audit_js = ("".concat(colormath_js, "\n", fs.readFileSync("tools/darkmode-regress/darkcheck-audit.js", "utf8")));
  const cfg = ((_logical) => (_logical !== false && _logical != null ? _logical : {}))(corpus.config);
  const port = (() => { const n = parseInt(((_logical) => (_logical !== false && _logical != null ? _logical : "3838"))($$bc$get(process.env, "GJOA_DC_PORT")), 10); return (((_truthy) => _truthy !== false && _truthy != null)(((typeof n === 'number') && ((_logical) => (_logical !== false && _logical != null ? ((n > 0) && (n < 65535)) : _logical))(Number.isInteger(n)))) ? Math.trunc(n) : 3838); })();
  const outdir = ((_logical) => (_logical !== false && _logical != null ? _logical : "dist/darkcheck"))($$bc$get(process.env, "GJOA_DC_OUT"));
  const __mk = fs.mkdirSync(outdir, {recursive: true});
  const __lA = console.log("=== arm A: authored (dark-mode OFF) ===");
  const authored = await with_arm_bang(bin, port, false, sites, async (client, site) => (async () => { try {
    const c = await collect_site_bang(client, site.url, collect_js);
  const m = c.meta;
  return {url: site.url, rootBgL: ((_logical) => (_logical !== false && _logical != null ? _logical : 255))(m.rootBgL), colorSchemeDark: m.colorSchemeDark, els: ((_logical) => (_logical !== false && _logical != null ? _logical : []))(m.els)};
  } catch (e) {
    return {url: site.url, rootBgL: 255, colorSchemeDark: false, els: [], err: ((_logical) => (_logical !== false && _logical != null ? _logical : ("".concat(e))))(e.message)};
  } })());
  const find_authored = (url) => authored.find((a) => ($$bc$equiv(a.url, url)));
  const __lB = console.log("\n=== arm B: rendered + audit (dark-mode ON) ===");
  const results = await with_arm_bang(bin, (port + 1), true, sites, async (client, site) => { const url = site.url;
const host = host_of(url);
const slug = slug_of(url);
return (async () => { try {
    const c = await collect_site_bang(client, url, collect_js);
  const meta = c.meta;
  const navwarn = c.navwarn;
  const auth = find_authored(url);
  const __c2 = await client.setContext("chrome");
  const res = await client.executeAsyncScript(audit_js, [meta, cfg, auth]);
  const shot = await safe_shot(client);
  if (((_truthy) => _truthy !== false && _truthy != null)(shot)) {
    fs.writeFileSync(path.join(outdir, ("".concat(slug, ".png"))), shot, {encoding: "base64"});
  }
  fs.writeFileSync(path.join(outdir, ("".concat(slug, "-rects.json"))), JSON.stringify(((_logical) => (_logical !== false && _logical != null ? _logical : []))(meta.replaced), null, 0));
  if (((_truthy) => _truthy !== false && _truthy != null)(res.err)) {
    return {url: url, host: host, slug: slug, err: res.err, navwarn: navwarn};
  } else {
    const rules = ((_logical) => (_logical !== false && _logical != null ? _logical : []))(res.rules);
    const status = ((_logical) => (_logical !== false && _logical != null ? _logical : "audited"))(res.status);
    const fails = rules.filter((r) => ((!((_truthy) => _truthy !== false && _truthy != null)(r.pass)) && (!((_truthy) => _truthy !== false && _truthy != null)(r.advisory))));
    const indet = ($$bc$equiv(status, "indeterminate"));
    const rec = {url: url, host: host, slug: slug, rules: rules, stats: res.stats, status: status, tag: site.tag, expect: ((_logical) => (_logical !== false && _logical != null ? _logical : []))(site.expect), failedRules: fails.map((r) => r.rule), pass: ((!indet) && ($$bc$equiv(fails.length, 0))), navwarn: navwarn};
    fs.writeFileSync(path.join(outdir, ("".concat(slug, ".json"))), JSON.stringify(rec, null, 2));
    return rec;
  }
  } catch (e) {
    return {url: url, host: host, slug: slug, err: ((_logical) => (_logical !== false && _logical != null ? _logical : ("".concat(e))))(e.message)};
  } })(); });
  results.forEach((r) => {
  console.log(("".concat(((((_truthy) => _truthy !== false && _truthy != null)(r.err)) ? "ERR  " : (($$bc$equiv(r.status, "indeterminate"))) ? "QUAR " : (((_truthy) => _truthy !== false && _truthy != null)(r.pass)) ? "PASS " : "FAIL "), r.slug, "  ", (((_truthy) => _truthy !== false && _truthy != null)(r.err) ? r.err : ("".concat("[", ((_logical) => (_logical !== false && _logical != null ? _logical : []))(r.failedRules).join(","), "]", " (", r.tag, " expect=", ((_logical) => (_logical !== false && _logical != null ? _logical : []))(r.expect).join(","), ")", " els=", r.stats.textEls, " native=", r.stats.nativeDark))))));
});
  const ruleKeys = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"];
  const fails_for = (k) => results.filter((r) => ((_logical) => (_logical !== false && _logical != null ? r.rules.some((x) => (($$bc$equiv(x.rule, k)) && ((!((_truthy) => _truthy !== false && _truthy != null)(x.pass)) && (!((_truthy) => _truthy !== false && _truthy != null)(x.advisory))))) : _logical))(r.rules));
  const perRule = ruleKeys.map((k) => { const pgs = fails_for(k);
return {rule: k, count: pgs.length, failPages: pgs.map((r) => r.slug)}; });
  const failedPages = results.filter((r) => ((!((_truthy) => _truthy !== false && _truthy != null)(r.err)) && ((!($$bc$equiv(r.status, "indeterminate"))) && (!((_truthy) => _truthy !== false && _truthy != null)(r.pass)))));
  const quarantined = results.filter((r) => ($$bc$equiv(r.status, "indeterminate")));
  const errored = results.filter((r) => r.err);
  console.log(("".concat("\n=== DARKCHECK: ", failedPages.length, "/", results.length, " pages FAIL A-rules · ", quarantined.length, " quarantined · ", errored.length, " errored ===")));
  perRule.forEach((pr) => {
  if ((pr.count > 0)) {
    console.log(("".concat("  ", pr.rule, " fails on ", pr.count, " pages: ", pr.failPages.join(" "))));
  }
});
  const quarantined_count = quarantined.length;
  const result_count = results.length;
  const qfrac = (quarantined_count / Math.max(1, result_count));
  fs.writeFileSync(path.join(outdir, "rollup.json"), JSON.stringify({total: results.length, failedPages: failedPages.length, quarantined: quarantined.length, quarantineFraction: qfrac, errored: errored.length, perRule: perRule, config: cfg, pages: results.map((r) => { const st = r.stats;
return {slug: r.slug, url: r.url, tag: r.tag, expect: ((_logical) => (_logical !== false && _logical != null ? _logical : []))(r.expect), status: ((_logical) => (_logical !== false && _logical != null ? _logical : "err"))(r.status), pass: (((_truthy) => _truthy !== false && _truthy != null)(r.err) ? false : r.pass), failedRules: ((_logical) => (_logical !== false && _logical != null ? _logical : []))(r.failedRules), err: ((_logical) => (_logical !== false && _logical != null ? _logical : null))(r.err), bodyLcDist: ((_logical) => (_logical !== false && _logical != null ? st.bodyLcDist : _logical))(st), a1WarnCount: ((_logical) => (_logical !== false && _logical != null ? st.a1WarnCount : _logical))(st), a1p10: ((_logical) => (_logical !== false && _logical != null ? st.a1p10 : _logical))(st), a1p50: ((_logical) => (_logical !== false && _logical != null ? st.a1p50 : _logical))(st), a5MatchTotal: ((_logical) => (_logical !== false && _logical != null ? st.a5MatchTotal : _logical))(st), a5MatchHit: ((_logical) => (_logical !== false && _logical != null ? st.a5MatchHit : _logical))(st)}; })}, null, 2));
  console.log(("".concat("rollup: ", outdir, "/rollup.json")));
  return process.exit(((failedPages.length > 0) ? 1 : 0));
}

run_bang().catch((e) => { console.error(("".concat("darkcheck failed: ", ((_logical) => (_logical !== false && _logical != null ? _logical : e))(e.stack))));
return process.exit(1); });
