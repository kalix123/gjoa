// Native ad/tracker blocking controls: mirrors gjoa.contentblock.enabled onto
// the engine's content-classifier switch and manages the per-site allow list.
// Exposed to the rest of the chrome as window.gjoaBlocking.

import { observePref, onWindowUnload, prefBool, prefStr, setPrefBool, setPrefStr } from "../lib/chrome.mjs";

const PREF_ENABLED = "gjoa.contentblock.enabled";
const PREF_ALLOW_HOSTS = "gjoa.contentblock.user.allow-hosts";
const PREF_PROTECTION = "privacy.trackingprotection.content.protection.enabled";

let unsubscribe = null;

const isEnabled = () => prefBool(PREF_ENABLED, true);

function allowHosts() {
  const csv = prefStr(PREF_ALLOW_HOSTS, "").trim();
  return csv ? csv.split(",").map((h) => h.trim()).filter(Boolean) : [];
}

function currentHost() {
  try {
    // .host throws for host-less URIs (about:, data:, …).
    return gBrowser.selectedBrowser?.currentURI?.host ?? "";
  } catch {
    return "";
  }
}

const hostAllowed = (h) => h.length > 0 && allowHosts().includes(h);

// Toggle `h` on the allow list; returns whether it is now allowed.
function toggleHost(h) {
  if (!h || h.includes(",")) return false;
  const hosts = allowHosts();
  const idx = hosts.indexOf(h);
  const wasAllowed = idx > -1;
  if (wasAllowed) hosts.splice(idx, 1);
  else hosts.push(h);
  setPrefStr(PREF_ALLOW_HOSTS, hosts.join(","));
  Services.prefs.savePrefFile(null);
  return !wasAllowed;
}

const apply = () => setPrefBool(PREF_PROTECTION, isEnabled());

function toggle() {
  const next = !isEnabled();
  setPrefBool(PREF_ENABLED, next);
  return next;
}

function destroy() {
  unsubscribe?.();
  unsubscribe = null;
}

function init() {
  apply();
  unsubscribe = observePref(PREF_ENABLED, apply);
  window.gjoaBlocking = { enabled: isEnabled, toggle, currentHost, hostAllowed, toggleHost };
  onWindowUnload(destroy);
  console.log(`gjoa-blocking: initialized (enabled=${isEnabled()})`);
}

init();
