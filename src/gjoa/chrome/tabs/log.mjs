
import { truthy } from "../lib/value.mjs";
const LOG_FILENAME = "gjoa-debug.log";

const LOG_MAX_BYTES = (5 * 1024 * 1024);

const state = {log_path: null, rotate_checked: false, flush_pending: false};

const lines = [];

function log_path_bang() {
  return ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const p = PathUtils.join(Services.dirsvc.get("ProfD", Ci.nsIFile).path, LOG_FILENAME); (state.log_path = p);
return p; })()))(state.log_path);
}

function flush_lines_bang() {
  const batch = lines.splice(0);
  if (((0 === batch.length))) {
    (state.flush_pending = false);
    return null;
  } else {
    const blob = new TextEncoder().encode(("".concat(batch.join("\n"), "\n")));
    const path = log_path_bang();
    return IOUtils.write(path, blob, {mode: "appendOrCreate"}).then(() => ((lines.length > 0) ? flush_lines_bang() : (state.flush_pending = false))).catch((e) => { console.error("[GJOA:log] write failed", e);
return (state.flush_pending = false); });
  }
}

function maybe_rotate_bang() {
  if ((!truthy(state.rotate_checked))) {
    (state.rotate_checked = true);
    return IOUtils.stat(log_path_bang()).then((info) => { if ((info.size > LOG_MAX_BYTES)) {
  return IOUtils.write(log_path_bang(), new Uint8Array(0), {mode: "overwrite"});
} }).catch(() => null);
  }
}

export function create_logger_bang(tag) {
  const prefix = ("".concat("[GJOA:", tag, "]"));
  return (event, data) => { if (truthy(Services.prefs.getBoolPref("gjoa.debug", false))) {
  maybe_rotate_bang();
  console.log(prefix, event, ((_logical) => (_logical !== false && _logical != null ? _logical : {}))(data));
  lines.push(("".concat(Date.now(), " [", tag, "] ", event, " ", JSON.stringify(((_logical) => (_logical !== false && _logical != null ? _logical : {}))(data)))));
  if ((!truthy(state.flush_pending))) {
    (state.flush_pending = true);
    return Promise.resolve(undefined).then(flush_lines_bang);
  }
} };
}
