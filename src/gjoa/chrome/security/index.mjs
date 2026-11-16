// Out-of-date check: compares this build's Firefox version with Mozilla's
// latest stable release and tells the user when gjoa falls behind.
//
// It only warns. A build one or more major versions behind gets a single
// dialog per session (plus a console error); a point release behind is logged.
// Offline or malformed responses fail open. Set GJOA_ALLOW_INSECURE=1 to
// disable the check entirely.

const PRODUCT_DETAILS_URL = "https://product-details.mozilla.org/1.0/firefox_versions.json";
const RELEASES_URL = "https://github.com/kalix123/gjoa/releases";
const RECHECK_INTERVAL_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const VERSION_RE = /^\d+(\.\d+){0,2}$/;

function parseVersion(v) {
  const parts = v.replace(/esr$/i, "").trim().split(".").map((x) => parseInt(x, 10));
  return [0, 1, 2].map((i) => (Number.isNaN(parts[i]) || parts[i] === undefined ? 0 : parts[i]));
}

// True when version b is newer than version a.
function isNewer(a, b) {
  const av = parseVersion(a);
  const bv = parseVersion(b);
  for (let i = 0; i < 3; i++) {
    if (bv[i] !== av[i]) return bv[i] > av[i];
  }
  return false;
}

function getEnv(name) {
  try {
    return Services.env.get(name) || "";
  } catch {
    return "";
  }
}

// Shared across windows: each browser window runs this bundle.
const state = Services.__gjoaSecurityState ??= { warned: false, confirmedAt: 0 };

function warnStale(myVersion, latest) {
  if (state.warned) return;
  state.warned = true;
  try {
    const win = Services.wm.getMostRecentWindow("navigator:browser");
    Services.prompt.alert(
      win,
      "gjoa is out of date",
      `This build is based on Firefox ${myVersion}; the latest stable Firefox is ${latest}.\n\n` +
        "Out-of-date browsers miss security fixes. Please update gjoa when you can:\n" +
        `${RELEASES_URL}\n\n` +
        "gjoa will keep running. You will be reminded again next session."
    );
  } catch (e) {
    console.error("[security] could not show the out-of-date dialog", e);
  }
}

async function probe() {
  const myVersion = Services.appinfo.version;
  try {
    const r = await fetch(PRODUCT_DETAILS_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const latest = (await r.json()).LATEST_FIREFOX_VERSION;
    if (!latest) {
      console.warn("[security] probe response missing LATEST_FIREFOX_VERSION — ignoring");
      return;
    }
    if (!VERSION_RE.test(latest)) {
      console.warn(`[security] probe returned malformed LATEST_FIREFOX_VERSION (${latest}) — ignoring`);
      return;
    }
    state.confirmedAt = Date.now();
    if (!isNewer(myVersion, latest)) {
      console.log(`[security] OK — ${myVersion} matches or exceeds latest stable ${latest}`);
      return;
    }
    const majorsBehind = parseVersion(latest)[0] - parseVersion(myVersion)[0];
    if (majorsBehind >= 1) {
      console.error(`[security] OUT OF DATE: running ${myVersion}, latest is ${latest} (${majorsBehind} major(s) behind)`);
      warnStale(myVersion, latest);
    } else {
      console.warn(`[security] STALE: running ${myVersion}, latest is ${latest} (point release behind) — update when convenient`);
    }
  } catch (e) {
    if (state.confirmedAt === 0) {
      console.warn("[security] probe failed and has never confirmed this session (fail-open):", e.message);
    } else {
      console.log("[security] probe failed — fail-open (offline?):", e.message);
    }
  }
}

function init() {
  if (getEnv("GJOA_ALLOW_INSECURE") === "1") {
    console.log("[security] GJOA_ALLOW_INSECURE=1 — out-of-date check disabled for this process");
    return;
  }
  if (Services.__gjoaSecurityRunning) return;
  Services.__gjoaSecurityRunning = true;
  setTimeout(probe, 2000);
  setInterval(probe, RECHECK_INTERVAL_MS);
}

init();
