import { wait_for } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

async function ensure_sidebar_expanded(mn) {
  await mn.executeScript("\n    const sm = document.getElementById(\"sidebar-container\");\n    if (sm && !sm.hasAttribute(\"sidebar-launcher-expanded\")) {\n      sm.setAttribute(\"sidebar-launcher-expanded\", \"true\");\n    }\n    return true;");
  await dsl.wait_for(mn, "return !!document.querySelector(\"#gjoa-tab-panel\");");
  return null;
}

const ROWS_JS = "\n  return [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row, #gjoa-tab-panel .gjoa-group-row\")]\n    .map(r => ({\n      kind: r.classList.contains(\"gjoa-group-row\") ? \"group\" : \"tab\",\n      level: Math.max(0, Math.round(((parseFloat(r.style.paddingInlineStart||\"0\")||0) - 8) / 14)),\n      label: r.querySelector(\".gjoa-tab-label, .gjoa-group-name\")?.textContent ?? \"\",\n    }));";

function drag_script(src, tgt) {
  return ("".concat("\n    const rows = [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row, #gjoa-tab-panel .gjoa-group-row\")];\n    const source = rows[", src, "]; const target = rows[", tgt, "];\n    if (!source || !target) throw new Error(\"row missing src=", src, " tgt=", tgt, " len=\"+rows.length);\n    const dt = new DataTransfer();\n    const fire = (el,type,x,y) => el.dispatchEvent(new DragEvent(type,{bubbles:true,cancelable:true,view:window,clientX:x,clientY:y,screenX:x+1000,screenY:y+1000,dataTransfer:dt}));\n    const sR = source.getBoundingClientRect();\n    fire(source,\"dragstart\",sR.left+5,sR.top+5);\n    const tR = target.getBoundingClientRect();\n    const cY = tR.top + tR.height/2; const cX = tR.left + tR.width/2;\n    fire(target,\"dragenter\",cX,cY); fire(target,\"dragover\",cX,cY);\n    fire(target,\"drop\",cX,cY); fire(source,\"dragend\",cX,cY);\n    return true;"));
}

function add_marked_tab_js(marker) {
  return ("".concat("\n    const p = Services.scriptSecurityManager.getSystemPrincipal();\n    const t = gBrowser.addTab(\"about:blank\", { triggeringPrincipal: p });\n    t.setAttribute(\"gjoa-test-marker\", \"", marker, "\");\n    window.gjoaTest.rows.scheduleTreeResync();\n    window.gjoaTest.rows.updateVisibility();\n    return true;"));
}

function marked_row_ready_js(marker) {
  return ("".concat("\n    const t = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"", marker, "\");\n    return !!(t && window.gjoaTest.rowOf.get(t));"));
}

function marked_pinned_js(marker) {
  return ("".concat("\n    const t = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === \"", marker, "\");\n    const r = t && window.gjoaTest.rowOf.get(t);\n    const pc = document.getElementById(\"gjoa-pinned-container\");\n    const panel = document.getElementById(\"gjoa-tab-panel\");\n    return !!(t && t.pinned && r && pc && pc.contains(r) && !panel.contains(r));"));
}

function pin_drag_js(marker, mode) {
  return ("".concat("\n    const M = \"", marker, "\"; const mode = \"", mode, "\";\n    const tab = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === M);\n    const row = tab && window.gjoaTest.rowOf.get(tab);\n    const pc = document.getElementById(\"gjoa-pinned-container\");\n    if (!tab || !row || !pc) return { error: \"setup: tab/row/pinned-container missing\" };\n    const dt = new DataTransfer();\n    const fire = (el,type,x,y) => el.dispatchEvent(new DragEvent(type,{bubbles:true,cancelable:true,view:window,clientX:x,clientY:y,screenX:x+1000,screenY:y+1000,dataTransfer:dt}));\n    const sr = row.getBoundingClientRect();\n    fire(row, \"dragstart\", sr.left+5, sr.top+5);\n    const pr = pc.getBoundingClientRect();\n    const pinnedRows = [...pc.querySelectorAll(\".gjoa-tab-row:not([hidden])\")];\n    const last = pinnedRows[pinnedRows.length - 1];\n    const lastBottom = last ? last.getBoundingClientRect().bottom : null;\n    let target = pc, x = pr.left + pr.width/2, y = pr.top + pr.height/2;\n    if (mode === \"band\") { y = pr.bottom - 4; }\n    else if (mode === \"label\") {\n      if (!last) return { error: \"label mode needs an existing pinned row\" };\n      const lr = last.getBoundingClientRect();\n      target = last.querySelector(\".gjoa-tab-label\") || last;\n      x = lr.left + lr.width/2; y = lr.top + lr.height/2;\n    }\n    fire(target, \"dragenter\", x, y); fire(target, \"dragover\", x, y);\n    const dropPrevented = !fire(target, \"drop\", x, y);\n    fire(row, \"dragend\", x, y);\n    return { ok: true, mode, x, y, pinnedRowsBefore: pinnedRows.length,\n             containerRect: { top: pr.top, bottom: pr.bottom, height: pr.height },\n             lastBottom, belowLastRow: lastBottom !== null && y > lastBottom,\n             targetTag: target.className || target.localName, dropPrevented };"));
}

