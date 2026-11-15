
import { equiv, truthy } from "../lib/value.mjs";
const PRODUCT_DETAILS_URL = "https://product-details.mozilla.org/1.0/firefox_versions.json";

const RECHECK_INTERVAL_MS = (60 * 60 * 1000);

const FETCH_TIMEOUT_MS = 8000;

const VERSION_RE = new RegExp("^\\d+(\\.\\d+){0,2}$");

function parse_version(v) {
  const cleaned = v.replace(new RegExp("esr$", "i"), "").trim();
  const parts = cleaned.split(".").map((x) => ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(parseInt(x, 10)));
  return [((_logical) => (_logical !== false && _logical != null ? _logical : 0))(parts[0]), ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(parts[1]), ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(parts[2])];
}

function newer_p(a, b) {
  const av = parse_version(a);
  const bv = parse_version(b);
  return (((!(equiv(bv[0], av[0])))) ? (bv[0] > av[0]) : ((!(equiv(bv[1], av[1])))) ? (bv[1] > av[1]) : ((!(equiv(bv[2], av[2])))) ? (bv[2] > av[2]) : false);
}

function get_env(name) {
  return (() => { try {
    return ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(Services.env.get(name));
  } catch (__e) {
    return "";
  } })();
}

const state = {quitting: false, confirmed_at: 0};

function quit_stale_bang(my_version, latest_version) {
  if ((!truthy(state.quitting))) {
    (state.quitting = true);
    (() => { try {
    const prompt_svc = Services.prompt;
  const w = Services.wm.getMostRecentWindow("navigator:browser");
  return prompt_svc.alert(w, "gjoa is out of date — quitting", ("".concat("This build is Firefox ", my_version, "; the latest stable is ", latest_version, ".\n\n", "Running an out-of-date browser is unsafe. gjoa will now quit.\n\n", "To rebuild against the latest stable:\n", "  bun run security:bump\n", "  bun run import\n", "  nix build .#gjoa --impure   (~30-60 min)\n\n", "Emergency override (one-off, do not habituate):\n", "  GJOA_ALLOW_INSECURE=1 gjoa")));
  } catch (e) {
    return console.error("[security] modal failed; quitting anyway", e);
  } })();
    return (() => { try {
    const startup = Services.startup;
  return startup.quit(startup.eForceQuit);
  } catch (e) {
    return console.error("[security] startup.quit failed", e);
  } })();
  }
}

function probe_bang() {
  const my_version = Services.appinfo.version;
  return fetch(PRODUCT_DETAILS_URL, {signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)}).then((r) => { if ((!truthy(r.ok))) {
  (() => { throw new Error(("".concat("HTTP ", r.status))); })();
}
return r.json(); }).then((j) => { const latest = ((_logical) => (_logical !== false && _logical != null ? _logical : null))(j.LATEST_FIREFOX_VERSION);
return (((!truthy(latest))) ? console.warn("[security] probe response missing LATEST_FIREFOX_VERSION — ignoring") : ((!(VERSION_RE.test(latest)))) ? console.warn(("".concat("[security] probe returned malformed LATEST_FIREFOX_VERSION (", latest, ") — ignoring (expected bare dotted numeric)"))) : (() => { (state.confirmed_at = Date.now());
if ((!newer_p(my_version, latest))) {
  return console.log(("".concat("[security] OK — ", my_version, " matches or exceeds latest stable ", latest)));
} else {
  const my = parse_version(my_version);
  const up = parse_version(latest);
  const up_major = up[0];
  const my_major = my[0];
  const major_behind = (up_major - my_major);
  if ((major_behind >= 1)) {
    console.error(("".concat("[security] CRITICAL: running ", my_version, ", latest is ", latest, " (", major_behind, " major(s) behind) — quitting")));
    return quit_stale_bang(my_version, latest);
  } else {
    return console.warn(("".concat("[security] STALE: running ", my_version, ", latest is ", latest, " (same major, point behind) — gjoa status will show STALE; rebuild when convenient")));
  }
} })()); }).catch((e) => (((state.confirmed_at === 0)) ? console.warn(("".concat("[security] probe failed and has NEVER confirmed current since launch", " — staleness is UNVERIFIED, not known-good (fail-open):")), e.message) : console.log("[security] probe failed — fail-open (offline?, last confirmed current earlier this session):", e.message)));
}

function init__bang() {
  if (((get_env("GJOA_ALLOW_INSECURE") === "1"))) {
    return console.log("[security] GJOA_ALLOW_INSECURE=1 — gate disabled for this process");
  } else {
    if ((!truthy(Services.__gjoaSecurityRunning))) {
      (Services.__gjoaSecurityRunning = true);
      setTimeout(probe_bang, 2000);
      return setInterval(probe_bang, RECHECK_INTERVAL_MS);
    }
  }
}

init__bang();
