// Parse vimrc text (see chrome/vimrc for the syntax) into what the pages and
// the browser window need. Several sources are applied in order — defaults,
// then the user's file, then :set/:bind typed this session — so later ones
// override earlier ones.
//
//   parseConfig([{ name: "defaults.vimrc", text }, ...], VimKeys) ->
//     bindings: { "gg": { cmd: "scrolltop", args: [] }, "<C-d>": {...}, ... }
//     prefixes: ["g", "y", "z", ...]   sequences that start a longer binding
//     settings: { hintchars: "asdfghjkl", scrollstep: "70", ... }
//     errors:   ["vimrc line 12: unknown directive 'bnd'", ...]

export function applyLine(state, raw, where, VimKeys) {
  // Comments: whole lines starting with " or #, and a trailing  " … .
  const line = raw.replace(/(^|\s)".*$/, "").trim();
  if (!line || line.startsWith("#")) return;
  const [directive, ...rest] = line.split(/\s+/);
  switch (directive) {
    case "bind": {
      const [keys, cmd, ...args] = rest;
      if (!keys || !cmd) state.errors.push(`${where}: bind needs keys and a command`);
      else state.bindings[VimKeys.parseKeys(keys).join("")] = { cmd, args };
      return;
    }
    case "unbind":
      if (rest[0]) delete state.bindings[VimKeys.parseKeys(rest[0]).join("")];
      else state.errors.push(`${where}: unbind needs keys`);
      return;
    case "unbindall":
      state.bindings = {};
      return;
    case "set":
      if (rest.length < 2) state.errors.push(`${where}: set needs a name and a value`);
      else state.settings[rest[0]] = rest.slice(1).join(" ");
      return;
    default:
      state.errors.push(`${where}: unknown directive '${directive}'`);
  }
}

export function parseConfig(sources, VimKeys) {
  const state = { bindings: {}, settings: {}, errors: [] };
  for (const { name, text } of sources) {
    (text ?? "").split(/\r?\n/).forEach((raw, i) => applyLine(state, raw, `${name} line ${i + 1}`, VimKeys));
  }
  // Every proper prefix of a multi-key binding, token by token.
  const prefixes = new Set();
  for (const seq of Object.keys(state.bindings)) {
    const keys = VimKeys.parseKeys(seq);
    for (let n = 1; n < keys.length; n++) prefixes.add(keys.slice(0, n).join(""));
  }
  return { ...state, prefixes: [...prefixes] };
}
