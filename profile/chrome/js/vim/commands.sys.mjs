// Commands that act on the browser rather than the page (tabs, history,
// address bar, find, zoom, clipboard). Called by boot.sys.mjs for keys pressed
// in a page ("Vim:Command" from content.js) or in the browser window itself.
// Every Firefox function used here was checked to exist in Firefox 160.

const systemPrincipal = () => Services.scriptSecurityManager.getSystemPrincipal();

function copy(text) {
  Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(text);
}

function openText(win, text, where) {
  text = (text ?? "").trim();
  if (!text) return "clipboard is empty";
  // Same rules as typing into the address bar: URLs open, anything else searches.
  const info = Services.uriFixup.getFixupURIInfo(text, Ci.nsIURIFixup.FIXUP_FLAG_FIX_SCHEME_TYPOS | Ci.nsIURIFixup.FIXUP_FLAG_ALLOW_KEYWORD_LOOKUP);
  win.openTrustedLinkIn(info.preferredURI.spec, where);
  return "";
}

function urlUp(win, toRoot) {
  const uri = win.gBrowser.currentURI;
  if (!/^https?$/.test(uri.scheme)) return;
  let target;
  if (toRoot) {
    target = uri.prePath + "/";
  } else {
    const path = uri.filePath.replace(/\/$/, "");
    target = uri.prePath + (path.slice(0, path.lastIndexOf("/") + 1) || "/");
  }
  win.gBrowser.fixupAndLoadURIString(target, { triggeringPrincipal: systemPrincipal() });
}

const repeat = (n, fn) => {
  for (let i = 0; i < Math.max(n, 1); i++) fn();
};

// Firefox puts focus in the address bar when a New Tab page is selected; after
// a key-driven tab switch keep it on the page so J/K can keep going.
function selectTab(win, change) {
  change();
  win.setTimeout(() => win.gBrowser.selectedBrowser.focus(), 0);
}

// Each returns optional text for the status display.
export const COMMANDS = {
  back: (win, n) => repeat(n, () => win.gBrowser.goBack()),
  forward: (win, n) => repeat(n, () => win.gBrowser.goForward()),
  reload: (win) => win.BrowserCommands.reload(),
  reloadhard: (win) => win.BrowserCommands.reloadSkipCache(),
  urlup: (win) => urlUp(win, false),
  urlroot: (win) => urlUp(win, true),

  tabnext: (win, n) => selectTab(win, () => win.gBrowser.tabContainer.advanceSelectedTab(Math.max(n, 1), true)),
  tabprev: (win, n) => selectTab(win, () => win.gBrowser.tabContainer.advanceSelectedTab(-Math.max(n, 1), true)),
  tabfirst: (win) => selectTab(win, () => win.gBrowser.selectTabAtIndex(0)),
  tablast: (win) => selectTab(win, () => win.gBrowser.selectTabAtIndex(-1)),
  tabclose: (win, n) => selectTab(win, () => repeat(n, () => win.gBrowser.removeTab(win.gBrowser.selectedTab, { animate: false }))),
  tabundo: (win) => selectTab(win, () => win.SessionWindowUI.undoCloseTab(win)),
  tabopen: (win) => win.BrowserCommands.openTab(),
  tabduplicate: (win) => {
    win.gBrowser.selectedTab = win.gBrowser.duplicateTab(win.gBrowser.selectedTab);
  },
  tabpin: (win) => {
    const tab = win.gBrowser.selectedTab;
    if (tab.pinned) win.gBrowser.unpinTab(tab);
    else win.gBrowser.pinTab(tab);
  },
  togglesidebar: (win) => win.document.getElementById("sidebar-button")?.doCommand(),

  open: (win) => {
    win.gURLBar.select();
  },
  opencurrent: (win) => {
    win.gURLBar.focus();
    const input = win.gURLBar.inputField;
    input?.setSelectionRange?.(input.value.length, input.value.length);
  },
  opentab: (win, n, [url, mode] = []) => {
    if (!url) return;
    win.openTrustedLinkIn(url, "tab", { inBackground: mode === "background" });
  },
  clipboardopen: (win) => openText(win, win.readFromClipboard(), "current"),
  clipboardtabopen: (win) => openText(win, win.readFromClipboard(), "tab"),
  yankurl: (win) => {
    copy(win.gBrowser.currentURI.displaySpec);
    return "copied address";
  },

  find: (win) => win.gLazyFindCommand("onFindCommand"),
  findnext: (win) => win.gLazyFindCommand("onFindAgainCommand", false),
  findprev: (win) => win.gLazyFindCommand("onFindAgainCommand", true),

  zoomin: (win, n) => repeat(n, () => win.FullZoom.enlarge()),
  zoomout: (win, n) => repeat(n, () => win.FullZoom.reduce()),
  zoomreset: (win) => win.FullZoom.reset(),
};

// Commands content.js runs inside the page; the browser window forwards them.
export const PAGE_COMMANDS = new Set([
  "scrolldown", "scrollup", "scrollleft", "scrollright", "halfpagedown", "halfpageup",
  "pagedown", "pageup", "scrolltop", "scrollbottom", "hint", "hinttab", "focusinput", "toggleignore",
]);
