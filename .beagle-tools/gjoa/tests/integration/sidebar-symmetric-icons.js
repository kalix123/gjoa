
const probe = "\n  function walk(node, hits) {\n    if (!node) return;\n    // Recurse into shadow roots.\n    if (node.shadowRoot) walk(node.shadowRoot, hits);\n    const kids = node.children || node.childNodes || [];\n    for (const child of kids) {\n      const tag = (child.tagName || \"\").toLowerCase();\n      const cls = child.classList;\n      const isIcon =\n        tag === \"img\" || tag === \"svg\" || tag === \"moz-icon\" ||\n        (cls && (cls.contains(\"toolbarbutton-icon\") || cls.contains(\"button-icon\")));\n      if (isIcon) {\n        const r = child.getBoundingClientRect();\n        if (r.width > 0 && r.height > 0 && r.top >= 0) {\n          hits.push({\n            tag,\n            id: child.id || (child.parentElement && child.parentElement.id) || null,\n            top: r.top, bottom: r.bottom, left: r.left, width: r.width, height: r.height,\n          });\n        }\n      }\n      walk(child, hits);\n    }\n  }\n  const sidebarMain = document.getElementById(\"sidebar-container\");\n  if (!sidebarMain) return { error: \"no #sidebar-container\" };\n  const sidebarRect = sidebarMain.getBoundingClientRect();\n  const navBar = sidebarMain.querySelector(\"#nav-bar\");\n  const footerWebComponent = sidebarMain.querySelector(\":scope > sidebar-main\");\n  const topHits = [];\n  const bottomHits = [];\n  if (navBar) walk(navBar, topHits);\n  if (footerWebComponent) walk(footerWebComponent, bottomHits);\n  topHits.sort((a, b) => a.top - b.top);\n  bottomHits.sort((a, b) => a.bottom - b.bottom);\n  return {\n    sidebar: {\n      top: sidebarRect.top, bottom: sidebarRect.bottom,\n      height: sidebarRect.height, width: sidebarRect.width,\n    },\n    topIcon: topHits[0] || null,\n    bottomIcon: bottomHits.length ? bottomHits[bottomHits.length - 1] : null,\n    topCount: topHits.length,\n    bottomCount: bottomHits.length,\n    cssVar: getComputedStyle(document.documentElement).getPropertyValue(\"--gjoa-symmetric-footer\"),\n  };\n";

const TOLERANCE_PX = 1;

export const tests = [{name: "sidebar — top/bottom icon Y-deltas symmetric within ±1px", run: async (mn) => { const deadline = (Date.now() + 3000);
const r = await (async () => { let acc = {}; while (true) {
    if ((Date.now() >= deadline)) { return acc; } else { const __ = await new Promise((res) => setTimeout(res, 200)); const nr = await mn.executeScript(probe); if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? (() => { const top_icon_top = nr.topIcon.top; const sidebar_top = nr.sidebar.top; const sidebar_bottom = nr.sidebar.bottom; const bottom_icon_bottom = nr.bottomIcon.bottom; const tg = (top_icon_top - sidebar_top); const bg = (sidebar_bottom - bottom_icon_bottom); return (Math.abs((tg - bg)) <= TOLERANCE_PX); })() : _logical))(nr.sidebar) : _logical))(nr.bottomIcon) : _logical))(nr.topIcon))) { return nr; } else { const _recur_0 = nr; acc = _recur_0; continue; } }
  } })();
if ((!(!((_truthy) => _truthy !== false && _truthy != null)(r.error)))) {
  (() => { throw new Error(("".concat("probe error: ", r.error))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.sidebar))) {
  (() => { throw new Error("probe returned no sidebar rect"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.topIcon))) {
  (() => { throw new Error(("".concat("No top icon found in #sidebar-container #nav-bar (searched ", r.topCount, " candidates). ", "Result: ", JSON.stringify(r, null, 2)))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.bottomIcon))) {
  (() => { throw new Error(("".concat("No bottom icon found in #sidebar-container > sidebar-main (searched ", r.bottomCount, " candidates). ", "Result: ", JSON.stringify(r, null, 2)))); })();
}
const top_icon_top = r.topIcon.top;
const sidebar_top = r.sidebar.top;
const sidebar_bottom = r.sidebar.bottom;
const bottom_icon_bottom = r.bottomIcon.bottom;
const topGap = (top_icon_top - sidebar_top);
const bottomGap = (sidebar_bottom - bottom_icon_bottom);
const BOTTOM_OFFSET = 4;
const delta = Math.abs((bottomGap - (topGap + BOTTOM_OFFSET)));
if ((!(delta <= TOLERANCE_PX))) {
  (() => { throw new Error(("".concat("Asymmetric icon Y-deltas off target: topGap=", topGap.toFixed(2), "px ", "bottomGap=", bottomGap.toFixed(2), "px (expected bottom = top+", BOTTOM_OFFSET, ", diff=", delta.toFixed(2), "px, tolerance ±", TOLERANCE_PX, ").\n", "--gjoa-symmetric-footer=", r.cssVar, "\n", "topIcon: ", JSON.stringify(r.topIcon), "\n", "bottomIcon: ", JSON.stringify(r.bottomIcon), "\n", "sidebar: ", JSON.stringify(r.sidebar)))); })();
}
if ((!(topGap >= 2))) {
  return (() => { throw new Error(("".concat("Icons too close to top edge: topGap=", topGap.toFixed(1), "px (expected ≥2)."))); })();
} }}];

export default tests;
