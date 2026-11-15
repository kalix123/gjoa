import { parse } from 'acorn';
import { child_nodes } from './reflector.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

function parse_js(src) {
  return parse(src, {ecmaVersion: "latest", sourceType: "module", allowHashBang: true});
}

function collect_idents(node, acc) {
  if ((node != null)) {
    if (($$bc$equiv(node.type, "Identifier"))) {
      acc.add(node.name);
    }
    child_nodes(node).forEach((k) => {
  collect_idents(k, acc);
});
  }
  return acc;
}

function idents_of(body) {
  return Array.from(collect_idents(body, new Set()));
}

function param_names(methodNode) {
  return methodNode.value.params.map((p) => (($$bc$equiv(p.type, "Identifier")) ? p.name : "?"));
}

function find_class(n, cname) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((n != null) && ((_logical) => (_logical !== false && _logical != null ? ((n.id != null) && ($$bc$equiv(n.id.name, cname))) : _logical))((($$bc$equiv(n.type, "ClassDeclaration")) || ($$bc$equiv(n.type, "ClassExpression"))))))) {
    return n;
  } else {
    const kids = child_nodes(n);
    return (() => { let i = 0; while (true) {
    if ((i < kids.length)) { const r = find_class(kids[i], cname); if ((r != null)) { return r; } else { const _recur_0 = (i + 1); i = _recur_0; continue; } } else { return null; }
  } })();
  }
}

function class_methods(classNode) {
  const out = [];
  if ((classNode != null)) {
    child_nodes(classNode).forEach((cb) => {
  if (($$bc$equiv(cb.type, "ClassBody"))) {
    const n = [0];
    child_nodes(cb).forEach((m) => {
  if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(m.type, "MethodDefinition")) && ((m.key != null) && ((m.value != null) && (m.value.body != null)))))) {
    out.push({name: m.key.name, node: m, body: m.value.body, params: param_names(m), ordinal: n[0]});
    const ordinal = n[0];
    (n[0] = (ordinal + 1));
  }
});
  }
});
  }
  return out;
}

export function capture_anchor(src, cname, mname) {
  const ast = parse_js(src);
  const c = find_class(ast, cname);
  if ((c == null)) {
    return null;
  } else {
    const ms = class_methods(c);
    const hit = ms.find((m) => ($$bc$equiv(m.name, mname)));
    return ((hit == null) ? null : {params: hit.params, ordinal: hit.ordinal, idents: idents_of(hit.body)});
  }
}

function arr_eq(a, b) {
  return (($$bc$equiv(a.length, b.length)) && a.every((x, i) => ($$bc$equiv(x, b[i]))));
}

function jaccard(a, b) {
  const sa = new Set(a);
  const sb = new Set(b);
  const inter = Array.from(sa).filter((x) => sb.has(x));
  const uni = new Set(Array.from(sa).concat(Array.from(sb)));
  const inter_count = inter.length;
  const uni_count = uni.size;
  return (($$bc$equiv(uni_count, 0)) ? 0 : (inter_count / uni_count));
}

export function fuzzy_find(src, cname, anchor) {
  const ast = parse_js(src);
  const c = find_class(ast, cname);
  if ((c == null)) {
    return null;
  } else {
    const ms = class_methods(c);
    const scored = ms.map((m) => { const j = jaccard(idents_of(m.body), anchor.idents);
const pm = (arr_eq(m.params, anchor.params) ? 1.0 : 0.0);
const pos = (($$bc$equiv(m.ordinal, anchor.ordinal)) ? 1.0 : 0.0);
const score = ((0.7 * j) + (0.25 * pm) + (0.05 * pos));
return {name: m.name, node: m, score: score, j: j, pm: pm}; });
    if (($$bc$equiv(scored.length, 0))) {
      return null;
    } else {
      const sorted = scored.slice().sort((a, b) => { const a_score = a.score;
const b_score = b.score;
return (b_score - a_score); });
      const best = sorted[0];
      const best_score = best.score;
      const second = ((sorted.length > 1) ? sorted[1].score : 0);
      const margin = (best_score - second);
      return {name: best.name, body: [best.node.body.start, best.node.body.end], confidence: best.score, margin: margin, j: best.j, pm: best.pm, why: ("".concat("params=", best.pm, " bodyJaccard=", best.j.toFixed(2), " margin=", margin.toFixed(2)))};
    }
  }
}

export function confident_p(match) {
  return ((match != null) && ((match.j >= 0.6) && (($$bc$equiv(match.pm, 1.0)) && ((match.margin >= 0.15) && (match.confidence >= 0.7)))));
}
