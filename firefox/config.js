// profile-js loader stub — Firefox skips this first line. Installed as <firefox>/config.js.
//
// Firefox runs this at startup for every profile (autoconfig, switched on by
// defaults/pref/config-prefs.js). If the profile has chrome/js/chrome.manifest
// it registers that folder as resource://profile-js/ and imports
// boot.sys.mjs from it; profiles without it stay stock Firefox. All the real
// code lives in the profile, so this file never needs to change.
try {
  const manifest = Services.dirsvc.get("UChrm", Ci.nsIFile);
  manifest.append("js");
  manifest.append("chrome.manifest");
  if (manifest.exists()) {
    Components.manager.QueryInterface(Ci.nsIComponentRegistrar).autoRegister(manifest);
    ChromeUtils.importESModule("resource://profile-js/boot.sys.mjs");
  }
} catch (e) {
  Cu.reportError(e);
}
