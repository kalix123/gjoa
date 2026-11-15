import { connect } from 'net';
import { equivV as $$bc$equiv } from 'beagle/core.js';

export class MarionetteError extends Error {
  constructor(message, remote) {
    super(message);
    (this.name = "MarionetteError");
    (this.remote = remote);
  }
}

export async function connect_marionette_bang(opts) {
  const o = ((_logical) => (_logical !== false && _logical != null ? _logical : {}))(opts);
  const host = ((_logical) => (_logical !== false && _logical != null ? _logical : "127.0.0.1"))(o.host);
  const port = ((_logical) => (_logical !== false && _logical != null ? _logical : 2828))(o.port);
  const connect_timeout_ms = ((_logical) => (_logical !== false && _logical != null ? _logical : 30000))(o.connectTimeoutMs);
  const deadline = (Date.now() + connect_timeout_ms);
  const scan = {socket: null, lastErr: null};
  await (async () => {  while (true) {
    if (((_truthy) => _truthy !== false && _truthy != null)(((Date.now() < deadline) && (!((_truthy) => _truthy !== false && _truthy != null)(scan.socket))))) { await (async () => { try {
    return (scan.socket = await openSocket(host, port));
  } catch (e) {
    (scan.lastErr = e);
    return await sleep(150);
  } })(); if (((_truthy) => _truthy !== false && _truthy != null)(scan.socket)) { return null; } else {  continue; } } else { return null; }
  } })();
  if ((!((_truthy) => _truthy !== false && _truthy != null)(scan.socket))) {
    (() => { throw new MarionetteError(("".concat("could not connect to Marionette at ", host, ":", port, " within timeout")), scan.lastErr); })();
  } else {
    null;
  }
  return await initClient_bang(scan.socket);
}

function openSocket(host, port) {
  return new Promise((resolve, reject) => { const s = connect({host: host, port: port});
s.once("connect", () => resolve(s));
return s.once("error", (e) => reject(e)); });
}

