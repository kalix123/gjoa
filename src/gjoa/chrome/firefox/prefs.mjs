// Pref helpers used by the tabs bundle. Reads never throw (missing or
// wrongly-typed prefs yield the default); writes swallow errors.

export function get_bool(name, defaultValue) {
  const d = defaultValue ?? false;
  try { return Services.prefs.getBoolPref(name, d); } catch { return d; }
}

export function set_bool(name, value) {
  try { Services.prefs.setBoolPref(name, value); } catch {}
}

export function get_int(name, defaultValue) {
  const d = defaultValue ?? 0;
  try { return Services.prefs.getIntPref(name, d); } catch { return d; }
}

export function set_int(name, value) {
  try { Services.prefs.setIntPref(name, value); } catch {}
}

export function get_string(name, defaultValue) {
  const d = defaultValue ?? "";
  try {
    return Services.prefs.getStringPref(name, d);
  } catch {
    try { return Services.prefs.getCharPref(name, d); } catch { return d; }
  }
}

export function set_string(name, value) {
  try { Services.prefs.setStringPref(name, value); } catch {}
}

// Vertical tabs on by default, unless the user has chosen otherwise.
export function ensure_vertical_tabs_default() {
  try {
    if (!Services.prefs.prefHasUserValue("sidebar.verticalTabs")) {
      Services.prefs.setBoolPref("sidebar.verticalTabs", true);
    }
  } catch {}
}

export function apply_menubar_default(doc) {
  try {
    doc.getElementById("toolbar-menubar")?.setAttribute("autohide", "false");
  } catch {}
}

// Watch a pref (or branch); handler receives the changed pref name. Returns
// an unsubscribe function.
export function observe(name, handler) {
  const observer = {
    observe(_subject, _topic, data) {
      try {
        handler(data);
      } catch (e) {
        console.error(`gjoa prefs observer ${name}:`, e);
      }
    },
  };
  try { Services.prefs.addObserver(name, observer); } catch {}
  return () => {
    try { Services.prefs.removeObserver(name, observer); } catch {}
  };
}
