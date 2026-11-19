// The ? help panel and the : command line. Both are drawn in the browser
// window over the page card (not inside the page, so no page style or
// security policy can interfere) and take keyboard focus while open; the key
// handlers in boot.sys.mjs and content.js leave them alone.

import { ALIASES, DOCS } from "resource://profile-js/vim/commands.sys.mjs";

const HTML = "http://www.w3.org/1999/xhtml";

function el(doc, tag, attrs = {}, ...children) {
  const node = doc.createElementNS(HTML, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else node.setAttribute(k, v);
  }
  node.append(...children.flat().filter((c) => c !== null && c !== undefined));
  return node;
}

function host(win) {
  return win.document.getElementById("tabbrowser-tabbox");
}

export function closeOverlays(win, { refocus = true } = {}) {
  const doc = win.document;
  const open = doc.getElementById("vim-help") ?? doc.getElementById("vim-cmdline");
  doc.getElementById("vim-help")?.remove();
  doc.getElementById("vim-cmdline")?.remove();
  if (open && refocus) win.gBrowser.selectedBrowser.focus();
}

// --- help (?) ------------------------------------------------------------------
export function showHelp(win, { config, userConfig, defaultsConfig }) {
  closeOverlays(win, { refocus: false });
  const doc = win.document;
  const keysFor = (name) =>
    Object.entries(config.bindings)
      .filter(([, b]) => b.cmd === name && !b.args.length)
      .map(([k]) => k);

  const groups = [];
  for (const d of DOCS) {
    let g = groups.find((x) => x.name === d.group);
    if (!g) groups.push((g = { name: d.group, rows: [] }));
    g.rows.push(d);
  }
  const custom = Object.entries(config.bindings).filter(([, b]) => b.args.length || !DOCS.some((d) => d.name === b.cmd));

  const section = (title, ...rows) => el(doc, "section", {}, el(doc, "h2", {}, title), ...rows);
  const row = (keys, text, cmd) =>
    el(doc, "div", { class: "row" },
      el(doc, "span", { class: "keys" }, keys.length ? keys.map((k) => el(doc, "kbd", {}, k)) : el(doc, "span", { class: "none" }, "—")),
      el(doc, "span", { class: "desc" }, text),
      el(doc, "code", { class: "cmd" }, cmd));

  const panel = el(doc, "div", { id: "vim-help", tabindex: "-1" },
    el(doc, "header", {},
      el(doc, "h1", {}, "Keys"),
      el(doc, "span", { class: "hint" }, "Esc, q or ? closes · j/k scroll")),
    el(doc, "div", { class: "body" },
      el(doc, "div", { class: "cols" },
        groups.filter((g) => g.name !== "Config").map((g) =>
          section(g.name, g.rows.map((d) => row(keysFor(d.name), d.desc, d.name)))),
        custom.length ? section("Your other bindings", custom.map(([k, b]) => row([k], [b.cmd, ...b.args].join(" "), ""))) : null),
      section("Command line",
        el(doc, "p", {}, "Press ", el(doc, "kbd", {}, ":"), " and type a command; ", el(doc, "kbd", {}, "Tab"), " completes, ", el(doc, "kbd", {}, "↑"), el(doc, "kbd", {}, "↓"), " recall earlier ones. Every command above works there too (", el(doc, "code", {}, ":tabclose"), ", ", el(doc, "code", {}, ":hint"), ")."),
        DOCS.filter((d) => d.args || d.group === "Config").map((d) =>
          el(doc, "div", { class: "row" }, el(doc, "code", { class: "wide" }, `:${d.name}${d.args ? " " + d.args : ""}`), el(doc, "span", { class: "desc" }, d.desc))),
        el(doc, "p", { class: "muted" }, `Short forms: ${Object.entries(ALIASES).map(([a, c]) => `:${a} = :${c}`).join(", ")}.`)),
      section("Config",
        el(doc, "p", {}, "Your bindings and settings: ", el(doc, "code", {}, userConfig), ". Open it with ", el(doc, "code", {}, ":config"), " — saved changes apply within a second."),
        el(doc, "p", {}, "Built-in defaults (replaced on install, don't edit): ", el(doc, "code", {}, defaultsConfig), "."),
        el(doc, "p", {}, "Syntax: ", el(doc, "code", {}, "bind <keys> <command> [args]"), ", ", el(doc, "code", {}, "unbind <keys>"), ", ", el(doc, "code", {}, "set <name> <value>"), ". The top of your config file explains key names and settings.")),
      section("Modes",
        el(doc, "p", {}, "Text fields get every key; ", el(doc, "kbd", {}, "Esc"), " leaves them. ", el(doc, "kbd", {}, "<S-Insert>"), " turns the keys off for one tab (status shows IGNORE). A number before a key repeats it: ", el(doc, "kbd", {}, "5j"), "."))));

  panel.addEventListener("keydown", (e) => {
    const body = panel.querySelector(".body");
    const k = e.key;
    if (k === "Escape" || k === "q" || k === "?") closeOverlays(win);
    else if (k === "j" || k === "ArrowDown") body.scrollBy({ top: 60 });
    else if (k === "k" || k === "ArrowUp") body.scrollBy({ top: -60 });
    else if ((k === "d" && e.ctrlKey) || k === "PageDown" || k === " ") body.scrollBy({ top: body.clientHeight / 2 });
    else if ((k === "u" && e.ctrlKey) || k === "PageUp") body.scrollBy({ top: -body.clientHeight / 2 });
    else if (k === "G" || k === "End") body.scrollTo({ top: body.scrollHeight });
    else if (k === "g" || k === "Home") body.scrollTo({ top: 0 });
    else return;
    e.preventDefault();
    e.stopPropagation();
  });
  panel.addEventListener("blur", () => win.setTimeout(() => {
    if (!panel.contains(doc.activeElement)) panel.remove();
  }, 0));
  host(win).append(panel);
  panel.focus();
}

