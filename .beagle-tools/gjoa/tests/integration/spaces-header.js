import { wait_for } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

async function reset_spaces(mn) {
  return await mn.executeScript("\n    const main = window.Spaces.list().find(s => s.name === \"Main\")\n              || window.Spaces.list()[0];\n    window.Spaces.setActive(main.id);\n    for (const s of [...window.Spaces.list()]) {\n      if (s.id !== main.id) window.Spaces.delete(s.id);\n    }\n  ");
}

export const tests = [{name: "Spaces — :space creates and switches", run: async (mn) => { await dsl.wait_for(mn, "return !!window.gjoaTest && !!window.gjoaTest.vim && !!window.Spaces;", 1500);
await reset_spaces(mn);
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space new Reading\");");
const r = await mn.executeScript("\n        const list = window.Spaces.list();\n        return {\n          count: list.length,\n          activeName: window.Spaces.active().name,\n          names: list.map(s => s.name),\n        };\n      ");
const __a____scope__3__1__3__0__4__6__2__1__0 = r.count;
const __e____scope__3__1__3__0__4__6__2__1__3 = 2;
if ((!($$bc$equiv(__a____scope__3__1__3__0__4__6__2__1__0, __e____scope__3__1__3__0__4__6__2__1__3)))) {
  (() => { throw new Error(("".concat(("".concat("expected 2 spaces after :space new, got ", r.count, " (", r.names.join(","), ")")), " — expected ", __e____scope__3__1__3__0__4__6__2__1__3, ", got ", __a____scope__3__1__3__0__4__6__2__1__0))); })();
}
const __a____scope__3__1__3__0__4__6__3__1__0 = r.activeName;
const __e____scope__3__1__3__0__4__6__3__1__3 = "Reading";
if ((!($$bc$equiv(__a____scope__3__1__3__0__4__6__3__1__0, __e____scope__3__1__3__0__4__6__3__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("expected active=\"Reading\", got \"", r.activeName, "\"")), " — expected ", __e____scope__3__1__3__0__4__6__3__1__3, ", got ", __a____scope__3__1__3__0__4__6__3__1__0))); })();
} }}, {name: "Spaces header — element exists in sidebar above tab panel", run: async (mn) => { await reset_spaces(mn);
const probe = await mn.executeScript("\n        const header = document.getElementById(\"gjoa-space-header\");\n        const label = document.getElementById(\"gjoa-space-header-label\");\n        const panel = document.getElementById(\"gjoa-tab-panel\");\n        const pinned = document.getElementById(\"gjoa-pinned-container\");\n        function precedes(a, b) {\n          if (!a || !b) return false;\n          const cmp = a.compareDocumentPosition(b);\n          return !!(cmp & Node.DOCUMENT_POSITION_FOLLOWING);\n        }\n        return {\n          headerExists: !!header,\n          labelText: label ? (label.getAttribute(\"value\") || label.textContent) : null,\n          precedesPanel: precedes(header, panel),\n          precedesPinned: precedes(header, pinned),\n        };\n      ");
if ((!((_truthy) => _truthy !== false && _truthy != null)(probe.headerExists))) {
  (() => { throw new Error("#gjoa-space-header not in DOM"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(probe.precedesPanel))) {
  (() => { throw new Error("#gjoa-space-header is not before #gjoa-tab-panel in DOM order"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(probe.precedesPinned))) {
  (() => { throw new Error("#gjoa-space-header is not before #gjoa-pinned-container in DOM order"); })();
}
const __a____scope__3__1__3__1__4__4__5__1__0 = probe.labelText;
const __e____scope__3__1__3__1__4__4__5__1__3 = "Main";
if ((!($$bc$equiv(__a____scope__3__1__3__1__4__4__5__1__0, __e____scope__3__1__3__1__4__4__5__1__3)))) {
  return (() => { throw new Error(("".concat(("".concat("header label should read \"Main\" on fresh state, got \"", probe.labelText, "\"")), " — expected ", __e____scope__3__1__3__1__4__4__5__1__3, ", got ", __a____scope__3__1__3__1__4__4__5__1__0))); })();
} }}, {name: "Spaces header — updates to the new name on :space switch", run: async (mn) => { await reset_spaces(mn);
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space new Project\");");
await dsl.wait_for(mn, "\n        const l = document.getElementById(\"gjoa-space-header-label\");\n        return !!l && (l.getAttribute(\"value\") || l.textContent) === \"Project\";\n      ", 1500);
await mn.executeScript("\n        const main = window.Spaces.list().find(s => s.name === \"Main\");\n        window.Spaces.setActive(main.id);\n      ");
return await dsl.wait_for(mn, "\n        const l = document.getElementById(\"gjoa-space-header-label\");\n        return !!l && (l.getAttribute(\"value\") || l.textContent) === \"Main\";\n      ", 1500); }}, {name: "Spaces header — aligned with content rail (matches nav-bar icon column)", run: async (mn) => { await reset_spaces(mn);
const r = await mn.executeScript("\n        const header = document.getElementById(\"gjoa-space-header\");\n        const label = document.getElementById(\"gjoa-space-header-label\");\n        const sidebar = document.getElementById(\"sidebar-container\");\n        const navIcons = sidebar?.querySelectorAll(\"#nav-bar .toolbarbutton-icon, #nav-bar image\");\n        let firstNavIconLeft = null;\n        if (navIcons) {\n          let minLeft = Infinity;\n          for (const ic of navIcons) {\n            const rect = ic.getBoundingClientRect();\n            if (rect.width > 0 && rect.left < minLeft) minLeft = rect.left;\n          }\n          if (minLeft !== Infinity) firstNavIconLeft = minLeft;\n        }\n        return {\n          headerLeft: header.getBoundingClientRect().left,\n          labelLeft: label.getBoundingClientRect().left,\n          firstNavIconLeft,\n          sidebarLeft: sidebar.getBoundingClientRect().left,\n        };\n      ");
const header_left = r.headerLeft;
const sidebar_left = r.sidebarLeft;
const header_inset = (header_left - sidebar_left);
if ((!(!(header_inset < 6)))) {
  (() => { throw new Error(("".concat("Header flush-left against sidebar edge: headerLeft=", r.headerLeft, " ", "sidebarLeft=", r.sidebarLeft, " inset=", header_inset, "px (expected ≥6px)."))); })();
}
if ((!($$bc$equiv(r.firstNavIconLeft, null)))) {
  const label_left = r.labelLeft;
  const first_nav_icon_left = r.firstNavIconLeft;
  const drift = Math.abs((label_left - first_nav_icon_left));
  if ((!(!(drift > 24)))) {
    return (() => { throw new Error(("".concat("Header label not aligned with nav-bar icons: labelLeft=", r.labelLeft, " ", "firstNavIconLeft=", r.firstNavIconLeft, " drift=", drift, "px (expected ≤24px)."))); })();
  }
} }}, {name: "Spaces header — updates on :space rename of the active space", run: async (mn) => { await reset_spaces(mn);
await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space rename Inbox\");");
await dsl.wait_for(mn, "\n        const l = document.getElementById(\"gjoa-space-header-label\");\n        return !!l && (l.getAttribute(\"value\") || l.textContent) === \"Inbox\";\n      ", 1500);
return await mn.executeScript("window.gjoaTest.vim.runExCommand(\"space rename Main\");"); }}];

export default tests;
