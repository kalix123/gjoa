// Vim keys inside pages. Runs once in every Firefox process as a "process
// script" (boot.sys.mjs prepends keys.js and loads it with
// Services.ppmm.loadProcessScript), so it covers websites, the new tab page,
// Settings, about:addons and addons.mozilla.org alike. Web-page processes are
// sandboxed away from the profile folder, which is why this is sent as script
// text instead of being imported from a file.
//
// Each page window gets a capturing keydown listener installed before any page
// script runs, so it sees keys first and swallows the ones it uses. Bindings
// come from the vimrc, shared by the browser as Services.cpmm.sharedData
// "vim:config". Commands that act on tabs/history/etc. are sent to the browser
// ("Vim:Command"); the rest (scrolling, hints, inputs) run here.

(() => {
  const { setTimeout, clearTimeout } = ChromeUtils.importESModule("resource://gre/modules/Timer.sys.mjs");
  const EMPTY_CONFIG = { bindings: {}, prefixes: [], settings: {} };
  const config = () => Services.cpmm.sharedData.get("vim:config") ?? EMPTY_CONFIG;
  const setting = (name, fallback) => config().settings[name] ?? fallback;

  const states = new WeakMap(); // window -> per-window state
  const tops = new Map(); // top browsing-context id -> WeakRef(top window)

  function topState(win) {
    return stateFor(win.top ?? win);
  }
  function stateFor(win) {
    let s = states.get(win);
    if (!s) {
      s = { buffer: [], count: "", timer: null, hints: null, ignore: false };
      states.set(win, s);
    }
    return s;
  }

  // --- talking to the browser ------------------------------------------------
  function topId(win) {
    return win.browsingContext?.top?.id;
  }
  function sendCommand(win, cmd, args, count) {
    Services.cpmm.sendAsyncMessage("Vim:Command", { bcId: topId(win), cmd, args, count });
  }
  function status(win, text) {
    Services.cpmm.sendAsyncMessage("Vim:Status", { bcId: topId(win), text });
  }

  // --- scrolling -------------------------------------------------------------
  function canScroll(el, win, axis = "y") {
    if (!el || el.nodeType !== 1) return false;
    const big = axis === "y" ? el.scrollHeight > el.clientHeight + 1 : el.scrollWidth > el.clientWidth + 1;
    if (!big) return false;
    const o = win.getComputedStyle(el)[axis === "y" ? "overflowY" : "overflowX"];
    return o === "auto" || o === "scroll" || o === "overlay";
  }
  function* allElements(root) {
    const walker = root.ownerDocument
      ? root.ownerDocument.createTreeWalker(root, 1 /* SHOW_ELEMENT */)
      : root.createTreeWalker(root, 1);
    for (let n = walker.currentNode; n; n = walker.nextNode()) {
      if (n.nodeType === 1) {
        yield n;
        const shadow = n.openOrClosedShadowRoot;
        if (shadow) yield* allElements(shadow);
      }
    }
  }
  function deepActiveElement(doc) {
    let el = doc.activeElement;
    while (el?.openOrClosedShadowRoot?.activeElement) el = el.openOrClosedShadowRoot.activeElement;
    return el;
  }
  // The element j/k should scroll: the scrollable box around the focused
  // element, else the page, else the largest scrollable box (Settings and many
  // apps scroll an inner panel instead of the page).
  function scrollTarget(win, axis) {
    const doc = win.document;
    for (let n = deepActiveElement(doc); n && n !== doc.documentElement; n = n.parentElement ?? n.getRootNode()?.host) {
      if (n !== doc.body && canScroll(n, win, axis)) return n;
    }
    const se = doc.scrollingElement;
    if (se && (axis === "y" ? se.scrollHeight > se.clientHeight + 1 : se.scrollWidth > se.clientWidth + 1)) {
      const o = win.getComputedStyle(se)[axis === "y" ? "overflowY" : "overflowX"];
      if (o !== "hidden" && o !== "clip") return se;
    }
    let best = null;
    let bestArea = 0;
    for (const el of allElements(doc.documentElement)) {
      if (!canScroll(el, win, axis)) continue;
      const area = el.clientWidth * el.clientHeight;
      if (area > bestArea) {
        bestArea = area;
        best = el;
      }
    }
    return best ?? se;
  }
  // Smooth scrolls restart from wherever the running animation has got to, so
  // quick presses (or holding j) would barely add up. Aim each step at where
  // the previous one was heading instead.
  const heading = new WeakMap(); // element -> { axis, to, until }
  function scroll(win, axis, amount) {
    const el = scrollTarget(win, axis);
    if (!el) return;
    const smooth = String(setting("smoothscroll", "true")) === "true";
    const now = Date.now();
    const current = axis === "y" ? el.scrollTop : el.scrollLeft;
    const max = axis === "y" ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    const prev = heading.get(el);
    const from = smooth && prev?.axis === axis && now < prev.until ? prev.to : current;
    const to = Math.max(0, Math.min(from + amount, max));
    heading.set(el, { axis, to, until: now + 450 });
    el.scrollTo({ [axis === "y" ? "top" : "left"]: to, behavior: smooth ? "smooth" : "instant" });
  }
  function scrollTo(win, where) {
    const el = scrollTarget(win, "y");
    if (!el) return;
    const behavior = String(setting("smoothscroll", "true")) === "true" ? "smooth" : "instant";
    el.scrollTo({ top: where === "top" ? 0 : el.scrollHeight, behavior });
  }
  const viewportHeight = (win) => scrollTarget(win, "y")?.clientHeight ?? win.innerHeight;

  // --- hints ---------------------------------------------------------------
  const HINTABLE = [
    "a[href]", "area[href]", "button", "input:not([type=hidden])", "select", "textarea", "summary",
    "label[for]", "[role=button]", "[role=link]", "[role=tab]", "[role=menuitem]", "[role=checkbox]",
    "[role=radio]", "[role=switch]", "[role=option]", "[onclick]", "[contenteditable='']",
    "[contenteditable=true]", "[tabindex]:not([tabindex='-1'])",
    // Firefox's own pages (Settings, about:addons) use these custom elements.
    "moz-button", "moz-toggle", "moz-checkbox", "moz-radio", "moz-select", "moz-box-button",
    "moz-box-link", "moz-support-link", "moz-page-nav-button",
  ].join(",");

  function visibleRect(el, win) {
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return null;
    const r = [...el.getClientRects()].find((c) => c.width > 2 && c.height > 2);
    if (!r || r.bottom < 0 || r.right < 0 || r.top > win.innerHeight || r.left > win.innerWidth) return null;
    // Skip elements fully covered by something else.
    const root = el.getRootNode();
    const x = Math.min(Math.max(r.left + Math.min(r.width / 2, 12), 0), win.innerWidth - 1);
    const y = Math.min(Math.max(r.top + r.height / 2, 0), win.innerHeight - 1);
    const hit = (root.elementFromPoint ? root : win.document).elementFromPoint(x, y);
    if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) {
      const host = hit.openOrClosedShadowRoot ? hit : null;
      if (!host || !host.openOrClosedShadowRoot.contains(el)) return null;
    }
    return r;
  }

  function hintTargets(win) {
    const found = [];
    const seen = new Set();
    for (const el of allElements(win.document.documentElement)) {
      if (!el.matches?.(HINTABLE)) continue;
      // Prefer the outermost hintable element (a link around a button, etc.).
      let skip = false;
      for (let p = el.parentElement ?? el.getRootNode()?.host; p; p = p.parentElement ?? p.getRootNode()?.host) {
        if (seen.has(p)) { skip = true; break; }
      }
      if (skip) continue;
      const rect = visibleRect(el, win);
      if (!rect) continue;
      seen.add(el);
      found.push({ el, rect });
    }
    return found;
  }

  function hintLabels(n, chars) {
    const k = chars.length;
    let len = 1;
    while (k ** len < n) len++;
    const labels = [];
    for (let i = 0; labels.length < n; i++) {
      let s = "";
      for (let j = 0, v = i; j < len; j++, v = Math.floor(v / k)) s = chars[v % k] + s;
      labels.push(s);
    }
    return labels;
  }

  const HINT_CSS = `
    :host { all: initial; }
    .h {
      position: fixed; z-index: 2147483647; pointer-events: none;
      font: 700 11px/1.25 ui-monospace, Consolas, monospace; letter-spacing: 0.04em;
      color: #11151c; background: #88c0d0; border-radius: 3px; padding: 1px 4px;
      text-transform: uppercase; box-shadow: 0 1px 4px rgb(0 0 0 / 0.45);
    }
    .h .typed { opacity: 0.45; }
    .h.hidden { display: none; }`;

  function startHints(win, mode) {
    stopHints(win);
    const chars = String(setting("hintchars", "asdfghjkl"));
    const targets = hintTargets(win);
    if (!targets.length) {
      status(win, "no hints");
      setTimeout(() => status(win, ""), 900);
      return;
    }
    const doc = win.document;
    const host = doc.createElement("div");
    host.setAttribute("data-vim-hints", String(targets.length));
    host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647;";
    const shadow = host.attachShadow({ mode: "closed" });
    // A constructed stylesheet: a <style> element would be blocked by pages
    // whose Content-Security-Policy forbids inline styles (addons.mozilla.org).
    const sheet = new win.CSSStyleSheet();
    sheet.replaceSync(HINT_CSS);
    shadow.adoptedStyleSheets = [sheet];
    const labels = hintLabels(targets.length, chars);
    const hints = targets.map(({ el, rect }, i) => {
      const tag = doc.createElement("span");
      tag.className = "h";
      tag.textContent = labels[i];
      tag.style.left = `${Math.max(rect.left - 2, 0)}px`;
      tag.style.top = `${Math.max(rect.top - 2, 0)}px`;
      shadow.append(tag);
      return { el, label: labels[i], tag };
    });
    doc.documentElement.append(host);
    stateFor(win).hints = { host, hints, typed: "", mode };
    status(win, mode === "tab" ? "HINT (tab)" : "HINT");
  }

  function stopHints(win) {
    const s = stateFor(win);
    s.hints?.host.remove();
    s.hints = null;
  }

  function hintKey(win, key) {
    const s = stateFor(win);
    const h = s.hints;
    if (key === "<Esc>" || key === "<C-[>") {
      stopHints(win);
      status(win, "");
      return;
    }
    if (key === "<BS>") h.typed = h.typed.slice(0, -1);
    else if (key.length === 1) h.typed += key.toLowerCase();
    else return;
    const matches = h.hints.filter((x) => x.label.startsWith(h.typed));
    for (const x of h.hints) {
      const on = x.label.startsWith(h.typed);
      x.tag.classList.toggle("hidden", !on);
      if (on) {
        x.tag.textContent = "";
        const typed = win.document.createElement("span");
        typed.className = "typed";
        typed.textContent = x.label.slice(0, h.typed.length);
        x.tag.append(typed, x.label.slice(h.typed.length));
      }
    }
    if (matches.length === 1 && matches[0].label === h.typed) {
      stopHints(win);
      status(win, "");
      activate(win, matches[0].el, h.mode);
    } else if (matches.length === 0) {
      stopHints(win);
      status(win, "");
    }
  }

  function activate(win, el, mode) {
    const link = el.closest?.("a[href], area[href]");
    if (mode === "tab" && link?.href) {
      sendCommand(win, "opentab", [link.href, "background"], 0);
      return;
    }
    if (VimKeys.isEditable(el) || el.localName === "select") {
      el.focus();
      return;
    }
    el.focus?.({ focusVisible: false });
    const r = el.getBoundingClientRect();
    const opts = { bubbles: true, cancelable: true, composed: true, view: win, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0 };
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup"]) {
      el.dispatchEvent(new (type.startsWith("pointer") ? win.PointerEvent : win.MouseEvent)(type, opts));
    }
    el.click();
  }

  function focusInput(win) {
    for (const el of allElements(win.document.documentElement)) {
      if (VimKeys.isEditable(el) && el.localName !== "select" && visibleRect(el, win)) {
        el.focus();
        el.select?.();
        return;
      }
    }
    status(win, "no text field");
    setTimeout(() => status(win, ""), 900);
  }

  // --- commands that run in the page ----------------------------------------
  const PAGE_COMMANDS = {
    scrolldown: (win, n) => scroll(win, "y", Number(setting("scrollstep", 70)) * n),
    scrollup: (win, n) => scroll(win, "y", -Number(setting("scrollstep", 70)) * n),
    scrollright: (win, n) => scroll(win, "x", Number(setting("scrollstep", 70)) * n),
    scrollleft: (win, n) => scroll(win, "x", -Number(setting("scrollstep", 70)) * n),
    halfpagedown: (win, n) => scroll(win, "y", (viewportHeight(win) / 2) * n),
    halfpageup: (win, n) => scroll(win, "y", -(viewportHeight(win) / 2) * n),
    pagedown: (win, n) => scroll(win, "y", viewportHeight(win) * 0.9 * n),
    pageup: (win, n) => scroll(win, "y", -viewportHeight(win) * 0.9 * n),
    scrolltop: (win) => scrollTo(win, "top"),
    scrollbottom: (win) => scrollTo(win, "bottom"),
    hint: (win) => startHints(win, "follow"),
    hinttab: (win) => startHints(win, "tab"),
    focusinput: (win) => focusInput(win),
    toggleignore: (win) => {
      const t = topState(win);
      t.ignore = !t.ignore;
      status(win, t.ignore ? "IGNORE" : "");
    },
  };

  function run(win, binding, count) {
    const fn = PAGE_COMMANDS[binding.cmd];
    if (fn) fn(win, Math.max(count, 1), binding.args);
    else sendCommand(win, binding.cmd, binding.args, count);
  }

  // --- key handling ----------------------------------------------------------
  function reset(win) {
    const s = stateFor(win);
    s.buffer = [];
    s.count = "";
    clearTimeout(s.timer);
    s.timer = null;
  }

  function consume(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  function onKeyDown(e) {
    if (!e.isTrusted) return;
    const win = e.currentTarget;
    const key = VimKeys.keyName(e);
    if (!key) return;
    const s = stateFor(win);
    if (s.hints) {
      consume(e);
      hintKey(win, key);
      return;
    }
    const cfg = config();
    if (topState(win).ignore) {
      if (cfg.bindings[key]?.cmd === "toggleignore") {
        consume(e);
        PAGE_COMMANDS.toggleignore(win);
      }
      return;
    }
    const target = e.composedTarget ?? e.originalTarget ?? e.target;
    if (VimKeys.isEditable(target)) {
      if (key === "<Esc>") {
        consume(e);
        target.blur?.();
        deepActiveElement(win.document)?.blur?.();
      }
      return;
    }
    handleKey(win, key, e);
  }

  function handleKey(win, key, e) {
    const s = stateFor(win);
    const cfg = config();
    if (key === "<Esc>" && (s.buffer.length || s.count)) {
      consume(e);
      reset(win);
      status(win, "");
      return;
    }
    if (/^[0-9]$/.test(key) && !s.buffer.length && (s.count || key !== "0") && !cfg.bindings[key]) {
      consume(e);
      s.count += key;
      status(win, s.count);
      return;
    }
    s.buffer.push(key);
    const seq = s.buffer.join("");
    const binding = cfg.bindings[seq];
    if (binding) {
      consume(e);
      const count = Number(s.count || 0);
      reset(win);
      status(win, "");
      try {
        run(win, binding, count);
      } catch (err) {
        console.error("vim: command failed", binding.cmd, err);
      }
      return;
    }
    if (cfg.prefixes.includes(seq)) {
      consume(e);
      status(win, s.count + seq);
      clearTimeout(s.timer);
      s.timer = setTimeout(() => {
        reset(win);
        status(win, "");
      }, Number(setting("timeout", 1500)));
      return;
    }
    // Not a binding: drop what was pending; a key that ended a dead sequence
    // gets a fresh look on its own ("g" then "j" still scrolls).
    const hadPending = s.buffer.length > 1;
    reset(win);
    status(win, "");
    if (hadPending) handleKey(win, key, e);
  }

  // Commands the browser forwards here (e.g. "f" pressed while focus was in the
  // sidebar).
  Services.cpmm.addMessageListener("Vim:Run", (msg) => {
    const win = tops.get(msg.data.bcId)?.deref();
    if (!win || win.closed) return;
    const fn = PAGE_COMMANDS[msg.data.cmd];
    if (fn) fn(win, Math.max(msg.data.count, 1), msg.data.args);
  });

  // --- attaching to every page window ---------------------------------------
  function attach(doc) {
    const win = doc?.defaultView;
    if (!win || !win.browsingContext?.isContent || states.has(win)) return;
    stateFor(win);
    win.addEventListener("keydown", onKeyDown, { capture: true });
    win.addEventListener("pagehide", () => {
      stopHints(win);
      reset(win);
    });
    if (win.top === win) tops.set(win.browsingContext.id, new WeakRef(win));
  }
  Services.obs.addObserver((doc) => attach(doc), "document-element-inserted");
})();
