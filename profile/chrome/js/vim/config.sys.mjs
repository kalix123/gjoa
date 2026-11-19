// Parse the vimrc (see profile/chrome/vimrc for the syntax) into what the
// pages and the browser window need:
//   bindings: { "gg": { cmd: "scrolltop", args: [] }, "<C-d>": {...}, ... }
//   prefixes: ["g", "y", "z", ...]   sequences that are the start of a binding
//   settings: { hintchars: "asdfghjkl", scrollstep: "70", ... }
//   errors:   ["line 12: unknown directive 'bnd'", ...]

export function parseConfig(text, VimKeys) {
  const bindings = {};
  const settings = {};
  const errors = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    // Comments: whole lines starting with " or #, and a trailing  " … .
    const line = raw.replace(/(^|\s)".*$/, "").trim();
    if (!line || line.startsWith("#")) return;
    const [directive, ...rest] = line.split(/\s+/);
    switch (directive) {
      case "bind": {
        const [keys, cmd, ...args] = rest;
        if (!keys || !cmd) {
          errors.push(`line ${i + 1}: bind needs keys and a command`);
          return;
        }
        bindings[VimKeys.parseKeys(keys).join("")] = { cmd, args };
        return;
      }
      case "unbind":
        if (rest[0]) delete bindings[VimKeys.parseKeys(rest[0]).join("")];
        return;
      case "unbindall":
        for (const k of Object.keys(bindings)) delete bindings[k];
        return;
      case "set":
        if (rest.length < 2) errors.push(`line ${i + 1}: set needs a name and a value`);
        else settings[rest[0]] = rest.slice(1).join(" ");
        return;
      default:
        errors.push(`line ${i + 1}: unknown directive '${directive}'`);
    }
  });

  // Every proper prefix of a multi-key binding, token by token.
  const prefixes = new Set();
  for (const seq of Object.keys(bindings)) {
    const keys = VimKeys.parseKeys(seq);
    for (let n = 1; n < keys.length; n++) prefixes.add(keys.slice(0, n).join(""));
  }
  return { bindings, prefixes: [...prefixes], settings, errors };
}
