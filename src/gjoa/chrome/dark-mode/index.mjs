// Chrome-level dark mode controller. Translates gjoa.darkmode.{enabled,mode}
// into the engine and Firefox prefs that implement it (see docs/dark-mode.md):
//
//   chrome    — dark window chrome (color-scheme on :root)
//   override  — layout.css.prefers-color-scheme.content-override
//               (0 = dark, 1 = light, 2 = follow the browser theme)
//   invert    — engine inversion of every page (patch 0009)
//   hybrid    — pre-paint inversion of only light/themeless pages
//   rfpExempt — keep prefers-color-scheme working under resistFingerprinting
//
// Exposed as window.gjoaDarkMode.

import { onWindowUnload, prefBool, prefStr, setPrefBool, setPrefInt, setPrefStr } from "../lib/chrome.mjs";

const PREF_ENABLED = "gjoa.darkmode.enabled";
const PREF_MODE = "gjoa.darkmode.mode";
const PREF_CONTENT_OVERRIDE = "layout.css.prefers-color-scheme.content-override";
const PREF_INVERT = "gjoa.darkmode.invert.enabled";
const PREF_DEFAULT_INVERT = "gjoa.darkmode.hybrid.default-invert";
const PREF_NORMALIZE = "gjoa.darkmode.normalize.enabled";
const PREF_RFP_OVERRIDES = "privacy.resistFingerprinting.overrides";
const RFP_COLORSCHEME_EXEMPT = "+AllTargets,-CSSPrefersColorScheme";

const OFF = { chrome: false, override: 2, invert: false, hybrid: false, rfpExempt: false };
const LIGHT = { chrome: false, override: 1, invert: false, hybrid: false, rfpExempt: false };
const DARK = { chrome: true, override: 0, invert: false, hybrid: true, rfpExempt: true };
const UNIFORM = { chrome: true, override: 1, invert: true, hybrid: false, rfpExempt: false };

let unsubscribe = null;

const isEnabled = () => prefBool(PREF_ENABLED, true);
const getMode = () => prefStr(PREF_MODE, "dark");
const systemIsDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

function settingsFor(enabled, mode) {
  if (!enabled || mode === "off") return OFF;
  switch (mode) {
    case "system": return systemIsDark() ? DARK : LIGHT;
    case "uniform": return UNIFORM;
    case "light": return LIGHT;
    default: return DARK; // "dark" and anything unrecognised
  }
}

// Only touch the RFP overrides pref when it is empty or holds our own value,
// so a user's custom overrides are never clobbered.
function setRfpColorSchemeExempt(on) {
  const cur = prefStr(PREF_RFP_OVERRIDES, "");
  if (on && (cur === "" || cur === RFP_COLORSCHEME_EXEMPT)) setPrefStr(PREF_RFP_OVERRIDES, RFP_COLORSCHEME_EXEMPT);
  else if (!on && cur === RFP_COLORSCHEME_EXEMPT) setPrefStr(PREF_RFP_OVERRIDES, "");
}

function setChromeScheme(dark) {
  const root = document.documentElement;
  if (dark) {
    root.style.colorScheme = "dark";
    root.setAttribute("gjoa-darkmode", "true");
  } else {
    root.style.removeProperty("color-scheme");
    root.removeAttribute("gjoa-darkmode");
  }
}

function apply() {
  const s = settingsFor(isEnabled(), getMode());
  setChromeScheme(s.chrome);
  setPrefInt(PREF_CONTENT_OVERRIDE, s.override);
  setPrefBool(PREF_INVERT, s.invert);
  setPrefBool(PREF_DEFAULT_INVERT, s.hybrid);
  setRfpColorSchemeExempt(s.rfpExempt);
}

function toggle() {
  const next = !isEnabled();
  setPrefBool(PREF_ENABLED, next);
  return next;
}

const NEXT_MODE = { dark: "light", light: "system", system: "dark" };

function cycleMode() {
  const next = NEXT_MODE[getMode()] ?? "dark";
  setPrefStr(PREF_MODE, next);
  return next;
}

function destroy() {
  unsubscribe?.();
  unsubscribe = null;
  setChromeScheme(false);
}

function init() {
  try {
    const d = Services.prefs.getDefaultBranch("");
    d.setBoolPref(PREF_ENABLED, true);
    d.setCharPref(PREF_MODE, "dark");
    d.setBoolPref(PREF_NORMALIZE, true);
  } catch (e) {
    console.error("gjoa-darkmode: setting defaults failed", e);
  }
  apply();

  const observer = { observe: () => apply() };
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => apply();
  Services.prefs.addObserver(PREF_ENABLED, observer);
  Services.prefs.addObserver(PREF_MODE, observer);
  mql.addEventListener("change", onSystemChange);
  unsubscribe = () => {
    Services.prefs.removeObserver(PREF_ENABLED, observer);
    Services.prefs.removeObserver(PREF_MODE, observer);
    mql.removeEventListener("change", onSystemChange);
  };

  window.gjoaDarkMode = { toggle, cycleMode, isEnabled, getMode };
  onWindowUnload(destroy);
  console.log(`gjoa-darkmode: initialized (enabled=${isEnabled()}, mode=${getMode()})`);
}

init();
