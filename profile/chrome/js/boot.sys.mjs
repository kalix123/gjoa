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

import { parseConfig } from "resource://profile-js/vim/config.sys.mjs";
import { COMMANDS, PAGE_COMMANDS } from "resource://profile-js/vim/commands.sys.mjs";
import { clearTimeout, setInterval, setTimeout } from "resource://gre/modules/Timer.sys.mjs";

const CHROME_DIR = Services.dirsvc.get("UChrm", Ci.nsIFile).path;
const VIMRC = PathUtils.join(CHROME_DIR, "vimrc");
const VIM_DIR = PathUtils.join(CHROME_DIR, "js", "vim");

const keysScope = {};
Services.scriptloader.loadSubScript("resource://profile-js/vim/keys.js", keysScope);
const { VimKeys } = keysScope;

// --- config ----------------------------------------------------------------
let config = { bindings: {}, prefixes: [], settings: {}, errors: [] };
let configMtime = 0;

async function loadConfig() {
  let text = "";
  try {
    text = await IOUtils.readUTF8(VIMRC);
  } catch (e) {
    console.error(`vim: can't read ${VIMRC}`, e);
  }
  config = parseConfig(text, VimKeys);
  for (const err of config.errors) console.warn(`vim: vimrc ${err}`);
  Services.ppmm.sharedData.set("vim:config", {
    bindings: config.bindings,
    prefixes: config.prefixes,
    settings: config.settings,
  });
  Services.ppmm.sharedData.flush();
}

async function checkConfig() {
  try {
    const { lastModified } = await IOUtils.stat(VIMRC);
    if (lastModified !== configMtime) {
      configMtime = lastModified;
      await loadConfig();
    }
  } catch {}
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
  if (COMMANDS[cmd]) {
    const msg = COMMANDS[cmd](win, count, args);
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
  // Keys typed in a page are handled by the page script.
  if (!target || windowOf(target) !== win || target.localName === "browser") return;
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
