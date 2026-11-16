// Small helpers shared by the chrome bundles (replacing the Beagle macros).

// Pref reads that never throw (a missing or wrongly-typed pref yields the
// default).
export function prefBool(name, fallback) {
  try {
    return Services.prefs.getBoolPref(name, fallback);
  } catch {
    return fallback;
  }
}

export function prefInt(name, fallback) {
  try {
    return Services.prefs.getIntPref(name, fallback);
  } catch {
    return fallback;
  }
}

export function prefStr(name, fallback) {
  try {
    return Services.prefs.getStringPref(name, fallback);
  } catch {
    try {
      return Services.prefs.getCharPref(name, fallback);
    } catch {
      return fallback;
    }
  }
}

// Pref writes that never throw.
export function setPrefBool(name, value) {
  try { Services.prefs.setBoolPref(name, value); } catch {}
}

export function setPrefInt(name, value) {
  try { Services.prefs.setIntPref(name, value); } catch {}
}

export function setPrefStr(name, value) {
  try { Services.prefs.setStringPref(name, value); } catch {}
}

// Watch a pref (or pref branch prefix); returns an unsubscribe function.
export function observePref(name, callback) {
  const observer = { observe: () => callback() };
  Services.prefs.addObserver(name, observer);
  return () => Services.prefs.removeObserver(name, observer);
}

// Run `handler` once when the window unloads, and register it with the
// loader's hot-reload registry so a dev bundle reload tears it down too.
export function onWindowUnload(handler, win = window) {
  win.addEventListener("unload", handler, { once: true });
  win.__gjoaHR?.teardowns?.push(handler);
  return handler;
}
