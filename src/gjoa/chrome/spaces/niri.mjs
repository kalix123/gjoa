
import { equiv, truthy } from "../lib/value.mjs";
function get_subprocess() {
  return ChromeUtils.importESModule("resource://gre/modules/Subprocess.sys.mjs").Subprocess;
}

export function reduce_event(cache, ev) {
  return ((truthy(ev.WorkspacesChanged)) ? (() => { const next = new Map(); const arr = ev.WorkspacesChanged.workspaces; arr.forEach((_pct1) => next.set(_pct1.id, _pct1));
return {cache: next, switch: null}; })() : (truthy(ev.WorkspaceActivated)) ? (() => { const a = ev.WorkspaceActivated; if ((!truthy(a.focused))) {
  return {cache: cache, switch: null};
} else {
  const ws = cache.get(a.id);
  return (truthy(ws) ? {cache: cache, switch: {name: ws.name, idx: ws.idx}} : {cache: cache, switch: null});
} })() : {cache: cache, switch: null});
}

export function switch_to_target(spaces, target) {
  if ((!truthy(((_logical) => (_logical !== false && _logical != null ? target : _logical))(spaces)))) {
    return {action: "none", reason: "no-spaces-or-target"};
  } else {
    const name = target.name;
    const idx = target.idx;
    return ((truthy(((_logical) => (_logical !== false && _logical != null ? (name.length > 0) : _logical))(name))) ? (() => { const match = spaces.list().find((_pct1) => (equiv(_pct1.name.toLowerCase(), name.toLowerCase()))); if (truthy(match)) {
  spaces.setActive(match.id);
  return {action: "activate", id: match.id, by: "name"};
} else {
  const created = spaces.create(name);
  spaces.setActive(created.id);
  return {action: "create", id: created.id, name: name};
} })() : (truthy((typeof idx === 'number') && ((_logical) => (_logical !== false && _logical != null ? (idx > 0) : _logical))(Number.isInteger(idx)))) ? (() => { const pos = Math.trunc(idx); const lst = spaces.list(); const at = lst[(pos - 1)]; if (truthy(at)) {
  spaces.setActive(at.id);
  return {action: "activate", id: at.id, by: "idx"};
} else {
  return {action: "none", reason: "no-space-at-idx", idx: idx};
} })() : {action: "none", reason: "no-name-or-idx"});
  }
}

const st = (() => { const cache = new Map(); return {proc: null, alive: false, debounce_id: null, cache: cache, pending: null, backoff: 500}; })();

function apply_switch_bang(target) {
  const delay = (() => { try {
    return Services.prefs.getIntPref("gjoa.niri.debounceMs", 120);
  } catch (__e____scope__7__4__1__2__2__1__0) {
    return 120;
  } })();
  (st.pending = target);
  if (truthy(st.debounce_id)) {
    clearTimeout(st.debounce_id);
  }
  return (st.debounce_id = setTimeout(() => { (st.debounce_id = null);
const tgt = st.pending;
const spaces = window.Spaces;
(st.pending = null);
if (truthy(((_logical) => (_logical !== false && _logical != null ? spaces : _logical))(tgt))) {
  (st.__niriDriving = true);
  return (() => { try {
    const res = switch_to_target(spaces, tgt);
  return console.log("gjoa-niri: workspace", ("".concat("name=", tgt.name, " idx=", tgt.idx)), "->", res.action, ((_logical) => (_logical !== false && _logical != null ? _logical : ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(res.reason)))(res.by));
  } catch (e) {
    return console.error("gjoa-niri: switch failed", e);
  } finally {
    (st.__niriDriving = false);
  } })();
} }, delay));
}

function handle_line_bang(line) {
  const ev = (() => { try {
    return JSON.parse(line);
  } catch (__e) {
    return null;
  } })();
  if (truthy(ev)) {
    if (truthy(ev.WorkspacesChanged)) {
      console.log("gjoa-niri: workspaces changed,", ev.WorkspacesChanged.workspaces.length, "workspaces");
    }
    const r = reduce_event(st.cache, ev);
    (st.cache = r.cache);
    if (truthy(r.switch)) {
      return apply_switch_bang(r.switch);
    }
  }
}

