import { create_logger_bang } from './log.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const INSTANCE_ID_PREF = "gjoa.instance.id";

const fts_available = {v: false};

const SCHEMA = ["CREATE TABLE IF NOT EXISTS events (\n    id        INTEGER PRIMARY KEY,\n    timestamp INTEGER NOT NULL,\n    hash      TEXT    NOT NULL UNIQUE,\n    snapshot  TEXT    NOT NULL,\n    tag       TEXT,\n    instance_id TEXT NOT NULL\n  )", "CREATE INDEX IF NOT EXISTS events_timestamp ON events(timestamp DESC)", "CREATE INDEX IF NOT EXISTS events_tag ON events(tag) WHERE tag IS NOT NULL", "CREATE INDEX IF NOT EXISTS events_instance ON events(instance_id)", "CREATE TABLE IF NOT EXISTS events_search_content (\n    rowid    INTEGER PRIMARY KEY AUTOINCREMENT,\n    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,\n    url      TEXT NOT NULL,\n    label    TEXT NOT NULL\n  )", "CREATE INDEX IF NOT EXISTS esc_event ON events_search_content(event_id)", "CREATE INDEX IF NOT EXISTS esc_url ON events_search_content(url)", "CREATE INDEX IF NOT EXISTS esc_label ON events_search_content(label)"];

const log = create_logger_bang("history");

const state = {conn: null, lastHash: null, instanceId: null};

function load_instance_id_bang() {
  return ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const id_from_pref = (() => { try {
    return Services.prefs.getStringPref(INSTANCE_ID_PREF, "");
  } catch (__e____scope__8__4__2__1__2__2__1__0) {
    return (() => { try {
    return Services.prefs.getCharPref(INSTANCE_ID_PREF, "");
  } catch (__e2____scope__8__4__2__1__2__2__2__2__1__0) {
    return "";
  } })();
  } })(); if ((!($$bc$equiv(id_from_pref, "")))) {
  (state.instanceId = id_from_pref);
  return id_from_pref;
} else {
  const fresh = crypto.randomUUID();
  (() => { try {
    return Services.prefs.setStringPref(INSTANCE_ID_PREF, fresh);
  } catch (__e____scope__8__4__2__2__3__2__2__1__0) {
    return null;
  } })();
  log("instanceId:generated", {id: fresh});
  (state.instanceId = fresh);
  return fresh;
} })()))(state.instanceId);
}

function canonicalize(value) {
  return ((($$bc$equiv(typeof value, "undefined"))) ? "null" : (($$bc$equiv(value, null))) ? "null" : ((!($$bc$equiv(typeof value, "object")))) ? JSON.stringify(value) : (Array.isArray(value)) ? ("".concat("[", value.map((_pct1) => canonicalize(_pct1)).join(","), "]")) : (() => { const keys = Object.keys(value).sort().filter((_pct1) => (!($$bc$equiv(typeof value[_pct1], "undefined")))); return ("".concat("{", keys.map((_pct1) => ("".concat(JSON.stringify(_pct1), ":", canonicalize(value[_pct1])))).join(","), "}")); })());
}

function sha256_hex(text) {
  const data = new TextEncoder().encode(text);
  return crypto.subtle.digest("SHA-256", data).then((_pct1) => { const bytes = new Uint8Array(_pct1);
const hex_parts = [];
bytes.forEach((b) => hex_parts.push(b.toString(16).padStart(2, "0")));
return hex_parts.join(""); });
}

function execute_stmts(conn, stmts, idx) {
  if ((idx < stmts.length)) {
    return conn.execute(stmts[idx]).then(() => execute_stmts(conn, stmts, (idx + 1)));
  }
}

function try_create_fts_bang(conn) {
  return conn.execute("CREATE VIRTUAL TABLE IF NOT EXISTS events_fts USING fts5(url, label, content=events_search_content, content_rowid=rowid)").then(() => { (fts_available.v = true);
return conn.execute("INSERT INTO events_fts(events_fts) VALUES('rebuild')"); }).then(() => log("fts5", {status: "ready"})).catch((_pct1) => { (fts_available.v = false);
return log("fts5", {status: "unavailable", error: String(_pct1)}); });
}

function initialize_schema_bang(conn) {
  return conn.executeTransaction(() => execute_stmts(conn, SCHEMA, 0)).then(() => try_create_fts_bang(conn));
}

function prime_last_hash_bang(conn) {
  return conn.execute("SELECT hash FROM events ORDER BY id DESC LIMIT 1").then((_pct1) => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _pct1.length : _logical))(_pct1))) {
  return (state.lastHash = _pct1[0].getResultByName("hash"));
} });
}

function open_connection_bang() {
  if (((_truthy) => _truthy !== false && _truthy != null)(state.conn)) {
    return Promise.resolve(state.conn);
  } else {
    const sqlite_mod = ChromeUtils.importESModule("resource://gre/modules/Sqlite.sys.mjs");
    const sqlite = sqlite_mod.Sqlite;
    const prof_dir = Services.dirsvc.get("ProfD", Ci.nsIFile).path;
    const path = PathUtils.join(prof_dir, "gjoa-history.sqlite");
    return sqlite.openConnection({path: path}).then((_pct1) => { log("openConnection", {path: path});
return _pct1; }).then((_pct1) => _pct1.execute("PRAGMA journal_mode = WAL").then(() => _pct1.execute("PRAGMA foreign_keys = ON")).then(() => initialize_schema_bang(_pct1)).then(() => { (state.conn = _pct1);
return prime_last_hash_bang(_pct1); }).then(() => _pct1));
  }
}

