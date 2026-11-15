import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

export function parse_rgb(s) {
  const stripped = s.replace("rgba(", "").replace("rgb(", "").replace(")", "");
  const parts = stripped.split(",");
  const nth_num = (i) => Number.parseFloat(parts[i].trim());
  return {r: nth_num(0), g: nth_num(1), b: nth_num(2), a: ((parts.length > 3) ? nth_num(3) : 1)};
}

function as_rgb(v) {
  return (($$bc$equiv(typeof v, "string")) ? parse_rgb(v) : v);
}

function linearize(c) {
  const cs = (c / 255);
  return ((cs <= 0.03928) ? (cs / 12.92) : Math.pow(((cs + 0.055) / 1.055), 2.4));
}

export function rel_lum(rgb) {
  return ((0.2126 * linearize($$bc$get(rgb, "r"))) + (0.7152 * linearize($$bc$get(rgb, "g"))) + (0.0722 * linearize($$bc$get(rgb, "b"))));
}

function composite_over(fg, bg) {
  const a = $$bc$get(fg, "a");
  if (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(a, null)) || (a >= 1)))) {
    return fg;
  } else {
    const alpha = a;
    const fr = $$bc$get(fg, "r");
    const fgg = $$bc$get(fg, "g");
    const fb = $$bc$get(fg, "b");
    const br = $$bc$get(bg, "r");
    const bgg = $$bc$get(bg, "g");
    const bb = $$bc$get(bg, "b");
    return {r: ((fr * alpha) + (br * (1 - alpha))), g: ((fgg * alpha) + (bgg * (1 - alpha))), b: ((fb * alpha) + (bb * (1 - alpha))), a: 1};
  }
}

export function contrast(fg, bg) {
  const bgc = as_rgb(bg);
  const fgc = composite_over(as_rgb(fg), bgc);
  const l1 = rel_lum(fgc);
  const l2 = rel_lum(bgc);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return ((hi + 0.05) / (lo + 0.05));
}

export function large_text_p(font_size, bold) {
  return ((font_size >= 24) || ((_logical) => (_logical !== false && _logical != null ? (font_size >= 18.66) : _logical))(bold));
}

export function aa_threshold(font_size, bold) {
  return (((_truthy) => _truthy !== false && _truthy != null)(large_text_p(font_size, bold)) ? 3 : 4.5);
}

export function evaluate_box(fg, bg, font_size, bold, text) {
  const ratio = contrast(fg, bg);
  const thr = aa_threshold(font_size, bold);
  return {ratio: ratio, thr: thr, pass: (ratio >= thr), fontSize: font_size, text: text};
}

export function score_page(results) {
  const total = results.length;
  const passes = results.filter((r) => $$bc$get(r, "pass")).length;
  const sorted = results.slice().sort((a, b) => { const ar = $$bc$get(a, "ratio");
const br = $$bc$get(b, "ratio");
return (ar - br); });
  return {total: total, passes: passes, passRatio: ((total > 0) ? (passes / total) : 1), minRatio: ((total > 0) ? $$bc$get(sorted[0], "ratio") : 99), worst5: sorted.slice(0, 5)};
}
