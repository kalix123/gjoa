import { sleep, NAV_JS, wait_for } from '../dsl.js';
import { evaluate_box, score_page } from '../../tools/test-driver/contrast-score.js';
import { decode_png, sample_backdrop, sample_foreground } from '../../tools/test-driver/contrast-sample.js';
import { get as $$bc$get } from 'beagle/core.js';

const BASE = "http://127.0.0.1:8976/";

const BASELINES = {["mit-news"]: 0, ["hacker-news"]: 0, ["youtube"]: 0, ["wikipedia"]: 0, ["github"]: 0, ["editorial-card"]: 0, ["docs-codeblocks"]: 0, ["svg-logo"]: 0, ["dark-text-hero"]: 0};

const PREFS_JS = ("".concat("Services.prefs.setBoolPref('gjoa.darkmode.enabled', true);", " Services.prefs.setCharPref('gjoa.darkmode.mode', 'dark');", " return 'on';"));

const DARK_OFF_JS = ("".concat("Services.prefs.setBoolPref('gjoa.darkmode.enabled', false);", " Services.prefs.setBoolPref('gjoa.darkmode.invert.enabled', false);", " return 'off';"));

function snapshot_png_js(w, h) {
  return ("".concat("const done = arguments[arguments.length-1];", "(async () => { try {", "  const win = Services.wm.getMostRecentWindow('navigator:browser');", "  const wg = win.gBrowser.selectedBrowser.browsingContext.currentWindowGlobal;", "  const scale = win.devicePixelRatio || 1;", "  const W = Math.max(1, Math.round(", w, ")), H = Math.max(1, Math.round(", h, "));", "  const bm = await wg.drawSnapshot(new win.DOMRect(0,0,W,H), scale, 'rgb(255,255,255)');", "  const cv = new win.OffscreenCanvas(Math.round(W*scale), Math.round(H*scale));", "  cv.getContext('2d').drawImage(bm,0,0);", "  const buf = new Uint8Array(await (await cv.convertToBlob({type:'image/png'})).arrayBuffer());", "  let s=''; for (let i=0;i<buf.length;i+=0x8000){ s += String.fromCharCode.apply(null, buf.subarray(i,i+0x8000)); }", "  done(win.btoa(s));", "} catch(e){ done('ERR:'+(e&&e.message||e)); } })();"));
}

const ENUMERATE_JS = ("".concat("\n", "  const W = document.documentElement, boxes = [];\n", "  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);\n", "  let n;\n", "  while ((n = walker.nextNode()) && boxes.length < 400) {\n", "    const t = (n.textContent || '').trim();\n", "    if (t.length < 2) continue;\n", "    const el = n.parentElement; if (!el) continue;\n", "    const cs = getComputedStyle(el);\n", "    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;\n", "    const range = document.createRange(); range.selectNodeContents(n);\n", "    for (const r of range.getClientRects()) {\n", "      if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.right < 0) continue;\n", "      boxes.push({ x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height,\n", "        color: cs.color, fontSize: parseFloat(cs.fontSize),\n", "        bold: (parseInt(cs.fontWeight, 10) || 400) >= 600, text: t.slice(0, 40) });\n", "    }\n", "  }\n", "  return JSON.stringify({ boxes, pageWidth: W.scrollWidth, pageHeight: W.scrollHeight, dpr: window.devicePixelRatio });\n"));

async function check_fixture(mn, name) {
  const url = ("".concat(BASE, name));
  await mn.setContext("chrome");
  await mn.executeScript(DARK_OFF_JS);
  await mn.executeAsyncScript(NAV_JS, [url]);
  await sleep(500);
  await mn.setContext("content");
  await dsl.wait_for(mn, "return document.readyState === 'complete';", 8000);
  const meta = JSON.parse(await mn.executeScript(ENUMERATE_JS));
  await mn.setContext("chrome");
  await mn.executeScript(PREFS_JS);
  await mn.executeAsyncScript(NAV_JS, [url]);
  await sleep(800);
  const page_w = meta.pageWidth;
  const shot = await mn.executeAsyncScript(snapshot_png_js(page_w, meta.pageHeight), []);
  const __ = (((_truthy) => _truthy !== false && _truthy != null)(shot.startsWith("ERR:")) ? (() => { if ((!((_truthy) => _truthy !== false && _truthy != null)(false))) {
  return (() => { throw new Error(("".concat(name, " drawSnapshot capture failed: ", shot))); })();
} })() : null);
  const png = decode_png(shot);
  const png_w = $$bc$get(png, "width");
  const scale = ((page_w > 0) ? (png_w / page_w) : 1);
  const boxes = meta.boxes;
  const results = boxes.map((b) => { const rect = {x: b.x, y: b.y, w: b.w, h: b.h};
const bg = sample_backdrop(png, rect, scale);
const fg = sample_foreground(png, rect, scale);
return evaluate_box(fg, bg, b.fontSize, b.bold, b.text); });
  const score = score_page(results);
  const ratio = $$bc$get(score, "passRatio");
  const baseline = ((_logical) => (_logical !== false && _logical != null ? _logical : 0))($$bc$get(BASELINES, name));
  console.log(("".concat("\n[contrast] ", name, ": passRatio=", ratio.toFixed(3), " (", $$bc$get(score, "passes"), "/", $$bc$get(score, "total"), ") minRatio=", $$bc$get(score, "minRatio").toFixed(2), " baseline=", baseline)));
  $$bc$get(score, "worst5").forEach((w) => {
  if ((!((_truthy) => _truthy !== false && _truthy != null)($$bc$get(w, "pass")))) {
    console.log(("".concat("    FAIL box ratio=", $$bc$get(w, "ratio").toFixed(2), " need=", $$bc$get(w, "thr"), " \"", $$bc$get(w, "text"), "\"")));
  }
});
  if ((!(ratio >= baseline))) {
    return (() => { throw new Error(("".concat(name, " contrast regressed: passRatio ", ratio.toFixed(3), " < baseline ", baseline))); })();
  }
}

export const tests = [{name: "contrast: mit-news (image-hero — the failing baseline)", run: async (mn, ctx) => await check_fixture(mn, "mit-news")}, {name: "contrast: hacker-news (white/orange bars)", run: async (mn, ctx) => await check_fixture(mn, "hacker-news")}, {name: "contrast: youtube (rounded image cards)", run: async (mn, ctx) => await check_fixture(mn, "youtube")}, {name: "contrast: wikipedia (themeless-light, must invert clean)", run: async (mn, ctx) => await check_fixture(mn, "wikipedia")}, {name: "contrast: github (native-dark capable)", run: async (mn, ctx) => await check_fixture(mn, "github")}, {name: "contrast: editorial-card (text over image+gradient)", run: async (mn, ctx) => await check_fixture(mn, "editorial-card")}, {name: "contrast: docs-codeblocks (small colored tokens)", run: async (mn, ctx) => await check_fixture(mn, "docs-codeblocks")}, {name: "contrast: svg-logo (currentColor SVG text)", run: async (mn, ctx) => await check_fixture(mn, "svg-logo")}, {name: "contrast: dark-text-hero (R3 regression vector)", run: async (mn, ctx) => await check_fixture(mn, "dark-text-hero")}];

export default tests;