async function initClient_bang(socket) {
  const idState = {nextId: 1};
  const inflight = new Map();
  const recv = {buf: Buffer.alloc(0), initialBannerSeen: false};
  const bannerSeen = createDeferred_bang();
  socket.on("data", (chunk, Buffer) => { const __grow = (recv.buf = Buffer.concat([recv.buf, chunk]));
return (() => {  while (true) {
    const buf = recv.buf; const colonIdx = buf.indexOf(0x3a); if ((colonIdx < 0)) { return null; } else { const lenStr = buf.subarray(0, colonIdx).toString("utf8"); const len = Number.parseInt(lenStr, 10); if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(Number.isFinite(len))) || (len < 0)))) { return (() => { socket.destroy(new MarionetteError(("".concat("invalid framing header: ", JSON.stringify(lenStr))), null));
return null; })(); } else { const totalNeeded = (colonIdx + 1 + len); if ((buf.length < totalNeeded)) { return null; } else { const payload = buf.subarray((colonIdx + 1), totalNeeded).toString("utf8"); const __adv = (recv.buf = buf.subarray(totalNeeded)); const parseState = {parsed: null, failed: false}; const __parse = (() => { try {
    return (parseState.parsed = JSON.parse(payload));
  } catch (e) {
    socket.destroy(new MarionetteError(("".concat("malformed JSON from server: ", payload)), e));
    return (parseState.failed = true);
  } })(); const __dispatch = (((_truthy) => _truthy !== false && _truthy != null)(parseState.failed) ? null : (() => { const parsed = parseState.parsed; if ((!((_truthy) => _truthy !== false && _truthy != null)(recv.initialBannerSeen))) {
  const __b = (recv.initialBannerSeen = true);
  const r = bannerSeen.resolve;
  return r();
} else {
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(parsed.length, 4)) && ($$bc$equiv(parsed[0], 1))) : _logical))(Array.isArray(parsed)))) {
    const msgId = parsed[1];
    const err = parsed[2];
    const result = parsed[3];
    const w = inflight.get(msgId);
    if ((w == null)) {
      return null;
    } else {
      const __d = inflight.delete(msgId);
      if (((_truthy) => _truthy !== false && _truthy != null)(err)) {
        const rej = w.reject;
        return rej(new MarionetteError(formatRemoteError(err), err));
      } else {
        const res = w.resolve;
        return res(result);
      }
    }
  } else {
    return null;
  }
} })()); if (((_truthy) => _truthy !== false && _truthy != null)(parseState.failed)) { return null; } else {  continue; } } } }
  } })(); });
  socket.on("error", (e) => { Array.from(inflight.entries()).forEach((pair) => {
  const id = pair[0];
  const w = pair[1];
  const rej = w.reject;
  rej(new MarionetteError("socket error", e));
  inflight.delete(id);
}); });
  socket.on("close", () => { Array.from(inflight.entries()).forEach((pair) => {
  const id = pair[0];
  const w = pair[1];
  const rej = w.reject;
  rej(new MarionetteError("socket closed before response", null));
  inflight.delete(id);
}); });
  await bannerSeen.promise;
  const send = (name, params) => { const p = ((_logical) => (_logical !== false && _logical != null ? _logical : {}))(params);
const id = idState.nextId;
(idState.nextId = (id + 1));
const cmd = JSON.stringify([0, id, name, p]);
const framed = ("".concat(Buffer.byteLength(cmd, "utf8"), ":", cmd));
return new Promise((resolve, reject) => { inflight.set(id, {resolve: resolve, reject: reject});
return socket.write(framed, "utf8", (err) => { if (((_truthy) => _truthy !== false && _truthy != null)(err)) {
  inflight.delete(id);
  return reject(new MarionetteError("write failed", err));
} else {
  return null;
} }); }); };
  const ctxState = {desired: null};
  return {newSession: async (caps) => { const r = await send("WebDriver:NewSession", {capabilities: {alwaysMatch: ((_logical) => (_logical !== false && _logical != null ? _logical : {}))(caps), firstMatch: [{}]}});
return r.sessionId; }, navigate: async (url) => { await send("WebDriver:Navigate", {url: url});
return null; }, setTimeouts: async (timeouts) => { await send("WebDriver:SetTimeouts", timeouts);
return null; }, setContext: async (context) => { (ctxState.desired = context);
await send("Marionette:SetContext", {value: context});
return null; }, executeScript: async (script, args) => { if (((_truthy) => _truthy !== false && _truthy != null)(ctxState.desired)) {
  await send("Marionette:SetContext", {value: ctxState.desired});
}
const a = ((_logical) => (_logical !== false && _logical != null ? _logical : []))(args);
const r = await send("WebDriver:ExecuteScript", {script: script, args: a, scriptTimeout: 30000, newSandbox: false});
return r.value; }, executeAsyncScript: async (script, args) => { if (((_truthy) => _truthy !== false && _truthy != null)(ctxState.desired)) {
  await send("Marionette:SetContext", {value: ctxState.desired});
}
const a = ((_logical) => (_logical !== false && _logical != null ? _logical : []))(args);
const r = await send("WebDriver:ExecuteAsyncScript", {script: script, args: a, scriptTimeout: 30000, newSandbox: false});
return r.value; }, getWindowHandle: async () => { const r = await send("WebDriver:GetWindowHandle", {});
return (($$bc$equiv(typeof r, "string")) ? r : r.value); }, getWindowHandles: async () => { const r = await send("WebDriver:GetWindowHandles", {});
return (((_truthy) => _truthy !== false && _truthy != null)(Array.isArray(r)) ? r : r.value); }, switchToWindow: async (handle) => { await send("WebDriver:SwitchToWindow", {handle: handle});
return null; }, closeWindow: async () => { const r = await send("WebDriver:CloseChromeWindow", {});
return (((_truthy) => _truthy !== false && _truthy != null)(Array.isArray(r)) ? r : r.value); }, performActions: async (actions) => { await send("WebDriver:PerformActions", {actions: actions});
return null; }, takeScreenshot: async () => { const r = await send("WebDriver:TakeScreenshot", {full: true, hash: false});
return (($$bc$equiv(typeof r, "string")) ? r : r.value); }, releaseActions: async () => { await send("WebDriver:ReleaseActions", {});
return null; }, quit: async (flags) => (async () => { try {
    return await send("Marionette:Quit", {flags: ((_logical) => (_logical !== false && _logical != null ? _logical : ["eAttemptQuit"]))(flags)});
  } catch (e) {
    return {};
  } })(), deleteSession: async () => (async () => { try {
    await send("WebDriver:DeleteSession", {});
  return null;
  } catch (e) {
    return null;
  } })(), disconnect: () => { (() => { try {
    return socket.end();
  } catch (e) {
    return null;
  } })();
return (() => { try {
    return socket.destroy();
  } catch (e) {
    return null;
  } })(); }};
}

function formatRemoteError(err) {
  return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (($$bc$equiv(typeof err, "object")) && (($beagle$jst$receiver, $beagle$jst$key) => ($beagle$jst$key in $beagle$jst$receiver))(err, "message")) : _logical))(err)) ? ("".concat(((_logical) => (_logical !== false && _logical != null ? _logical : "error"))(err.error), ": ", ((_logical) => (_logical !== false && _logical != null ? _logical : "(no message)"))(err.message))) : String(err));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(() => r(null), ms));
}

function createDeferred_bang() {
  const slot = {resolve: null, reject: null};
  const promise = new Promise((res, rej) => { (slot.resolve = res);
return (slot.reject = rej); });
  return {promise: promise, resolve: slot.resolve, reject: slot.reject};
}
