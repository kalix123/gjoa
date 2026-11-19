// Entry point for the profile's JavaScript. The autoconfig stub in the
// Firefox folder (firefox/config.js in this repo) registers
// chrome/js/chrome.manifest as resource://profile-js/ and imports this module
// once per browser start.
//
// Vim keys:
//   - chrome/vimrc is parsed (vim/config.sys.mjs) and shared with every
//     process as sharedData "vim:config"; re-read whenever the file changes.
//   - vim/keys.js + vim/content.js run in every process as a process script
//     and handle keys inside pages.
//   - Keys pressed while focus is in the browser window itself (not a page or
//     a text field) are handled here with the same bindings.
//   - Browser-level commands live in vim/commands.sys.mjs.

import { applyLine, parseConfig } from "resource://profile-js/vim/config.sys.mjs";
import { ALIASES, COMMANDS, PAGE_COMMANDS } from "resource://profile-js/vim/commands.sys.mjs";
import { showCmdline, showHelp } from "resource://profile-js/vim/ui.sys.mjs";
import { clearTimeout, setInterval, setTimeout } from "resource://gre/modules/Timer.sys.mjs";

const CHROME_DIR = Services.dirsvc.get("UChrm", Ci.nsIFile).path;
const VIM_DIR = PathUtils.join(CHROME_DIR, "js", "vim");
const USER_VIMRC = PathUtils.join(CHROME_DIR, "vimrc"); // the user's; never overwritten
const DEFAULTS_VIMRC = PathUtils.join(VIM_DIR, "defaults.vimrc"); // shipped defaults

const keysScope = {};
Services.scriptloader.loadSubScript("resource://profile-js/vim/keys.js", keysScope);
const { VimKeys } = keysScope;

// --- config ----------------------------------------------------------------
// Built-in defaults, then the user's chrome/vimrc, then :set/:bind/:unbind
// typed this session (kept until the browser restarts).
let config = { bindings: {}, prefixes: [], settings: {}, errors: [] };
let configStamp = "";
const sessionLines = [];

async function readOrEmpty(path) {
  try {
    return await IOUtils.readUTF8(path);
  } catch {
    return "";
  }
}

function share() {
  Services.ppmm.sharedData.set("vim:config", {
    bindings: config.bindings,
    prefixes: config.prefixes,
    settings: config.settings,
  });
  Services.ppmm.sharedData.flush();
}

async function loadConfig() {
  config = parseConfig(
    [
      { name: "defaults.vimrc", text: await readOrEmpty(DEFAULTS_VIMRC) },
      { name: "vimrc", text: await readOrEmpty(USER_VIMRC) },
      { name: "this session", text: sessionLines.join("\n") },
    ],
    VimKeys
  );
  for (const err of config.errors) console.warn(`vim: ${err}`);
  share();
  if (config.errors.length) {
    for (const win of Services.wm.getEnumerator("navigator:browser")) {
      showStatus(win, `config: ${config.errors[0]}`, true);
    }
  }
}

async function checkConfig() {
  const stamp = [];
  for (const path of [DEFAULTS_VIMRC, USER_VIMRC]) {
    try {
      stamp.push((await IOUtils.stat(path)).lastModified);
    } catch {
      stamp.push(0);
    }
  }
  if (stamp.join() !== configStamp) {
    configStamp = stamp.join();
    await loadConfig();
  }
}

// :set / :bind / :unbind — apply for this session only.
function sessionDirective(win, line) {
  const probe = { bindings: {}, settings: {}, errors: [] };
  applyLine(probe, line, "command", VimKeys);
  if (probe.errors.length) return probe.errors[0];
  sessionLines.push(line);
  loadConfig();
  return `${line.split(/\s+/)[0]}: done (this session; :config to keep it)`;
}

// Open the user's vimrc in an editor: `set editor <program> [args]`, else the
// system's handler (Notepad on Windows, since the file has no extension).
function findProgram(name) {
  const candidates = [];
  if (PathUtils.isAbsolute(name)) candidates.push(name);
  else {
    const win = Services.appinfo.OS === "WINNT";
    const exts = win ? ["", ...(Services.env.get("PATHEXT") || ".EXE;.CMD;.BAT").split(";")] : [""];
    for (const dir of Services.env.get("PATH").split(win ? ";" : ":").filter(Boolean)) {
      for (const ext of exts) candidates.push(PathUtils.join(dir, name + ext.toLowerCase()));
    }
  }
  for (const path of candidates) {
    const f = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
    try {
      f.initWithPath(path);
      if (f.exists() && f.isFile()) return f;
    } catch {}
  }
  return null;
}

