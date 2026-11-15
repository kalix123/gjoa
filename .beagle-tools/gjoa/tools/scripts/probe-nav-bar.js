import { spawn } from 'child_process';
import { writeFile } from 'fs/promises';
import { connect_marionette_bang } from '../test-driver/marionette.js';
import { create_profile } from '../test-driver/profile.js';
import { locate_gjoa } from '../test-driver/gjoa-locator.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const PROBE_SCRIPT = "\n  const navBar = document.getElementById(\"nav-bar\");\n  const sidebarMain = document.getElementById(\"sidebar-container\");\n  const expanded = sidebarMain && sidebarMain.hasAttribute(\"sidebar-launcher-expanded\");\n  if (!navBar) return { error: \"no #nav-bar\" };\n  const navRect = navBar.getBoundingClientRect();\n  const kids = [];\n  for (const ch of navBar.children) {\n    const r = ch.getBoundingClientRect();\n    const cs = getComputedStyle(ch);\n    kids.push({\n      id: ch.id || \"\",\n      tag: ch.tagName.toLowerCase(),\n      cls: ch.className || \"\",\n      hidden: ch.hidden || cs.display === \"none\" || cs.visibility === \"hidden\",\n      display: cs.display,\n      order: cs.order,\n      flex: cs.flex,\n      left: Math.round(r.left),\n      right: Math.round(r.right),\n      top: Math.round(r.top),\n      width: Math.round(r.width),\n    });\n  }\n  // Also inspect customization-target's direct children.\n  const ct = document.getElementById(\"nav-bar-customization-target\");\n  const ctRect = ct ? ct.getBoundingClientRect() : null;\n  const ctKids = [];\n  if (ct) {\n    for (const ch of ct.children) {\n      const r = ch.getBoundingClientRect();\n      const cs = getComputedStyle(ch);\n      ctKids.push({\n        id: ch.id || \"\",\n        tag: ch.tagName.toLowerCase(),\n        hidden: ch.hidden || cs.display === \"none\" || cs.visibility === \"hidden\",\n        display: cs.display,\n        order: cs.order,\n        flex: cs.flex,\n        marginInlineStart: cs.marginInlineStart,\n        left: Math.round(r.left),\n        right: Math.round(r.right),\n        width: Math.round(r.width),\n      });\n    }\n  }\n  return {\n    mode: expanded ? \"EXPANDED\" : \"COMPACT\",\n    navBar: { left: Math.round(navRect.left), right: Math.round(navRect.right), width: Math.round(navRect.width) },\n    customizationTarget: ctRect ? {\n      left: Math.round(ctRect.left), right: Math.round(ctRect.right), width: Math.round(ctRect.width),\n    } : null,\n    navBarChildren: kids,\n    ctChildren: ctKids,\n  };\n";

async function probe(label) {
  const r = await mn.executeScript(PROBE_SCRIPT);
  console.log(("".concat("\n========== ", label, " (mode=", r.mode, ") ==========")));
  console.log("nav-bar:", r.navBar);
  console.log("customization-target:", r.customizationTarget);
  console.log("\nnav-bar children (left→right, visible only):");
  const visible = r.navBarChildren.filter((c) => ((!((_truthy) => _truthy !== false && _truthy != null)(c.hidden)) && (c.width > 0)));
  visible.sort((a, b) => { const a_left = a.left;
const b_left = b.left;
return (a_left - b_left); });
  visible.forEach((c) => {
  console.log(("".concat("  [", String(c.left).padStart(4), "..", String(c.right).padStart(4), "] w=", String(c.width).padStart(4), " order=", c.order.padStart(3), "  ", ((_logical) => (_logical !== false && _logical != null ? _logical : c.tag))(c.id), ".", c.cls.slice(0, 30))));
});
  console.log("\ncustomization-target children (visible only):");
  const ctVisible = r.ctChildren.filter((c) => ((!((_truthy) => _truthy !== false && _truthy != null)(c.hidden)) && (c.width > 0)));
  ctVisible.sort((a, b) => { const a_left = a.left;
const b_left = b.left;
return (a_left - b_left); });
  ctVisible.forEach((c) => {
  console.log(("".concat("  [", String(c.left).padStart(4), "..", String(c.right).padStart(4), "] w=", String(c.width).padStart(4), " order=", c.order.padStart(3), " mIS=", c.marginInlineStart.padStart(6), "  ", ((_logical) => (_logical !== false && _logical != null ? _logical : c.tag))(c.id))));
});
}

const profile = await create_profile({});

const gjoaBin = locate_gjoa().path;

console.log(("".concat("profile: ", profile.path)));

console.log(("".concat("binary:  ", gjoaBin)));

const child = spawn(gjoaBin, ["--profile", profile.path, "--marionette", "--headless", "--no-remote", "--remote-allow-system-access", "-marionette-port", "2828"], {stdio: "pipe", env: Object.assign({}, process.env, {["GJOA_ALLOW_INSECURE"]: "1"})});

(() => { const some_thread____0 = child.stdout; return ((some_thread____0 == null) ? null : some_thread____0.resume()); })();

(() => { const some_thread____1 = child.stderr; return ((some_thread____1 == null) ? null : some_thread____1.resume()); })();

const mn = await connect_marionette_bang({port: 2828});

await mn.newSession();

await mn.setContext("chrome");

async function diagExt(label) {
  const r = await mn.executeScript("\n    const ext = document.getElementById(\"unified-extensions-button\");\n    const ct = document.getElementById(\"nav-bar-customization-target\");\n    const sb = document.getElementById(\"sidebar-container\");\n    if (!ext) return { error: \"no ext\" };\n    const cs = getComputedStyle(ext);\n    const ctCs = ct ? getComputedStyle(ct) : null;\n    return {\n      ext: {\n        position: cs.position,\n        right: cs.right,\n        top: cs.top,\n        transform: cs.transform,\n        marginInlineStart: cs.marginInlineStart,\n      },\n      ct: ctCs ? { position: ctCs.position, display: ctCs.display } : null,\n      sidebarMain: {\n        present: !!sb,\n        hasExpanded: sb ? sb.hasAttribute(\"sidebar-launcher-expanded\") : null,\n        hasGjoaCompact: sb ? sb.hasAttribute(\"data-gjoa-compact\") : null,\n      },\n    };\n  ");
  console.log(("".concat("-- ", label, " computed style --")));
  return console.log(JSON.stringify(r, null, 2));
}

await (async () => { try {
    await new Promise((r) => setTimeout(r, 2000));
  await probe("DEFAULT BOOT");
  await diagExt("DEFAULT");
  const shot1 = await mn.takeScreenshot();
  await writeFile("/tmp/gjoa-navbar-default.png", Buffer.from(shot1, "base64"));
  console.log("\n→ saved /tmp/gjoa-navbar-default.png");
  await mn.executeScript("\n    const sb = document.getElementById(\"sidebar-container\");\n    if (sb) sb.removeAttribute(\"sidebar-launcher-expanded\");\n    // Also collapse using the native API if available.\n    if (window.SidebarController && typeof window.SidebarController.toggleExpanded === \"function\") {\n      try { window.SidebarController.toggleExpanded(); } catch {}\n    }\n    return null;\n  ");
  await new Promise((r) => setTimeout(r, 500));
  await probe("AFTER REMOVE sidebar-launcher-expanded");
  await diagExt("COMPACT");
  const shot2 = await mn.takeScreenshot();
  await writeFile("/tmp/gjoa-navbar-compact.png", Buffer.from(shot2, "base64"));
  console.log("\n→ saved /tmp/gjoa-navbar-compact.png");
  await mn.executeScript("\n    document.documentElement.style.colorScheme = \"dark\";\n    const url = document.getElementById(\"urlbar-container\");\n    if (url) url.style.maxWidth = \"700px\";\n    return null;\n  ");
  await new Promise((r) => setTimeout(r, 300));
  await probe("WITH 700px URL CAP");
  await diagExt("URL_CAP");
  const shot4 = await mn.takeScreenshot();
  await writeFile("/tmp/gjoa-navbar-urlcap.png", Buffer.from(shot4, "base64"));
  console.log("\n→ saved /tmp/gjoa-navbar-urlcap.png");
  await mn.executeScript("\n    Services.prefs.setBoolPref(\"sidebar.verticalTabs\", false);\n    return null;\n  ");
  await new Promise((r) => setTimeout(r, 1000));
  await probe("HORIZONTAL TABS (verticalTabs=false)");
  const shot3 = await mn.takeScreenshot();
  await writeFile("/tmp/gjoa-navbar-horizontal.png", Buffer.from(shot3, "base64"));
  console.log("\n→ saved /tmp/gjoa-navbar-horizontal.png");
  console.log("\n========== ALL NAV-BAR CHILDREN (incl. hidden) ==========");
  const all = await mn.executeScript("\n    const navBar = document.getElementById(\"nav-bar\");\n    const ct = document.getElementById(\"nav-bar-customization-target\");\n    const out = { navBarChildren: [], ctChildren: [] };\n    for (const ch of navBar.children) {\n      const cs = getComputedStyle(ch);\n      out.navBarChildren.push({ id: ch.id || ch.tagName, hidden: ch.hidden, display: cs.display, order: cs.order });\n    }\n    if (ct) for (const ch of ct.children) {\n      const cs = getComputedStyle(ch);\n      out.ctChildren.push({ id: ch.id || ch.tagName, hidden: ch.hidden, display: cs.display, order: cs.order });\n    }\n    return out;\n  ");
  console.log("nav-bar:");
  all.navBarChildren.forEach((c) => {
  console.log(("".concat("  ", (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : ($$bc$equiv(c.display, "none"))))(c.hidden)) ? "[hidden]" : "[show]  "), "  ord=", c.order, "  ", c.id)));
});
  console.log("customization-target:");
  all.ctChildren.forEach((c) => {
  console.log(("".concat("  ", (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : ($$bc$equiv(c.display, "none"))))(c.hidden)) ? "[hidden]" : "[show]  "), "  ord=", c.order, "  ", c.id)));
});
  }  finally {
    await (async () => { try {
    return await mn.deleteSession();
  } catch (e) {
    return null;
  } })();
    mn.disconnect();
    child.kill("SIGTERM");
    await profile.cleanup();
  } })();
