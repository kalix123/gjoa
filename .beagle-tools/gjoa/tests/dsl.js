import { get as $$bc$get } from 'beagle/core.js';

export async function wait_for(...$beagle$args) {
  if (arguments.length === 2) {
    const mn = $beagle$args[0];
    const script = $beagle$args[1];
    return wait_for(mn, script, null);
  }
  if (arguments.length === 3) {
    const mn = $beagle$args[0];
    const script = $beagle$args[1];
    const timeout_ms = $beagle$args[2];
    const timeout = ((_logical) => (_logical !== false && _logical != null ? _logical : 1500))(timeout_ms);
    const deadline = (Date.now() + timeout);
    return (async () => { let last_err = null; while (true) {
    if ((Date.now() < deadline)) { const r = await (async () => { try {
    const ok = await mn.executeScript(script);
  return {done: ok, err: last_err};
  } catch (e) {
    return {done: false, err: e};
  } })(); if (((_truthy) => _truthy !== false && _truthy != null)($$bc$get(r, "done"))) { return null; } else { await new Promise((res) => setTimeout(() => res(), 20)); const _recur_0 = $$bc$get(r, "err"); last_err = _recur_0; continue; } } else { return (() => { throw new Error(("".concat("timed out waiting for: ", script.slice(0, 160), (((_truthy) => _truthy !== false && _truthy != null)(last_err) ? ("".concat(" (last error: ", last_err.message, ")")) : "")))); })(); }
  } })();
  }
  throw new Error('No matching arity: ' + $beagle$args.length);
}

export async function sleep(ms) {
  return await new Promise((res) => setTimeout(() => res(), ms));
}

export const NAV_JS = ("".concat("\n", "  const [url, resolve] = arguments;\n", "  let done = false; const finish = v => { if (!done) { done = true; resolve(v); } };\n", "  const win = Services.wm.getMostRecentWindow('navigator:browser');\n", "  const b = win.gBrowser.selectedBrowser;\n", "  const l = { QueryInterface: ChromeUtils.generateQI(['nsIWebProgressListener','nsISupportsWeakReference']),\n", "    onStateChange(wp, req, flags) { const S = Ci.nsIWebProgressListener;\n", "      if ((flags & S.STATE_STOP) && (flags & S.STATE_IS_WINDOW)) { try { b.removeProgressListener(l); } catch {} finish(true); } } };\n", "  b.addProgressListener(l, Ci.nsIWebProgress.NOTIFY_STATE_ALL);\n", "  b.loadURI(Services.io.newURI(url), { triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() });\n", "  setTimeout(() => finish(false), 15000);\n"));
