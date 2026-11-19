// Run JavaScript in a running gjoa Firefox's chrome (browser window) context
// over Marionette. Start Firefox with `install-profile.mjs --launch --marionette`.
//
//   node scripts/dev-eval.mjs "return Services.appinfo.version"
//   node scripts/dev-eval.mjs --file some-script.js
//   node scripts/dev-eval.mjs --screenshot out.png    (the whole browser window)
//
// The script body runs like a function in the browser window; `return` a
// JSON-serialisable value to print it.

import { readFileSync, writeFileSync } from "node:fs";
import { connect } from "node:net";

const argv = process.argv.slice(2);
const shotPath = argv[0] === "--screenshot" ? argv[1] : null;
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
  if (shotPath) {
    const res = await send("WebDriver:TakeScreenshot", { full: false, hash: false });
    writeFileSync(shotPath, Buffer.from(res.value, "base64"));
    console.log(`saved ${shotPath}`);
  } else {
    // Wrapped so scripts can use await; Marionette waits for the promise.
    const res = await send("WebDriver:ExecuteScript", { script: `return (async () => {
${script}
})();`, args: [], sandbox: "system" });
    const value = res?.value;
    console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
  }
  await send("WebDriver:DeleteSession");
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
sock.end();
