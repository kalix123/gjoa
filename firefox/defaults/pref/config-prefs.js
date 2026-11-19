// Installed as <firefox>/defaults/pref/config-prefs.js: turns on autoconfig so
// Firefox runs <firefox>/config.js (the profile-js loader stub) at startup.
pref("general.config.obscure_value", 0);
pref("general.config.filename", "config.js");
// Release and Beta builds only run autoconfig unsandboxed when asked to.
pref("general.config.sandbox_enabled", false);