async function openConfig() {
  if (!(await IOUtils.exists(USER_VIMRC))) {
    await IOUtils.writeUTF8(USER_VIMRC, '" Your Vim key config: bind <keys> <command>, unbind <keys>, set <name> <value>.\n');
  }
  const [program, ...args] = (config.settings.editor ?? (Services.appinfo.OS === "WINNT" ? "notepad" : "")).split(/\s+/).filter(Boolean);
  if (program) {
    const exe = findProgram(program);
    if (!exe) return `editor not found: ${program}`;
    const proc = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
    proc.init(exe);
    proc.runw(false, [...args, USER_VIMRC], args.length + 1);
    return `opened ${PathUtils.filename(USER_VIMRC)} in ${program}`;
  }
  const file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
  file.initWithPath(USER_VIMRC);
  file.launch();
  return "opened config";
}

// Commands that need this module's state (config, UI).
const META = {
  help: (win) => showHelp(win, { config, userConfig: USER_VIMRC, defaultsConfig: DEFAULTS_VIMRC }),
  cmdline: (win, n, args) => showCmdline(win, { run: (line) => runLine(win, line), initial: args.join(" ") }),
  config: (win) => {
    openConfig().then((msg) => showStatus(win, msg, true), (e) => showStatus(win, `config: ${e.message}`, true));
  },
  source: (win) => {
    loadConfig().then(() => showStatus(win, config.errors.length ? `config: ${config.errors[0]}` : "config re-read", true));
  },
  set: (win, n, args) => sessionDirective(win, ["set", ...args].join(" ")),
  bind: (win, n, args) => sessionDirective(win, ["bind", ...args].join(" ")),
  unbind: (win, n, args) => sessionDirective(win, ["unbind", ...args].join(" ")),
};

// A line typed on the : command line, e.g. "tabopen github.com" or "5 scrolldown".
function runLine(win, line) {
  let [name, ...args] = line.replace(/^:/, "").trim().split(/\s+/);
  let count = 0;
  if (/^\d+$/.test(name) && args.length) {
    count = Number(name);
    [name, ...args] = args;
  }
  runCommand(win, ALIASES[name] ?? name, args, count);
}

// --- page script -------------------------------------------------------------
async function loadPageScript() {
  const keys = await IOUtils.readUTF8(PathUtils.join(VIM_DIR, "keys.js"));
  const content = await IOUtils.readUTF8(PathUtils.join(VIM_DIR, "content.js"));
  const source = `(function () {\n${keys}\n${content}\n})();`;
  Services.ppmm.loadProcessScript("data:text/javascript;charset=utf-8," + encodeURIComponent(source), true);
}

// --- status display (sidebar footer) ----------------------------------------
const tabStatus = new WeakMap(); // <browser> -> text the page last reported

function showStatus(win, text, transient = false) {
  const el = win.document.getElementById("vim-status");
  if (!el) return;
  el.textContent = text ?? "";
  el.toggleAttribute("active", !!text);
  clearTimeout(win.__vimStatusTimer);
  if (transient && text) {
    win.__vimStatusTimer = setTimeout(() => showStatus(win, tabStatus.get(win.gBrowser.selectedBrowser) ?? ""), 1500);
  }
}

// --- running commands ------------------------------------------------------------
function runCommand(win, cmd, args = [], count = 0) {
  const fn = META[cmd] ?? COMMANDS[cmd];
  if (fn) {
    const msg = fn(win, count, args);
    if (msg) showStatus(win, msg, true);
    return;
  }
  if (PAGE_COMMANDS.has(cmd)) {
    const browser = win.gBrowser.selectedBrowser;
    browser.focus();
    Services.ppmm.broadcastAsyncMessage("Vim:Run", { bcId: browser.browsingContext.id, cmd, args, count });
    return;
  }
  showStatus(win, `unknown command: ${cmd}`, true);
}

