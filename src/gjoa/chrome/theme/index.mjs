// Chrome theme variant: stamps :root[gjoa-theme] from gjoa.theme.variant
// (a base16 token-set swap in gjoa.uc.css). "polar-night" is the built-in
// default and "system" follows the OS; both use the unattributed tokens.

import { observePref, onWindowUnload, prefStr, setPrefBool, setPrefStr } from "../lib/chrome.mjs";

const PREF_VARIANT = "gjoa.theme.variant";
const PREF_USE_SYSTEM = "gjoa.theme.useSystem";
const DEFAULT_VARIANT = "polar-night";

let unsubscribe = null;

const getVariant = () => prefStr(PREF_VARIANT, DEFAULT_VARIANT);

function apply() {
  const variant = getVariant();
  const root = document.documentElement;
  if (variant === "polar-night" || variant === "system") root.removeAttribute("gjoa-theme");
  else root.setAttribute("gjoa-theme", variant);
  setPrefBool(PREF_USE_SYSTEM, variant === "system");
}

function setVariant(v) {
  setPrefStr(PREF_VARIANT, v);
  return v;
}

function destroy() {
  unsubscribe?.();
  unsubscribe = null;
  document.documentElement.removeAttribute("gjoa-theme");
}

function init() {
  try {
    Services.prefs.getDefaultBranch("").setCharPref(PREF_VARIANT, DEFAULT_VARIANT);
  } catch (e) {
    console.error("gjoa-theme: setting the default variant failed", e);
  }
  apply();
  unsubscribe = observePref(PREF_VARIANT, apply);
  window.gjoaTheme = { setVariant, getVariant };
  onWindowUnload(destroy);
  console.log(`gjoa-theme: initialized (variant=${getVariant()})`);
}

init();
