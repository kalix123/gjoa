// Run JavaScript in a running Firefox's chrome (browser window) context
// over Marionette. Start Firefox with `node scripts/install.mjs --launch --marionette`.
//
//   node scripts/dev-eval.mjs "return Services.appinfo.version"
//   node scripts/dev-eval.mjs --file some-script.js
//   node scripts/dev-eval.mjs --screenshot out.png    (the whole browser window)
//   node scripts/dev-eval.mjs --content "return document.title"   (in the selected tab's page)
//   node scripts/dev-eval.mjs --content --sys "return Services.appinfo.remoteType"   (page process, privileged)
//   node scripts/dev-eval.mjs --keys "jj<C-d>"   (type real keys into the page)
//
// The script body runs like a function in the browser window; `return` a
// JSON-serialisable value to print it.

import { readFileSync, writeFileSync } from "node:fs";
import { connect } from "node:net";

const argv = process.argv.slice(2);
const inContent = argv[0] === "--content";
if (inContent) argv.shift();
// --content --sys: run in the page process with system privileges (Services etc.).
const systemInContent = inContent && argv[0] === "--sys";
if (systemInContent) argv.shift();
const shotPath = argv[0] === "--screenshot" ? argv[1] : null;
// --keys "jj<C-d>": type real (trusted) keys into the selected tab's page.
const keysArg = argv[0] === "--keys" ? argv[1] : null;
if (keysArg) argv.splice(0, argv.length, "--screenshot-skip");

// WebDriver key values for the names used in vimrc notation.
const WD_KEYS = { Esc: "", CR: "", Tab: "", BS: "", Insert: "", Del: "", Space: " ", Up: "", Down: "", Left: "", Right: "", PageUp: "", PageDown: "", Home: "", End: "", lt: "<" };
const WD_MODS = { C: "", A: "", M: "", S: "" };
function keyActions(text) {
  const actions = [];
  const press = (v) => actions.push({ type: "keyDown", value: v }, { type: "keyUp", value: v });
  for (let i = 0; i < text.length; i++) {
    const end = text[i] === "<" ? text.indexOf(">", i + 2) : -1;
    if (end < 0) {
      press(text[i]);
      continue;
    }
    const parts = text.slice(i + 1, end).split("-");
    const base = parts.pop();
    const mods = parts.map((m) => WD_MODS[m.toUpperCase()]).filter(Boolean);
    for (const m of mods) actions.push({ type: "keyDown", value: m });
    press(WD_KEYS[base] ?? base);
    for (const m of mods.reverse()) actions.push({ type: "keyUp", value: m });
    i = end;
  }
  return actions;
}
const script = shotPath ? null : argv[0] === "--file" ? readFileSync(argv[1], "utf8") : argv.join(" ");
const port = Number(process.env.MARIONETTE_PORT ?? 2828);

// Firefox opens the Marionette port a few seconds into startup: retry for
// up to 30 s (DEV_EVAL_WAIT_MS) before giving up.
async function connectWithRetry() {
  const deadline = Date.now() + Number(process.env.DEV_EVAL_WAIT_MS ?? 30000);
  for (;;) {
    const s = connect(port, "127.0.0.1");
    const ok = await new Promise((resolve) => {
      s.once("connect", () => resolve(true));
      s.once("error", () => resolve(false));
    });
    if (ok) return s;
    s.destroy();
    if (Date.now() > deadline) {
      console.error(`Can't reach Marionette on port ${port}. Launch with --marionette.`);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

const sock = await connectWithRetry();
let buf = Buffer.alloc(0);
let nextId = 1;
const waiting = new Map();
let greeted;
const greeting = new Promise((r) => (greeted = r));

sock.on("data", (chunk) => {
  buf = Buffer.concat([buf, chunk]);
  for (;;) {
    const colon = buf.indexOf(":");
    if (colon < 0) return;
    const len = Number(buf.subarray(0, colon).toString());
    if (buf.length < colon + 1 + len) return;
    const msg = JSON.parse(buf.subarray(colon + 1, colon + 1 + len).toString());
    buf = buf.subarray(colon + 1 + len);
    if (!Array.isArray(msg)) greeted(msg);
    else {
      const [, id, error, result] = msg;
      const w = waiting.get(id);
      waiting.delete(id);
      error ? w.reject(new Error(`${error.error}: ${error.message}\n${error.stacktrace ?? ""}`)) : w.resolve(result);
    }
  }
});
sock.on("error", (e) => {
  console.error(`Marionette connection lost (${e.code}).`);
  process.exit(1);
});

function send(name, params = {}) {
  const id = nextId++;
  const body = Buffer.from(JSON.stringify([0, id, name, params]));
  sock.write(`${body.length}:`);
  sock.write(body);
  return new Promise((resolve, reject) => waiting.set(id, { resolve, reject }));
}

try {
  await greeting;
  await send("WebDriver:NewSession", { capabilities: {} });
  await send("Marionette:SetContext", { value: "chrome" });
  if (inContent) {
    // Point the session at the selected tab, then run in its page.
    await send("WebDriver:SwitchToWindow", { handle: (await send("WebDriver:GetWindowHandle")).value });
    await send("Marionette:SetContext", { value: "content" });
  }
  if (keysArg) {
    await send("Marionette:SetContext", { value: "content" });
    await send("WebDriver:PerformActions", { actions: [{ type: "key", id: "keyboard", actions: keyActions(keysArg) }] });
    await send("WebDriver:ReleaseActions");
    console.log(`typed ${keysArg}`);
  } else if (shotPath) {
    const res = await send("WebDriver:TakeScreenshot", { full: false, hash: false });
    writeFileSync(shotPath, Buffer.from(res.value, "base64"));
    console.log(`saved ${shotPath}`);
  } else {
    // Wrapped so scripts can use await; Marionette waits for the promise.
    const res = await send("WebDriver:ExecuteScript", { script: `return (async () => {
${script}
})();`, args: [], ...(inContent && !systemInContent ? {} : { sandbox: "system" }) });
    const value = res?.value;
    console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
  }
  await send("WebDriver:DeleteSession");
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
sock.end();
