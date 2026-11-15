import { wait_for } from '../dsl.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

function wait_for_rows(mn, n) {
  return wait_for(mn, ("".concat("return document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row, #gjoa-tab-panel-pinned .gjoa-tab-row\").length >= ", n, ";")), null);
}

function build_drag_script(opts) {
  const source_index = opts.sourceIndex;
  const target_index = opts.targetIndex;
  const position = opts.position;
  return ("".concat("\n", "    const rows = [...document.querySelectorAll(\".gjoa-tab-row, .gjoa-group-row\")];\n", "    const source = rows[", source_index, "];\n", "    const target = rows[", target_index, "];\n", "    if (!source || !target) {\n", "      throw new Error(\"source or target row missing — sourceIndex=", source_index, " targetIndex=", target_index, " rows.length=\" + rows.length);\n", "    }\n", "    const tRect = target.getBoundingClientRect();\n", "    const yByPosition = {\n", "      before: tRect.top + 2,\n", "      after:  tRect.bottom - 2,\n", "      into:   tRect.top + (tRect.height / 2),\n", "    };\n", "    const clientY = yByPosition[", JSON.stringify(position), "];\n", "    const clientX = tRect.left + (tRect.width / 2);\n", "    const dt = new DataTransfer();\n", "    function fire(el, type, x, y) {\n", "      el.dispatchEvent(new DragEvent(type, {\n", "        bubbles: true, cancelable: true, view: window,\n", "        clientX: x, clientY: y, dataTransfer: dt,\n", "      }));\n", "    }\n", "    const sRect = source.getBoundingClientRect();\n", "    fire(source, \"dragstart\", sRect.left + 5, sRect.top + 5);\n", "    fire(target, \"dragenter\", clientX, clientY);\n", "    fire(target, \"dragover\",  clientX, clientY);\n", "    fire(target, \"drop\",      clientX, clientY);\n", "    fire(source, \"dragend\",   clientX, clientY);\n", "    return true;\n", "  "));
}

const READ_TREE_SCRIPT = "\n  const INDENT = 14;\n  const rows = [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row, #gjoa-tab-panel .gjoa-group-row\")];\n  return rows.map(r => {\n    const padPx = parseFloat(r.style.paddingInlineStart || \"0\") || 0;\n    const level = Math.max(0, Math.round((padPx - 8) / INDENT));\n    const kind = r.classList.contains(\"gjoa-group-row\") ? \"group\" : \"tab\";\n    const labelEl = r.querySelector(\".gjoa-tab-label, .gjoa-group-name\");\n    return [level, kind, labelEl?.textContent ?? r.getAttribute(\"aria-label\") ?? \"\"];\n  });\n";

async function read_tree(mn) {
  return await mn.executeScript(READ_TREE_SCRIPT);
}

async function ensure_sidebar_expanded(mn) {
  await mn.executeScript("\n    const sm = document.getElementById(\"sidebar-container\");\n    if (sm && !sm.hasAttribute(\"sidebar-launcher-expanded\")) {\n      sm.setAttribute(\"sidebar-launcher-expanded\", \"true\");\n    }\n    return true;\n  ");
  await dsl.wait_for(mn, "return !!document.querySelector(\"#gjoa-tab-panel\");");
  return null;
}

