import { parse } from 'acorn';
import { readFileSync } from 'fs';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

export function node_p(v) {
  return ((v != null) && ((v.type != null) && (v.start != null)));
}

export function child_nodes(n) {
  const kids = [];
  Object.keys(n).forEach((key) => {
  if ((!((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(key, "type")) || (($$bc$equiv(key, "start")) || (($$bc$equiv(key, "end")) || (($$bc$equiv(key, "loc")) || ($$bc$equiv(key, "range"))))))))) {
    const v = $$bc$get(n, key);
    if (node_p(v)) {
      kids.push(v);
    }
    if (((_truthy) => _truthy !== false && _truthy != null)(Array.isArray(v))) {
      v.forEach((e) => {
  if (node_p(e)) {
    kids.push(e);
  }
});
    }
  }
});
  kids.sort((a, b) => { const a_start = a.start;
const b_start = b.start;
return (a_start - b_start); });
  return kids;
}

export function to_cst(n, src) {
  const raw = child_nodes(n);
  const nstart = n.start;
  const nend = n.end;
  const kept = [];
  (() => { let i = 0; let last = nstart; while (true) {
    if ((i < raw.length)) {  const k = raw[i]; if (((_truthy) => _truthy !== false && _truthy != null)(((k.start >= last) && (k.end <= nend)))) { kept.push(k); const _recur_0 = (i + 1); const _recur_1 = k.end; i = _recur_0; last = _recur_1; continue; } else { const _recur_0 = (i + 1); const _recur_1 = last; i = _recur_0; last = _recur_1; continue; } } else { return null; }
  } })();
  const segs = [];
  const kids = [];
  (() => { let i = 0; let pos = nstart; while (true) {
    if ((i < kept.length)) { const k = kept[i]; segs.push(src.slice(pos, k.start)); kids.push(to_cst(k, src)); const _recur_0 = (i + 1); const _recur_1 = k.end; i = _recur_0; pos = _recur_1; continue; } else { return segs.push(src.slice(pos, nend)); }
  } })();
  return {kind: n.type, start: nstart, end: nend, segs: segs, kids: kids};
}

export function render(c) {
  const segs = c.segs;
  const kids = c.kids;
  return (() => { let i = 0; let out = segs[0]; while (true) {
    if ((i < kids.length)) { const _recur_0 = (i + 1); const _recur_1 = ("".concat(out, render(kids[i]), segs[(i + 1)])); i = _recur_0; out = _recur_1; continue; } else { return out; }
  } })();
}

export function reflect(src) {
  const ast = parse(src, {ecmaVersion: "latest", sourceType: "module", allowHashBang: true});
  const root = {type: "File", start: 0, end: src.length, body: [ast]};
  return to_cst(root, src);
}

export function round_trips_p(src) {
  return (render(reflect(src)) === src);
}

function main_bang() {
  const path = process.argv[2];
  const src = readFileSync(path, "utf8");
  const out = render(reflect(src));
  const ok = ($$bc$equiv(out, src));
  console.error(("".concat(path, ": ", src.length, " bytes, byte-identical=", ok)));
  if ((!ok)) {
    return process.exit(1);
  }
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