export function frame_lines(buf, chunk) {
  const lines = [];
  return (() => { let rest = ("".concat(buf, chunk)); while (true) {
    const nl = rest.indexOf("\n"); if ((nl < 0)) { return {lines: lines, rest: rest}; } else { const line = rest.slice(0, nl); ((line.length > 0) ? (() => { return lines.push(line); })() : null); const _recur_0 = rest.slice((nl + 1)); rest = _recur_0; continue; }
  } })();
}

function pump_step_bang(proc, buf) {
  return proc.stdout.readString().then((chunk) => { if (((chunk === ""))) {
  return null;
} else {
  const framed = frame_lines(buf.s, chunk);
  (buf.s = framed.rest);
  framed.lines.forEach((_pct1) => handle_line_bang(_pct1));
  return pump_step_bang(proc, buf);
} });
}

function pump_bang(proc) {
  return pump_step_bang(proc, {s: ""});
}

function schedule_respawn_bang() {
  const b = st.backoff;
  (st.backoff = Math.min((b * 2), 30000));
  return setTimeout(() => { if (truthy(st.alive)) {
  return spawn_bang();
} }, b);
}

function spawn_bang() {
  const sp = get_subprocess();
  return sp.pathSearch("niri").then((niri) => sp.call({command: niri, arguments: ["msg", "event-stream"], stderr: "stdout"}).then((proc) => { (st.proc = proc);
(st.alive = true);
(st.backoff = 500);
console.log("gjoa-niri: event-stream attached");
return pump_bang(proc).then((__) => { (st.proc = null);
if (truthy(st.alive)) {
  return schedule_respawn_bang();
} }); })).catch((e) => { console.error("gjoa-niri: spawn failed (niri on PATH?)", e);
if (truthy(st.alive)) {
  return schedule_respawn_bang();
} });
}

function teardown_bang() {
  (st.alive = false);
  if (truthy(st.debounce_id)) {
    clearTimeout(st.debounce_id);
  }
  const p = st.proc;
  if (truthy(p)) {
    (() => { try {
    return p.kill();
  } catch (__e) {
    return null;
  } })();
  }
  return (st.proc = null);
}

export function make_niri_binding_bang() {
  const enabled = (() => { try {
    return Services.prefs.getBoolPref("gjoa.niri.enabled", true);
  } catch (__e____scope__15__1__4__1__2__2__1__0) {
    return true;
  } })();
  const sock = (() => { try {
    return Services.env.get("NIRI_SOCKET");
  } catch (__e) {
    return "";
  } })();
  return (((!enabled)) ? console.log("gjoa-niri: disabled via pref") : (((!truthy(sock)) || ((sock === "")))) ? console.log("gjoa-niri: NIRI_SOCKET unset — not a niri session, skipping") : (() => { (st.alive = true);
spawn_bang();
const __el____scope__15__1__4__2__6__3__1__0 = window;
const __ev____scope__15__1__4__2__6__3__1__3 = "unload";
const __h____scope__15__1__4__2__6__3__1__6 = teardown_bang;
__el____scope__15__1__4__2__6__3__1__0.addEventListener(__ev____scope__15__1__4__2__6__3__1__3, __h____scope__15__1__4__2__6__3__1__6, {once: true});
if (truthy(((__ev____scope__15__1__4__2__6__3__1__3 === "unload")) && ((_logical) => (_logical !== false && _logical != null ? __el____scope__15__1__4__2__6__3__1__0.__gjoaHR.teardowns : _logical))(__el____scope__15__1__4__2__6__3__1__0.__gjoaHR))) {
  __el____scope__15__1__4__2__6__3__1__0.__gjoaHR.teardowns.push(__h____scope__15__1__4__2__6__3__1__6);
}
__h____scope__15__1__4__2__6__3__1__6;
return console.log("gjoa-niri: started"); })());
}
