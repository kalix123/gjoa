import { parse } from 'acorn';
import { child_nodes, to_cst, render } from './reflector.js';
import { fuzzy_find, confident_p } from './anchor.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

function parse_js(src) {
  return parse(src, {ecmaVersion: "latest", sourceType: "module", allowHashBang: true});
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

function find_method(n, name) {
  if (((_truthy) => _truthy !== false && _truthy != null)(((n != null) && ((_logical) => (_logical !== false && _logical != null ? ((n.key != null) && (($$bc$equiv(n.key.name, name)) && ((n.value != null) && (n.value.body != null)))) : _logical))((($$bc$equiv(n.type, "MethodDefinition")) || ($$bc$equiv(n.type, "Property"))))))) {
    return [n.value.body.start, n.value.body.end];
  } else {
    const kids = child_nodes(n);
    return (() => { let i = 0; while (true) {
    if ((i < kids.length)) { const r = find_method(kids[i], name); if ((r != null)) { return r; } else { const _recur_0 = (i + 1); i = _recur_0; continue; } } else { return null; }
  } })();
  }
}

export function find_body_span(ast, class_name, method_name) {
  const c = find_class(ast, class_name);
  return ((c == null) ? null : find_method(c, method_name));
}

export function replace_span(cst, span, text) {
  return (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(cst.start, span[0])) && ($$bc$equiv(cst.end, span[1])))) ? {kind: "Raw", start: span[0], end: span[1], segs: [text], kids: []} : {kind: cst.kind, start: cst.start, end: cst.end, segs: cst.segs, kids: cst.kids.map((k) => replace_span(k, span, text))});
}

function apply_body(src, span, new_body) {
  const root = {type: "File", start: 0, end: src.length, body: [parse_js(src)]};
  return render(replace_span(to_cst(root, src), span, new_body));
}

export function set_method_body(src, class_name, method_name, new_body, anchor) {
  const ast = parse_js(src);
  const exact = find_body_span(ast, class_name, method_name);
  return (((exact != null)) ? {ok: true, src: apply_body(src, exact, new_body), span: exact} : ((anchor != null)) ? (() => { const m = fuzzy_find(src, class_name, anchor); return (confident_p(m) ? {ok: true, src: apply_body(src, m.body, new_body), span: m.body, recovered: ("".concat(method_name, " -> ", m.name, " (", m.why, ")"))} : {ok: false, reason: ("".concat("not found: ", class_name, ".", method_name, ((m != null) ? ("".concat("; fuzzy candidate `", m.name, "` rejected: ", m.why)) : "")))}); })() : {ok: false, reason: ("".concat("not found: ", class_name, ".", method_name))});
}

export function get_body(src, class_name, method_name) {
  const ast = parse_js(src);
  const span = find_body_span(ast, class_name, method_name);
  return ((span == null) ? null : src.slice(span[0], span[1]));
}

export function parses_p(src) {
  return (() => { try {
    parse_js(src);
  return true;
  } catch (__e) {
    return false;
  } })();
}