export const tests = [{name: "#11 Create Group on parent composes parent + subtree into the new group", run: async (mn) => { await ensure_sidebar_expanded(mn);
await mn.executeScript("\n        const sp = Services.scriptSecurityManager.getSystemPrincipal();\n        const parent = gBrowser.addTab(\"about:blank\", { triggeringPrincipal: sp });\n        const childA = gBrowser.addTab(\"about:blank\", { triggeringPrincipal: sp });\n        const childB = gBrowser.addTab(\"about:blank\", { triggeringPrincipal: sp });\n        // Force tree via internal API: we don't have one exposed, so we set\n        // the parentId via the persisted XUL attribute then poke a resync.\n        // The tabs module will pick up the IDs the next time it reads\n        // treeData. We rely on the test seeing the right SUBTREE shape by\n        // visually constructing it: append children under the parent's\n        // panel row by inserting a sibling-tab call that DOES set parentId.\n        const td_p = parent._td || null;  // unused; we drive via menu directly\n        gBrowser.selectedTab = parent;\n        return true;\n      ");
await wait_for_rows(mn, 4);
await mn.executeScript("\n        // Close the children we just made — the test cares about a specific\n        // tree shape, not these placeholders.\n        for (const t of [...gBrowser.tabs]) {\n          if (t._td) continue;\n          if (t.linkedBrowser?.currentURI?.spec === \"about:blank\" &&\n              !t.selected && t !== gBrowser.tabs[0]) {\n            gBrowser.removeTab(t);\n          }\n        }\n        return true;\n      ");
await mn.executeScript("Services.prefs.setCharPref(\"gjoa.tabs.newTabPosition\", \"child\");");
await mn.executeScript("\n        const sp = Services.scriptSecurityManager.getSystemPrincipal();\n        const parent = gBrowser.addTab(\"about:blank?p\", { triggeringPrincipal: sp });\n        gBrowser.selectedTab = parent;\n        return true;\n      ");
await dsl.wait_for(mn, "\n        return [...gBrowser.tabs].some(t =>\n          t.linkedBrowser?.currentURI?.spec === \"about:blank?p\");\n      ");
await mn.executeScript("\n        const sp = Services.scriptSecurityManager.getSystemPrincipal();\n        gBrowser.addTab(\"about:blank?a\", { triggeringPrincipal: sp });\n        return true;\n      ");
await mn.executeScript("\n        const sp = Services.scriptSecurityManager.getSystemPrincipal();\n        gBrowser.addTab(\"about:blank?b\", { triggeringPrincipal: sp });\n        return true;\n      ");
await wait_for_rows(mn, 4);
const before = await read_tree(mn);
const triggered = await mn.executeScript("\n        const parentTab = [...gBrowser.tabs].find(t =>\n          t.linkedBrowser?.currentURI?.spec === \"about:blank?p\");\n        if (!parentTab) throw new Error(\"parent tab not found\");\n        // The menu's createGroupItem reads state.contextTab from the tabs\n        // module's closure-private state. We can reach it through the\n        // contextmenu event the row's listener installs: simulate a real\n        // contextmenu on the parent row, then click the menu item.\n        const row = document.querySelector('.gjoa-tab-row[selected=\"true\"]')\n                 || [...document.querySelectorAll(\".gjoa-tab-row\")]\n                       .find(r => {\n                         const lbl = r.querySelector(\".gjoa-tab-label\");\n                         return lbl?.textContent?.includes(\"about:blank?p\");\n                       });\n        if (!row) {\n          // Fallback: just find the row whose underlying tab.linkedBrowser\n          // URL matches.\n          throw new Error(\"parent row not found in DOM\");\n        }\n        // Dispatch a contextmenu event on the row so the listener captures\n        // state.contextTab. The menu opens but we don't need to wait — the\n        // click handler synchronously sets contextTab.\n        row.dispatchEvent(new MouseEvent(\"contextmenu\", {\n          bubbles: true, cancelable: true, button: 2,\n          clientX: row.getBoundingClientRect().left + 5,\n          clientY: row.getBoundingClientRect().top + 5,\n        }));\n        const menu = document.getElementById(\"gjoa-tab-menu\");\n        if (!menu) throw new Error(\"gjoa-tab-menu missing\");\n        const item = [...menu.querySelectorAll(\"menuitem\")]\n          .find(mi => mi.getAttribute(\"label\") === \"Create Group\");\n        if (!item) throw new Error(\"Create Group menuitem missing\");\n        // Click the menuitem — fires the command handler that builds the group.\n        item.dispatchEvent(new Event(\"command\", { bubbles: true }));\n        return true;\n      ");
if ((!triggered)) {
  (() => { throw new Error("Create Group menu click didn't fire"); })();
}
await new Promise((r) => setTimeout(() => r(), 200));
const after = await read_tree(mn);
const group_idx = after.findIndex((row) => ($$bc$equiv(row[1], "group")));
if ((group_idx < 0)) {
  (() => { throw new Error(("".concat("expected a group row in the tree after Create Group. ", "before=", JSON.stringify(before), ", after=", JSON.stringify(after)))); })();
}
const group_level = after[group_idx][0];
const parent_idx = after.findIndex((row) => (($$bc$equiv(row[1], "tab")) && row[2].includes("about:blank?p")));
const a_idx = after.findIndex((row) => (($$bc$equiv(row[1], "tab")) && row[2].includes("about:blank?a")));
const b_idx = after.findIndex((row) => (($$bc$equiv(row[1], "tab")) && row[2].includes("about:blank?b")));
if (((_truthy) => _truthy !== false && _truthy != null)(((parent_idx < 0) || ((a_idx < 0) || (b_idx < 0))))) {
  (() => { throw new Error(("".concat("tabs missing in after-tree: ", JSON.stringify(after)))); })();
}
const expected = (group_level + 1);
if ((!($$bc$equiv(after[parent_idx][0], expected)))) {
  (() => { throw new Error(("".concat("parent tab level should be ", expected, " (group.level + 1), ", "got ", after[parent_idx][0], ". tree=", JSON.stringify(after)))); })();
}
if (((_truthy) => _truthy !== false && _truthy != null)(((after[a_idx][0] <= expected) || (after[b_idx][0] <= expected)))) {
  (() => { throw new Error(("".concat("children should be indented deeper than parent (", expected, "), ", "got A=", after[a_idx][0], " B=", after[b_idx][0], ". ", "tree=", JSON.stringify(after)))); })();
}
if ((group_idx >= parent_idx)) {
  return (() => { throw new Error(("".concat("group should be inserted BEFORE the parent tab. ", "groupIdx=", group_idx, " parentIdx=", parent_idx, ". ", "tree=", JSON.stringify(after)))); })();
} }}, {name: "#12b drop tab AS CHILD of a non-empty group lands AT END of subtree (after last child)", run: async (mn) => { await ensure_sidebar_expanded(mn);
await mn.executeScript("Services.prefs.setCharPref(\"gjoa.tabs.newTabPosition\", \"root\");");
const spawned = await mn.executeScript("\n        const panel = document.getElementById(\"gjoa-tab-panel\");\n        const spacer = panel.querySelector(\"[gjoa-spacer], .gjoa-spacer\") || panel.firstChild;\n        const rect = (spacer || panel).getBoundingClientRect();\n        (spacer || panel).dispatchEvent(new MouseEvent(\"contextmenu\", {\n          bubbles: true, cancelable: true, button: 2,\n          clientX: rect.left + 4, clientY: rect.top + 4,\n        }));\n        const menu = document.getElementById(\"gjoa-panel-menu\");\n        const item = [...menu.querySelectorAll(\"menuitem\")]\n          .find(mi => mi.getAttribute(\"label\") === \"New Tab Group\");\n        item.dispatchEvent(new Event(\"command\", { bubbles: true }));\n        return true;\n      ");
if ((!((_truthy) => _truthy !== false && _truthy != null)(spawned))) {
  (() => { throw new Error("New Tab Group menu click didn't fire"); })();
}
await dsl.wait_for(mn, "return document.querySelectorAll(\"#gjoa-tab-panel .gjoa-group-row\").length >= 1;");
await mn.executeScript("\n        const sp = Services.scriptSecurityManager.getSystemPrincipal();\n        gBrowser.addTab(\"about:blank?seed\", { triggeringPrincipal: sp });\n        gBrowser.addTab(\"about:blank?dropper2\", { triggeringPrincipal: sp });\n        return true;\n      ");
await dsl.wait_for(mn, "\n        const labels = [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row .gjoa-tab-label\")].map(e => e.textContent);\n        return labels.some(l => l?.includes(\"about:blank?seed\"))\n            && labels.some(l => l?.includes(\"about:blank?dropper2\"));\n      ");
const all_rows_before = await mn.executeScript("\n        return [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row, #gjoa-tab-panel .gjoa-group-row\")]\n          .map(r => ({\n            kind: r.classList.contains(\"gjoa-group-row\") ? \"group\" : \"tab\",\n            label: r.querySelector(\".gjoa-tab-label, .gjoa-group-name\")?.textContent ?? \"\",\n          }));\n      ");
const latest_group_idx = (() => { let i = 0; let acc = -1; while (true) {
    if ((i < all_rows_before.length)) { const _recur_0 = (i + 1); const _recur_1 = (($$bc$equiv(all_rows_before[i].kind, "group")) ? i : acc); i = _recur_0; acc = _recur_1; continue; } else { return acc; }
  } })();
const seed_idx = all_rows_before.findIndex((r) => r.label.includes("about:blank?seed"));
const dropper_idx = all_rows_before.findIndex((r) => r.label.includes("about:blank?dropper2"));
if (((_truthy) => _truthy !== false && _truthy != null)(((latest_group_idx < 0) || ((seed_idx < 0) || (dropper_idx < 0))))) {
  (() => { throw new Error(("".concat("setup: latestGroupIdx=", latest_group_idx, " seedIdx=", seed_idx, " dropperIdx=", dropper_idx, ", rows=", JSON.stringify(all_rows_before)))); })();
}
await mn.executeScript(build_drag_script({sourceIndex: seed_idx, targetIndex: latest_group_idx, position: "into"}));
await new Promise((r) => setTimeout(() => r(), 200));
const all_rows_mid = await mn.executeScript("\n        return [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row, #gjoa-tab-panel .gjoa-group-row\")]\n          .map(r => ({\n            kind: r.classList.contains(\"gjoa-group-row\") ? \"group\" : \"tab\",\n            label: r.querySelector(\".gjoa-tab-label, .gjoa-group-name\")?.textContent ?? \"\",\n          }));\n      ");
const mid_group_idx = (() => { let i = 0; let acc = -1; while (true) {
    if ((i < all_rows_mid.length)) { const _recur_0 = (i + 1); const _recur_1 = (($$bc$equiv(all_rows_mid[i].kind, "group")) ? i : acc); i = _recur_0; acc = _recur_1; continue; } else { return acc; }
  } })();
const new_dropper_idx = all_rows_mid.findIndex((r) => r.label.includes("about:blank?dropper2"));
if (((_truthy) => _truthy !== false && _truthy != null)(((mid_group_idx < 0) || (new_dropper_idx < 0)))) {
  (() => { throw new Error(("".concat("mid: groupIdx=", mid_group_idx, " dropperIdx=", new_dropper_idx, ", rows=", JSON.stringify(all_rows_mid)))); })();
}
await mn.executeScript(build_drag_script({sourceIndex: new_dropper_idx, targetIndex: mid_group_idx, position: "into"}));
await new Promise((r) => setTimeout(() => r(), 200));
const after = await read_tree(mn);
const post_group_idx = (() => { let i = 0; let acc = -1; while (true) {
    if ((i < after.length)) { const _recur_0 = (i + 1); const _recur_1 = (($$bc$equiv(after[i][1], "group")) ? i : acc); i = _recur_0; acc = _recur_1; continue; } else { return acc; }
  } })();
const post_seed_idx = after.findIndex((row) => (($$bc$equiv(row[1], "tab")) && row[2].includes("about:blank?seed")));
const post_dropper_idx = after.findIndex((row) => (($$bc$equiv(row[1], "tab")) && row[2].includes("about:blank?dropper2")));
if (((_truthy) => _truthy !== false && _truthy != null)(((post_group_idx < 0) || ((post_seed_idx < 0) || (post_dropper_idx < 0))))) {
  (() => { throw new Error(("".concat("after: postGroupIdx=", post_group_idx, " postSeedIdx=", post_seed_idx, " postDropperIdx=", post_dropper_idx, ", tree=", JSON.stringify(after)))); })();
}
if ((post_dropper_idx <= post_group_idx)) {
  (() => { throw new Error(("".concat("BUG: dropper2 should land AFTER (below) the group row, but is at DOM idx ", post_dropper_idx, " ", "vs group at ", post_group_idx, ". tree=", JSON.stringify(after)))); })();
}
if ((post_dropper_idx <= post_seed_idx)) {
  (() => { throw new Error(("".concat("dropper2 should land AT END of subtree, after seed. ", "dropper@", post_dropper_idx, " seed@", post_seed_idx, ". tree=", JSON.stringify(after)))); })();
}
const group_lv = after[post_group_idx][0];
if ((after[post_dropper_idx][0] <= group_lv)) {
  return (() => { throw new Error(("".concat("dropper2 should be indented (level > ", group_lv, "), got ", after[post_dropper_idx][0], ". ", "tree=", JSON.stringify(after)))); })();
} }}, {name: "#12 drop tab AS CHILD of an empty group lands inside (indented), not above", run: async (mn) => { await ensure_sidebar_expanded(mn);
await mn.executeScript("Services.prefs.setCharPref(\"gjoa.tabs.newTabPosition\", \"root\");");
const spawned = await mn.executeScript("\n        const panel = document.getElementById(\"gjoa-tab-panel\");\n        if (!panel) throw new Error(\"gjoa-tab-panel missing\");\n        const spacer = panel.querySelector(\"[gjoa-spacer], .gjoa-spacer\")\n          || panel.firstChild;\n        // Right-click the spacer area.\n        const rect = (spacer || panel).getBoundingClientRect();\n        (spacer || panel).dispatchEvent(new MouseEvent(\"contextmenu\", {\n          bubbles: true, cancelable: true, button: 2,\n          clientX: rect.left + 4, clientY: rect.top + 4,\n        }));\n        const menu = document.getElementById(\"gjoa-panel-menu\");\n        if (!menu) throw new Error(\"gjoa-panel-menu missing\");\n        const item = [...menu.querySelectorAll(\"menuitem\")]\n          .find(mi => mi.getAttribute(\"label\") === \"New Tab Group\");\n        if (!item) throw new Error(\"New Tab Group menuitem missing\");\n        item.dispatchEvent(new Event(\"command\", { bubbles: true }));\n        return true;\n      ");
if ((!((_truthy) => _truthy !== false && _truthy != null)(spawned))) {
  (() => { throw new Error("New Tab Group menu click didn't fire"); })();
}
await dsl.wait_for(mn, "return !!document.querySelector(\"#gjoa-tab-panel .gjoa-group-row\");");
await mn.executeScript("\n        const sp = Services.scriptSecurityManager.getSystemPrincipal();\n        gBrowser.addTab(\"about:blank?dropper\", { triggeringPrincipal: sp });\n        return true;\n      ");
await dsl.wait_for(mn, "\n        return [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row\")]\n          .some(r => r.querySelector(\".gjoa-tab-label\")?.textContent?.includes(\"about:blank?dropper\"));\n      ");
const tree = await read_tree(mn);
const group_idx = tree.findIndex((row) => ($$bc$equiv(row[1], "group")));
const all_rows = await mn.executeScript("\n        return [...document.querySelectorAll(\"#gjoa-tab-panel .gjoa-tab-row, #gjoa-tab-panel .gjoa-group-row\")]\n          .map(r => ({\n            kind: r.classList.contains(\"gjoa-group-row\") ? \"group\" : \"tab\",\n            label: r.querySelector(\".gjoa-tab-label, .gjoa-group-name\")?.textContent ?? \"\",\n          }));\n      ");
const dropper_idx = all_rows.findIndex((r) => r.label.includes("about:blank?dropper"));
if (((_truthy) => _truthy !== false && _truthy != null)(((dropper_idx < 0) || (group_idx < 0)))) {
  (() => { throw new Error(("".concat("setup: dropperIdx=", dropper_idx, " groupIdx=", group_idx, ", tree=", JSON.stringify(all_rows)))); })();
}
await mn.executeScript(build_drag_script({sourceIndex: dropper_idx, targetIndex: group_idx, position: "into"}));
await new Promise((r) => setTimeout(() => r(), 200));
const after = await read_tree(mn);
const new_dropper_idx = after.findIndex((row) => (($$bc$equiv(row[1], "tab")) && row[2].includes("about:blank?dropper")));
const new_group_idx = after.findIndex((row) => ($$bc$equiv(row[1], "group")));
if (((_truthy) => _truthy !== false && _truthy != null)(((new_dropper_idx < 0) || (new_group_idx < 0)))) {
  (() => { throw new Error(("".concat("after-drop: dropperIdx=", new_dropper_idx, " groupIdx=", new_group_idx, ", tree=", JSON.stringify(after)))); })();
}
if ((new_dropper_idx <= new_group_idx)) {
  (() => { throw new Error(("".concat("dropper should land AFTER (inside) the group, but is at ", new_dropper_idx, " ", "vs group at ", new_group_idx, ". tree=", JSON.stringify(after)))); })();
}
const group_level = after[new_group_idx][0];
if ((after[new_dropper_idx][0] <= group_level)) {
  return (() => { throw new Error(("".concat("dropper should be indented (level > ", group_level, "), ", "got level=", after[new_dropper_idx][0], ". tree=", JSON.stringify(after)))); })();
} }}];

export default tests;