function date_label(d) {
  const dt = ((_logical) => (_logical !== false && _logical != null ? _logical : new Date()))(d);
  const day_short = dt.toLocaleDateString("en-US", {weekday: "short"});
  const yyyy = dt.getFullYear();
  const month = dt.getMonth();
  const mm = String((month + 1)).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  return ("".concat("Session - ", day_short, " ", yyyy, "/", mm, "/", dd, " ", hh, ":", min));
}

function decode_row(row) {
  return {id: row.getResultByName("id"), timestamp: row.getResultByName("timestamp"), hash: row.getResultByName("hash"), snapshot: JSON.parse(row.getResultByName("snapshot")), tag: row.getResultByName("tag"), instanceId: row.getResultByName("instance_id")};
}

function extract_searchable_rows(snapshot) {
  const out = [];
  snapshot.nodes.forEach((_pct1) => { const url = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(_pct1.url);
const label = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(_pct1.name);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : label))(url))) {
  return out.push({url: url, label: label});
} });
  return out;
}

function insert_search_rows(conn, event_id, rows, idx) {
  if ((idx < rows.length)) {
    const row = rows[idx];
    return conn.execute("INSERT INTO events_search_content(event_id, url, label) VALUES (?, ?, ?)", [event_id, row.url, row.label]).then(() => { if (((_truthy) => _truthy !== false && _truthy != null)(fts_available.v)) {
  return conn.execute("INSERT INTO events_fts(rowid, url, label) VALUES (last_insert_rowid(), ?, ?)", [row.url, row.label]);
} }).catch((_pct1) => log("insert-search-rows:fts-sync", {error: String(_pct1)})).then(() => insert_search_rows(conn, event_id, rows, (idx + 1)));
  }
}

function build_search_query(tokens) {
  const escape_like = (s) => s.replace(new RegExp("([%_\\\\])", "g"), "\\$1");
  const conditions = [];
  const params = [];
  tokens.forEach((_pct1) => { const pat = ("".concat("%", escape_like(_pct1), "%"));
conditions.push("(esc.url LIKE ? ESCAPE '\\' OR esc.label LIKE ? ESCAPE '\\')");
params.push(pat);
return params.push(pat); });
  return {conditions: conditions, params: params};
}

function with_conn_bang(f) {
  return open_connection_bang().then(f);
}

const EVENTS_COLS = "SELECT id, timestamp, hash, snapshot, tag, instance_id FROM events";

function query_rows_bang(sql, params) {
  return with_conn_bang((_pct1) => _pct1.execute(sql, params)).then((_pct1) => _pct1.map(decode_row));
}

function query_one_bang(sql, params) {
  return with_conn_bang((_pct1) => _pct1.execute(sql, params)).then((_pct1) => { if (((_truthy) => _truthy !== false && _truthy != null)(_pct1.length)) {
  return decode_row(_pct1[0]);
} });
}

function read_changes(rows) {
  return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? rows[0] : _logical))(rows.length) : _logical))(rows)) ? ((_logical) => (_logical !== false && _logical != null ? _logical : 0))(rows[0].getResultByName("c")) : 0);
}