function drop_onto_pinned_js(marker) {
  return ("".concat("\n    const M = \"", marker, "\";\n    const doc = document;\n    const pc = doc.getElementById(\"gjoa-pinned-container\");\n    const tab = [...gBrowser.tabs].find(t => t.getAttribute(\"gjoa-test-marker\") === M);\n    const row = tab && window.gjoaTest.rowOf.get(tab);\n    const shown = [...pc.querySelectorAll(\".gjoa-tab-row:not([hidden])\")];\n    const target = shown[shown.length - 1];\n    if (!tab || !row || !target) return { error: \"setup: tab/row/pinned-row missing\" };\n    const dt = new DataTransfer();\n    const mk = (type,x,y,rel) => new DragEvent(type,{bubbles:true,cancelable:true,view:window,\n        clientX:x,clientY:y,screenX:x+1000,screenY:y+1000,dataTransfer:dt,relatedTarget:rel||null});\n    const sr = row.getBoundingClientRect();\n    const x0 = sr.left + sr.width/2, y0 = sr.top + sr.height/2;\n    row.dispatchEvent(mk(\"dragstart\", x0, y0));\n    const tr = target.getBoundingClientRect();          // AFTER dragstart: the strip reflows\n    const x1 = tr.left + tr.width/2, y1 = tr.top + tr.height/2;\n    let cur = null, accepted = false, indicatorHits = 0;\n    const tick = (x, y) => {\n      const hit = doc.elementFromPoint(x, y);\n      if (!hit) { cur = null; accepted = false; return; }\n      if (hit.id === \"gjoa-drop-indicator\") indicatorHits++;\n      if (hit !== cur) { hit.dispatchEvent(mk(\"dragenter\", x, y, cur));\n                         if (cur) cur.dispatchEvent(mk(\"dragleave\", x, y, hit));\n                         cur = hit; }\n      accepted = !hit.dispatchEvent(mk(\"dragover\", x, y));\n    };\n    const n = Math.max(1, Math.ceil(Math.hypot(x1-x0, y1-y0) / 4));\n    for (let i = 1; i <= n; i++) tick(x0 + (x1-x0)*i/n, y0 + (y1-y0)*i/n);\n    for (let i = 0; i < 4; i++) tick(x1, y1);           // pointer at rest\n    // The indicator paints ON the drop line, so if it hit-tests it steals the\n    // pointer from the row underneath and the drop dies in a 2px dead band.\n    const ind = doc.getElementById(\"gjoa-drop-indicator\");\n    let indProbe = { present: false };\n    if (ind) {\n      const ir = ind.getBoundingClientRect();\n      const px = ir.left + Math.max(ir.width, 1) / 2, py = ir.top + Math.max(ir.height, 1) / 2;\n      const h = doc.elementFromPoint(px, py);\n      indProbe = { present: true, isIndicator: h === ind, at: [px, py],\n                   hit: h ? (h.id ? \"#\"+h.id : \".\"+String(h.className).split(\" \")[0]) : \"null\",\n                   acceptsDragover: h ? !h.dispatchEvent(mk(\"dragover\", px, py)) : null };\n    }\n    let dropped = false;\n    if (accepted && cur) { cur.dispatchEvent(mk(\"drop\", x1, y1)); dropped = true; }\n    row.dispatchEvent(mk(\"dragend\", x1, y1));\n    return { ok: true, dropped, accepted, indicatorHits, indProbe,\n             targetTabPinned: !!(target._tab && target._tab.pinned),\n             hit: cur ? (cur.id ? \"#\"+cur.id : \".\"+String(cur.className).split(\" \")[0]) : \"null\" };"));
}

const PINNED_SECTION_HONEST = "\n  const pc = document.getElementById(\"gjoa-pinned-container\");\n  const rows = [...pc.querySelectorAll(\".gjoa-tab-row:not([hidden])\")];\n  return rows.filter(r => !(r._tab && r._tab.pinned))\n             .map(r => r._tab ? (r._tab.getAttribute(\"gjoa-test-marker\") || r._tab.label) : \"?\");";

