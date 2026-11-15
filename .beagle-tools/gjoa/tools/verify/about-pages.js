import { spawn } from 'child_process';
import * as $beagle$import$fs from 'fs';
import * as $beagle$import$os from 'os';
import * as $beagle$import$path from 'path';
import { connect_marionette_bang } from '../test-driver/marionette.js';
import { get as $$bc$get } from 'beagle/core.js';

function sleep(ms) {
  return new Promise((r) => setTimeout(() => r(null), ms));
}

function make_profile_bang() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gjoa-verify-"));
  fs.writeFileSync(path.join(dir, "prefs.js"), ("".concat("user_pref(\"marionette.port\", 2828);\n", "user_pref(\"marionette.enabled\", true);\n")));
  return dir;
}

const ABOUT_PROBE = ("".concat("const out = [];\n", "for (const what of ['sovereignty','gjoa']) {\n", "  const contract = '@mozilla.org/network/protocol/about;1?what=' + what;\n", "  let registered = contract in Components.classes;\n", "  let flags = null, err = null;\n", "  if (registered) { try {\n", "    const mod = Components.classes[contract].getService(Ci.nsIAboutModule);\n", "    flags = mod.getURIFlags(Services.io.newURI('about:' + what));\n", "  } catch(e) { err = String(e); } }\n", "  out.push({what, registered, flags, err});\n", "}\n", "return out;"));

const POINTER_PROBE = ("".concat("const done = arguments[arguments.length - 1];\n", "const win = Services.wm.getMostRecentWindow('navigator:browser');\n", "const tab = win.gBrowser.addTab('about:preferences', {triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()});\n", "win.gBrowser.selectedTab = tab;\n", "const b = tab.linkedBrowser;\n", "let tries = 0;\n", "const iv = win.setInterval(() => {\n", "  tries++;\n", "  let doc = null; try { doc = b.contentDocument; } catch(e) {}\n", "  const ptr = doc && doc.getElementById('gjoa-prefs-pointer');\n", "  if (ptr || tries > 80) {\n", "    win.clearInterval(iv);\n", "    done({url: doc ? doc.documentURI : null, pointer: !!ptr, navEntry: !!(doc && doc.getElementById('category-gjoa-link')), tries});\n", "  }\n", "}, 250);"));

async function run_bang() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : $$bc$get(process.env, "GJOA_BIN")))(process.argv[2])))) {
    console.error("usage: about-pages <gjoa-bin>  (or set $GJOA_BIN)");
    process.exit(2);
  }
  const bin = ((_logical) => (_logical !== false && _logical != null ? _logical : $$bc$get(process.env, "GJOA_BIN")))(process.argv[2]);
  const profile = make_profile_bang();
  const child = spawn(bin, ["--profile", profile, "--marionette", "--no-remote", "--remote-allow-system-access", "--headless"], {stdio: "ignore", env: Object.assign({}, process.env, {["GJOA_ALLOW_INSECURE"]: "1", ["MOZ_HEADLESS"]: "1"})});
  const client = await connect_marionette_bang({connectTimeoutMs: 45000});
  const __sess = await client.newSession();
  const __ctx = await client.setContext("chrome");
  const about = await client.executeScript(ABOUT_PROBE, []);
  const pointer = await client.executeAsyncScript(POINTER_PROBE, []);
  const __log = console.log(JSON.stringify({about: about, pointer: pointer}, null, 2));
  const __quit = await client.quit(["eForceQuit"]);
  const __disc = client.disconnect();
  const __kill = child.kill();
  const ok_about = about.every((r) => r.registered);
  const ok_ptr = pointer.pointer;
  console.log(("".concat("\nVERDICT: about-pages=", (ok_about ? "PASS" : "FAIL"), "  settings-pointer=", (((_truthy) => _truthy !== false && _truthy != null)(ok_ptr) ? "PASS" : "FAIL"))));
  return process.exit((((_truthy) => _truthy !== false && _truthy != null)((ok_about && ok_ptr)) ? 0 : 1));
}

run_bang().catch((e) => { console.error(("".concat("verify failed: ", ((_logical) => (_logical !== false && _logical != null ? _logical : e))(e.stack))));
return process.exit(1); });