// --- command line (:) -----------------------------------------------------------
const history = [];

export function showCmdline(win, { run, initial = "" }) {
  closeOverlays(win, { refocus: false });
  const doc = win.document;
  const input = el(doc, "input", { type: "text", spellcheck: "false", autocomplete: "off" });
  const list = el(doc, "div", { class: "completions" });
  const bar = el(doc, "div", { id: "vim-cmdline" }, list, el(doc, "div", { class: "line" }, el(doc, "span", { class: "colon" }, ":"), input));
  let matches = [];
  let pick = -1;
  let historyPos = history.length;

  // Completions: commands whose name starts with (then contains) the first word.
  function compute() {
    const text = input.value.trimStart();
    const word = text.split(/\s+/)[0] ?? "";
    matches = /\s/.test(text) ? [] : DOCS.filter((d) => d.name.startsWith(word) || (word && d.name.includes(word)))
      .sort((x, y) => Number(y.name.startsWith(word)) - Number(x.name.startsWith(word)))
      .slice(0, 8);
  }
  function render() {
    list.replaceChildren(...matches.map((d, i) =>
      el(doc, "div", { class: "item" + (i === pick ? " picked" : "") },
        el(doc, "code", {}, d.name + (d.args ? " " + d.args : "")), el(doc, "span", {}, d.desc))));
  }

  input.addEventListener("input", () => {
    pick = -1;
    compute();
    render();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeOverlays(win);
    } else if (e.key === "Enter") {
      const line = input.value.trim();
      closeOverlays(win, { refocus: false });
      if (line) {
        if (history.at(-1) !== line) history.push(line);
        run(line);
      }
      if (doc.activeElement === null || doc.activeElement === doc.documentElement) win.gBrowser.selectedBrowser.focus();
    } else if (e.key === "Tab") {
      // Tab / Shift+Tab cycle through the completions, filling them in.
      if (pick < 0) compute();
      if (matches.length) {
        const n = matches.length;
        pick = pick < 0 ? (e.shiftKey ? n - 1 : 0) : (pick + (e.shiftKey ? n - 1 : 1)) % n;
        input.value = matches[pick].name + (matches[pick].args ? " " : "");
        render();
      }
  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (!history.length) return;
      historyPos = Math.max(0, Math.min(history.length, historyPos + (e.key === "ArrowUp" ? -1 : 1)));
      input.value = history[historyPos] ?? "";
      pick = -1;
      compute();
      render();
    } else {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  });
  input.addEventListener("blur", () => win.setTimeout(() => {
    if (!bar.contains(doc.activeElement)) bar.remove();
  }, 0));

  host(win).append(bar);
  input.value = initial;
  compute();
  render();
  input.focus();
}