const CLEANUP_PINNED = "\n  for (const t of [...gBrowser.tabs]) {\n    if (t.getAttribute(\"gjoa-test-marker\")) {\n      try { if (t.pinned) gBrowser.unpinTab(t); } catch (e) {}\n      try { gBrowser.removeTab(t); } catch (e) {}\n    }\n  }\n  return true;";

export const tests = [{name: "drag: tab ABOVE an (empty) group dropped INTO it lands BELOW + indented", run: async (mn) => { await ensure_sidebar_expanded(mn);
await mn.executeScript("Services.prefs.setCharPref(\"gjoa.tabs.newTabPosition\", \"root\");");
await mn.executeScript("\n        const sp = Services.scriptSecurityManager.getSystemPrincipal();\n        gBrowser.addTab(\"about:blank?abovegrp\", { triggeringPrincipal: sp });\n        return true;");
await dsl.wait_for(mn, "return [...document.querySelectorAll('#gjoa-tab-panel .gjoa-tab-label')].some(e=>e.textContent.includes('abovegrp'));");
await mn.executeScript("\n        const panel = document.getElementById(\"gjoa-tab-panel\");\n        const spacer = panel.querySelector(\"[gjoa-spacer], .gjoa-spacer\") || panel.firstChild;\n        const rect = (spacer || panel).getBoundingClientRect();\n        (spacer || panel).dispatchEvent(new MouseEvent(\"contextmenu\", { bubbles:true, cancelable:true, button:2, clientX:rect.left+4, clientY:rect.top+4 }));\n        const menu = document.getElementById(\"gjoa-panel-menu\");\n        const item = [...menu.querySelectorAll(\"menuitem\")].find(mi => mi.getAttribute(\"label\") === \"New Tab Group\");\n        item.dispatchEvent(new Event(\"command\", { bubbles:true }));\n        return true;");
await dsl.wait_for(mn, "return document.querySelectorAll('#gjoa-tab-panel .gjoa-group-row').length >= 1;");
const rows = await mn.executeScript(ROWS_JS);
const grp_idx = (() => { let i = 0; let acc = -1; while (true) {
    if ((i < rows.length)) { const _recur_0 = (i + 1); const _recur_1 = (($$bc$equiv(rows[i].kind, "group")) ? i : acc); i = _recur_0; acc = _recur_1; continue; } else { return acc; }
  } })();
const src_idx = rows.findIndex((r) => r.label.includes("abovegrp"));
if (((_truthy) => _truthy !== false && _truthy != null)(((grp_idx < 0) || (src_idx < 0)))) {
  (() => { throw new Error(("".concat("setup: grpIdx=", grp_idx, " srcIdx=", src_idx, " rows=", JSON.stringify(rows)))); })();
}
if ((src_idx >= grp_idx)) {
  (() => { throw new Error(("".concat("setup: marked tab must be ABOVE the group (srcIdx=", src_idx, " grpIdx=", grp_idx, ")"))); })();
}
await mn.executeScript(drag_script(src_idx, grp_idx));
await new Promise((r) => setTimeout(() => r(), 250));
const after = await mn.executeScript(ROWS_JS);
const grp2 = (() => { let i = 0; let acc = -1; while (true) {
    if ((i < after.length)) { const _recur_0 = (i + 1); const _recur_1 = (($$bc$equiv(after[i].kind, "group")) ? i : acc); i = _recur_0; acc = _recur_1; continue; } else { return acc; }
  } })();
const src2 = after.findIndex((r) => r.label.includes("abovegrp"));
if (((_truthy) => _truthy !== false && _truthy != null)(((grp2 < 0) || (src2 < 0)))) {
  (() => { throw new Error(("".concat("after: grpIdx=", grp2, " srcIdx=", src2, " rows=", JSON.stringify(after)))); })();
}
if ((!(src2 > grp2))) {
  (() => { throw new Error(("".concat("dropped tab must render BELOW the group, not above (tabIdx=", src2, " groupIdx=", grp2, ")"))); })();
}
if ((!(after[src2].level > after[grp2].level))) {
  return (() => { throw new Error(("".concat("dropped tab must be indented as a child of the group (tabLevel=", after[src2].level, " groupLevel=", after[grp2].level, ")"))); })();
} }}, {name: "drag: unpinned tab dropped on the pinned section pins it", run: async (mn) => { await ensure_sidebar_expanded(mn);
await mn.executeScript(CLEANUP_PINNED);
await await dsl.wait_for(mn, "return document.querySelectorAll('#gjoa-pinned-container .gjoa-tab-row').length === 0;", 3000);
await mn.executeScript(add_marked_tab_js("pinguard-a"));
await await dsl.wait_for(mn, marked_row_ready_js("pinguard-a"), 3000);
const ra = await mn.executeScript(pin_drag_js("pinguard-a", "centre"));
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(ra.error)))) {
  (() => { throw new Error(("".concat("(a) ", ra.error))); })();
}
if ((!($$bc$equiv(ra.pinnedRowsBefore, 0)))) {
  (() => { throw new Error(("".concat("(a) scenario needs an EMPTY pinned container, saw ", ra.pinnedRowsBefore, " rows. ", JSON.stringify(ra)))); })();
}
await await dsl.wait_for(mn, marked_pinned_js("pinguard-a"), 3000);
await mn.executeScript(add_marked_tab_js("pinguard-b"));
await await dsl.wait_for(mn, marked_row_ready_js("pinguard-b"), 3000);
const rb = await mn.executeScript(pin_drag_js("pinguard-b", "band"));
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(rb.error)))) {
  (() => { throw new Error(("".concat("(b) ", rb.error))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(rb.belowLastRow))) {
  (() => { throw new Error(("".concat("(b) aim point y=", rb.y, " is NOT below the last pinned row's bottom ", rb.lastBottom, " — the scenario stopped covering the divider band. ", JSON.stringify(rb)))); })();
}
await await dsl.wait_for(mn, marked_pinned_js("pinguard-b"), 3000);
await mn.executeScript(add_marked_tab_js("pinguard-c"));
await await dsl.wait_for(mn, marked_row_ready_js("pinguard-c"), 3000);
const rc = await mn.executeScript(pin_drag_js("pinguard-c", "label"));
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(rc.error)))) {
  (() => { throw new Error(("".concat("(c) ", rc.error))); })();
}
await await dsl.wait_for(mn, marked_pinned_js("pinguard-c"), 3000);
return await mn.executeScript(CLEANUP_PINNED); }}, {name: "drag: dropping an unpinned tab onto a pinned tab pins it", run: async (mn) => { await ensure_sidebar_expanded(mn);
await mn.executeScript(CLEANUP_PINNED);
await await dsl.wait_for(mn, "return document.querySelectorAll('#gjoa-pinned-container .gjoa-tab-row').length === 0;", 3000);
await mn.executeScript(add_marked_tab_js("pintgt"));
await await dsl.wait_for(mn, marked_row_ready_js("pintgt"), 3000);
await mn.executeScript(add_marked_tab_js("pinbounce"));
await await dsl.wait_for(mn, marked_row_ready_js("pinbounce"), 3000);
await mn.executeScript("\n        const pick = m => [...gBrowser.tabs].find(t => t.getAttribute('gjoa-test-marker') === m);\n        gBrowser.pinTab(pick('pintgt'));\n        gBrowser.pinTab(pick('pinbounce'));\n        gBrowser.unpinTab(pick('pinbounce'));\n        return true;");
await await dsl.wait_for(mn, marked_pinned_js("pintgt"), 3000);
await mn.executeScript(add_marked_tab_js("pindrag"));
await await dsl.wait_for(mn, marked_row_ready_js("pindrag"), 3000);
const r = await mn.executeScript(drop_onto_pinned_js("pindrag"));
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(r.error)))) {
  (() => { throw new Error(("".concat("gesture: ", r.error))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.accepted))) {
  (() => { throw new Error(("".concat("the pointer at rest on a pinned tab must be a valid drop target — the ", "last dragover was refused on ", r.hit, ", so a real browser fires no ", "drop at all. ", JSON.stringify(r)))); })();
}
if ((!($$bc$equiv(r.indicatorHits, 0)))) {
  (() => { throw new Error(("".concat("#gjoa-drop-indicator hit-tested ", r.indicatorHits, " times along the drag ", "path — it must carry pointer-events:none or it eats the drop under it. ", JSON.stringify(r)))); })();
}
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? r.indProbe.isIndicator : _logical))(r.indProbe.present))))) {
  (() => { throw new Error(("".concat("elementFromPoint at the indicator's own line returned the indicator itself ", "— that line is a dead band where drops vanish. ", JSON.stringify(r.indProbe)))); })();
}
await await dsl.wait_for(mn, marked_pinned_js("pindrag"), 3000);
const liars = await mn.executeScript(PINNED_SECTION_HONEST);
if ((!($$bc$equiv(liars.length, 0)))) {
  (() => { throw new Error(("".concat("the pinned section is showing rows whose tabs are NOT pinned: ", JSON.stringify(liars)))); })();
}
return await mn.executeScript(CLEANUP_PINNED); }}];

export default tests;
