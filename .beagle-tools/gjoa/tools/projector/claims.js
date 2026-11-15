import { set_method_body, get_body } from './set-body.js';
import { capture_anchor } from './anchor.js';

export function build_doc(edited, pristine, anchors) {
  const out = [];
  anchors.forEach((a) => {
  const body = get_body(edited, a.class, a.method);
  const fp = capture_anchor(pristine, a.class, a.method);
  if ((body != null)) {
    out.push({verb: "set-body", class: a.class, method: a.method, body: body, anchor: fp});
  }
});
  return out;
}

export function replay(doc, src) {
  const recoveries = [];
  return (() => { let i = 0; let cur = src; while (true) {
    if ((i < doc.length)) { const c = doc[i]; const r = set_method_body(cur, c.class, c.method, c.body, c.anchor); if (((_truthy) => _truthy !== false && _truthy != null)(r.ok)) { ((r.recovered != null) ? (() => { return recoveries.push(r.recovered); })() : null); const _recur_0 = (i + 1); const _recur_1 = r.src; i = _recur_0; cur = _recur_1; continue; } else { return r; } } else { return {ok: true, src: cur, recoveries: recoveries}; }
  } })();
}

export function doc__gtjson(doc) {
  return JSON.stringify(doc, null, 2);
}

export function json__gtdoc(s) {
  return JSON.parse(s);
}
