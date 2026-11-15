import { PNG } from 'pngjs';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

export function decode_png(b64) {
  const buf = Buffer.from(b64, "base64");
  const png = PNG.sync.read(buf);
  return {width: png.width, height: png.height, data: png.data};
}

function pixel_at(data, width, px, py) {
  const i = (((py * width) + px) * 4);
  return {r: data[i], g: data[(i + 1)], b: data[(i + 2)], a: data[(i + 3)]};
}

function lum_quick(p) {
  const r = $$bc$get(p, "r");
  const g = $$bc$get(p, "g");
  const b = $$bc$get(p, "b");
  return ((0.2126 * r) + (0.7152 * g) + (0.0722 * b));
}

export function sample_backdrop(png, rect, scale) {
  const w = $$bc$get(png, "width");
  const h = $$bc$get(png, "height");
  const data = $$bc$get(png, "data");
  const rx = $$bc$get(rect, "x");
  const ry = $$bc$get(rect, "y");
  const rw = $$bc$get(rect, "w");
  const rh = $$bc$get(rect, "h");
  const x0 = Math.max(0, Math.floor((rx * scale)));
  const y0 = Math.max(0, Math.floor((ry * scale)));
  const x1 = Math.min((w - 1), Math.floor(((rx + rw) * scale)));
  const y1 = Math.min((h - 1), Math.floor(((ry + rh) * scale)));
  const cols = 7;
  const rows = 3;
  const total = (cols * rows);
  const pts = new Array();
  (() => { let k = 0; while (true) {
    if ((k < total)) { (() => { const r = Math.floor((k / cols)); const c = (k - (r * cols)); const px = Math.round((x0 + (((c + 0.5) / cols) * (x1 - x0)))); const py = Math.round((y0 + (((r + 0.5) / rows) * (y1 - y0)))); if (((_truthy) => _truthy !== false && _truthy != null)(((px >= 0) && ((px < w) && ((py >= 0) && (py < h)))))) {
  return pts.push(pixel_at(data, w, px, py));
} })(); const _recur_0 = (k + 1); k = _recur_0; continue; } else { return null; }
  } })();
  const n = pts.length;
  if (($$bc$equiv(n, 0))) {
    return {r: 255, g: 255, b: 255, a: 255};
  } else {
    const sorted = pts.sort((a, b) => (lum_quick(a) - lum_quick(b)));
    return sorted[Math.floor((n / 2))];
  }
}

export function sample_foreground(png, rect, scale) {
  const w = $$bc$get(png, "width");
  const h = $$bc$get(png, "height");
  const data = $$bc$get(png, "data");
  const rx = $$bc$get(rect, "x");
  const ry = $$bc$get(rect, "y");
  const rw = $$bc$get(rect, "w");
  const rh = $$bc$get(rect, "h");
  const x0 = Math.max(0, Math.floor((rx * scale)));
  const y0 = Math.max(0, Math.floor((ry * scale)));
  const x1 = Math.min((w - 1), Math.floor(((rx + rw) * scale)));
  const y1 = Math.min((h - 1), Math.floor(((ry + rh) * scale)));
  const cols = 16;
  const rows = 6;
  const total = (cols * rows);
  const pts = new Array();
  (() => { let k = 0; while (true) {
    if ((k < total)) { (() => { const r = Math.floor((k / cols)); const c = (k - (r * cols)); const px = Math.round((x0 + (((c + 0.5) / cols) * (x1 - x0)))); const py = Math.round((y0 + (((r + 0.5) / rows) * (y1 - y0)))); if (((_truthy) => _truthy !== false && _truthy != null)(((px >= 0) && ((px < w) && ((py >= 0) && (py < h)))))) {
  return pts.push(pixel_at(data, w, px, py));
} })(); const _recur_0 = (k + 1); k = _recur_0; continue; } else { return null; }
  } })();
  const n = pts.length;
  if (($$bc$equiv(n, 0))) {
    return {r: 0, g: 0, b: 0, a: 255};
  } else {
    const sorted = pts.sort((a, b) => (lum_quick(a) - lum_quick(b)));
    const med = lum_quick(sorted[Math.floor((n / 2))]);
    const lo = sorted[Math.floor((n * 0.05))];
    const hi = sorted[Math.min((n - 1), Math.floor((n * 0.95)))];
    return (((lum_quick(hi) - med) >= (med - lum_quick(lo))) ? hi : lo);
  }
}