// (Element.ownerGlobal is undefined for these elements in Firefox 160; use the document.)
const windowOf = (el) => el?.ownerDocument?.defaultView ?? null;

function browserFor(bcId) {
  const browser = BrowsingContext.get(bcId)?.top?.embedderElement;
  return windowOf(browser)?.gBrowser ? browser : null;
}

const pageMessages = {
  receiveMessage(msg) {
    const browser = browserFor(msg.data.bcId);
    if (!browser) return;
    const win = windowOf(browser);
    if (msg.name === "Vim:Command") {
      try {
        runCommand(win, msg.data.cmd, msg.data.args, msg.data.count);
      } catch (e) {
        console.error(`vim: ${msg.data.cmd} failed`, e);
      }
    } else if (msg.name === "Vim:Status") {
      tabStatus.set(browser, msg.data.text);
      if (browser === win.gBrowser.selectedBrowser) showStatus(win, msg.data.text);
    }
  },
};

// --- keys pressed in the browser window itself --------------------------------
function onChromeKey(win, e) {
  if (!e.isTrusted) return;
  const target = e.composedTarget ?? e.originalTarget ?? e.target;
  // Keys typed in a page are handled by the page script; the help panel and
  // command line handle their own.
  if (!target || windowOf(target) !== win || target.localName === "browser") return;
  if (target.closest?.("#vim-help, #vim-cmdline")) return;
  const key = VimKeys.keyName(e);
  if (!key) return;
  const st = (win.__vim ??= { buffer: [], count: "", timer: null });

  if (VimKeys.isEditable(target) || target.closest?.("#urlbar, findbar")) {
    // <Esc> in an idle address bar goes back to the page, like leaving insert mode.
    if (key === "<Esc>" && target.closest?.("#urlbar") && !win.gURLBar.view.isOpen) {
      setTimeout(() => win.gBrowser.selectedBrowser.focus(), 0);
    }
    return;
  }
  if (win.document.querySelector("menupopup[open], panel[panelopen]")) return;

  const reset = () => {
    st.buffer = [];
    st.count = "";
    clearTimeout(st.timer);
  };
  if (/^[0-9]$/.test(key) && !st.buffer.length && (st.count || key !== "0") && !config.bindings[key]) {
    st.count += key;
    e.preventDefault();
    e.stopPropagation();
    showStatus(win, st.count);
    return;
  }
  st.buffer.push(key);
  const seq = st.buffer.join("");
  const binding = config.bindings[seq];
  if (binding) {
    e.preventDefault();
    e.stopPropagation();
    const count = Number(st.count || 0);
    reset();
    showStatus(win, "");
    runCommand(win, binding.cmd, binding.args, count);
  } else if (config.prefixes.includes(seq)) {
    e.preventDefault();
    e.stopPropagation();
    showStatus(win, st.count + seq);
    clearTimeout(st.timer);
    st.timer = setTimeout(() => {
      reset();
      showStatus(win, "");
    }, Number(config.settings.timeout ?? 1500));
  } else {
    const hadPending = st.buffer.length > 1;
    reset();
    showStatus(win, "");
    if (hadPending) onChromeKey(win, e);
  }
}

function setUpWindow(win) {
  if (win.__vimReady || !win.gBrowser) return;
  win.__vimReady = true;
  const status = win.document.createElementNS("http://www.w3.org/1999/xhtml", "div");
  status.id = "vim-status";
  win.document.getElementById("browser")?.append(status);
  win.addEventListener("keydown", (e) => onChromeKey(win, e), true);
  win.gBrowser.tabContainer.addEventListener("TabSelect", () => {
    showStatus(win, tabStatus.get(win.gBrowser.selectedBrowser) ?? "");
  });
}

// --- start -------------------------------------------------------------------
async function start() {
  await checkConfig();
  setInterval(checkConfig, 1000);
  await loadPageScript();
  Services.ppmm.addMessageListener("Vim:Command", pageMessages);
  Services.ppmm.addMessageListener("Vim:Status", pageMessages);
  Services.obs.addObserver((win) => setUpWindow(win), "browser-delayed-startup-finished");
  for (const win of Services.wm.getEnumerator("navigator:browser")) setUpWindow(win);
}

start().catch((e) => console.error("vim: failed to start", e));