export function make_history_bang() {
  return {appendEvent: (snapshot) => with_conn_bang((_pct1) => { const canon = canonicalize(snapshot);
return sha256_hex(canon).then((hash) => { if ((!($$bc$equiv(hash, state.lastHash)))) {
  const ts = Date.now();
  const inst_id = load_instance_id_bang();
  const result = {insertedId: null};
  return _pct1.executeTransaction(() => _pct1.execute("INSERT OR IGNORE INTO events(timestamp, hash, snapshot, tag, instance_id) VALUES (?, ?, ?, NULL, ?)", [ts, hash, canon, inst_id]).then(() => _pct1.execute("SELECT id FROM events WHERE hash = ?", [hash])).then((id_rows) => { if (((_truthy) => _truthy !== false && _truthy != null)(id_rows.length)) {
  (result.insertedId = id_rows[0].getResultByName("id"));
  return insert_search_rows(_pct1, result.insertedId, extract_searchable_rows(snapshot), 0);
} })).then(() => { if ((!($$bc$equiv(result.insertedId, null)))) {
  (state.lastHash = hash);
  log("appendEvent", {id: result.insertedId, ts: ts, hashHead: hash.slice(0, 12)});
}
return result.insertedId; });
} }); }), tagLatest: (kind, label) => with_conn_bang((_pct1) => { const final_label = ((_logical) => (_logical !== false && _logical != null ? _logical : (($$bc$equiv(kind, "session")) ? date_label(null) : "Untitled")))(label);
const tag_value = ("".concat(kind, ":", final_label));
return _pct1.execute("UPDATE events SET tag = ? WHERE id = (SELECT MAX(id) FROM events)", [tag_value]).then(() => _pct1.execute("SELECT id FROM events ORDER BY id DESC LIMIT 1")).then((id_rows) => { const id = ((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? id_rows[0].getResultByName("id") : _logical))(id_rows[0]) : _logical))(id_rows.length) : _logical))(id_rows);
log("tagLatest", {id: id, tagValue: tag_value});
return id; }); }), getTagged: (limit) => query_rows_bang(("".concat(EVENTS_COLS, " WHERE tag IS NOT NULL ORDER BY timestamp DESC LIMIT ?")), [((_logical) => (_logical !== false && _logical != null ? _logical : 50))(limit)]), getById: (id) => query_one_bang(("".concat(EVENTS_COLS, " WHERE id = ?")), [id]), getRecent: (limit) => query_rows_bang(("".concat(EVENTS_COLS, " ORDER BY timestamp DESC LIMIT ?")), [((_logical) => (_logical !== false && _logical != null ? _logical : 50))(limit)]), search: (query, opts) => { const tagged_only = ((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? opts.taggedOnly : _logical))(opts));
const lim = ((_logical) => (_logical !== false && _logical != null ? _logical : 50))(((_logical) => (_logical !== false && _logical != null ? opts.limit : _logical))(opts));
const trimmed = query.trim();
if (($$bc$equiv(trimmed, ""))) {
  return Promise.resolve([]);
} else {
  if (((_truthy) => _truthy !== false && _truthy != null)(fts_available.v)) {
    const match_expr = trimmed.split(new RegExp("\\s+")).filter(Boolean).map((_pct1) => ("".concat("\"", _pct1.replace(new RegExp("\"", "g"), "\"\""), "\"", " *"))).join(" ");
    const tagged_clause = (tagged_only ? " AND e.tag IS NOT NULL" : "");
    const sql = ("".concat("SELECT e.id, e.timestamp, e.hash, e.snapshot, e.tag, e.instance_id", " FROM events e", " WHERE e.id IN (", "   SELECT DISTINCT esc.event_id FROM events_search_content esc", "   WHERE esc.rowid IN (SELECT rowid FROM events_fts WHERE events_fts MATCH ?)", " )", tagged_clause, " ORDER BY e.timestamp DESC", " LIMIT ?"));
    return query_rows_bang(sql, [match_expr, lim]);
  } else {
    const tokens = trimmed.split(new RegExp("\\s+")).filter(Boolean);
    const qr = build_search_query(tokens);
    const where_clause = qr.conditions.join(" AND ");
    const tagged_clause = (tagged_only ? " AND events.tag IS NOT NULL" : "");
    const sql = ("".concat("SELECT events.id, events.timestamp, events.hash, events.snapshot, events.tag, events.instance_id", " FROM events", " JOIN events_search_content esc ON esc.event_id = events.id", " WHERE ", where_clause, tagged_clause, " GROUP BY events.id", " ORDER BY events.timestamp DESC", " LIMIT ?"));
    const params = qr.params;
    params.push(lim);
    return query_rows_bang(sql, params);
  }
} }, runRetention: (opts) => with_conn_bang((_pct1) => { const days = ((_logical) => (_logical !== false && _logical != null ? _logical : Services.prefs.getIntPref("gjoa.history.retainDays", 30)))(((_logical) => (_logical !== false && _logical != null ? opts.retainDays : _logical))(opts));
const max_rows = ((_logical) => (_logical !== false && _logical != null ? _logical : Services.prefs.getIntPref("gjoa.history.maxRows", 10000)))(((_logical) => (_logical !== false && _logical != null ? opts.maxRows : _logical))(opts));
const cutoff = (Date.now() - (days * 24 * 60 * 60 * 1000));
const result = {deleted: 0};
return _pct1.executeTransaction(() => _pct1.execute("DELETE FROM events WHERE tag IS NULL AND timestamp < ?", [cutoff]).then(() => _pct1.execute("SELECT changes() AS c")).then((r) => { const deleted = result.deleted;
return (result.deleted = (deleted + read_changes(r))); }).then(() => _pct1.execute("DELETE FROM events WHERE tag IS NULL AND id IN (SELECT id FROM events WHERE tag IS NULL ORDER BY timestamp ASC LIMIT MAX(0, (SELECT COUNT(*) FROM events WHERE tag IS NULL) - ?))", [max_rows])).then(() => _pct1.execute("SELECT changes() AS c")).then((r) => { const deleted = result.deleted;
return (result.deleted = (deleted + read_changes(r))); })).then(() => { if (((_truthy) => _truthy !== false && _truthy != null)(result.deleted)) {
  log("runRetention", {deleted: result.deleted, retainDays: days, maxRows: max_rows});
}
return result.deleted; }); }), lastHash: () => state.lastHash, instanceId: () => load_instance_id_bang(), close: () => (((_truthy) => _truthy !== false && _truthy != null)(state.conn) ? state.conn.close().catch((__e) => null).then(() => { (state.conn = null);
return (state.lastHash = null); }) : Promise.resolve(null))};
}
