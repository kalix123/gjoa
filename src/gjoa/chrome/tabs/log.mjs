// Debug logger, active only while the gjoa.debug pref is true. Lines go to the
// browser console and are appended (batched per microtask) to
// <profile>/gjoa-debug.log, which is truncated once per session past 5 MB.

const LOG_FILENAME = "gjoa-debug.log";
const LOG_MAX_BYTES = 5 * 1024 * 1024;

let logPath = null;
let rotateChecked = false;
let flushPending = false;
const lines = [];

function getLogPath() {
  logPath ??= PathUtils.join(Services.dirsvc.get("ProfD", Ci.nsIFile).path, LOG_FILENAME);
  return logPath;
}

function flushLines() {
  const batch = lines.splice(0);
  if (batch.length === 0) {
    flushPending = false;
    return null;
  }
  const blob = new TextEncoder().encode(`${batch.join("\n")}\n`);
  return IOUtils.write(getLogPath(), blob, { mode: "appendOrCreate" })
    .then(() => (lines.length > 0 ? flushLines() : (flushPending = false)))
    .catch((e) => {
      console.error("[GJOA:log] write failed", e);
      flushPending = false;
    });
}

function maybeRotate() {
  if (rotateChecked) return;
  rotateChecked = true;
  IOUtils.stat(getLogPath())
    .then((info) => {
      if (info.size > LOG_MAX_BYTES) return IOUtils.write(getLogPath(), new Uint8Array(0), { mode: "overwrite" });
      return null;
    })
    .catch(() => null);
}

export function create_logger_bang(tag) {
  const prefix = `[GJOA:${tag}]`;
  return (event, data) => {
    if (!Services.prefs.getBoolPref("gjoa.debug", false)) return;
    maybeRotate();
    const payload = data ?? {};
    console.log(prefix, event, payload);
    lines.push(`${Date.now()} [${tag}] ${event} ${JSON.stringify(payload)}`);
    if (!flushPending) {
      flushPending = true;
      Promise.resolve().then(flushLines);
    }
  };
}
