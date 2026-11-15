
const PREFIX = "\x1b[2m[prep]\x1b[0m";

export const log = {info: (msg) => console.error(("".concat(PREFIX, " ", msg))), warn: (msg) => console.error(("".concat(PREFIX, " \x1b[33mwarn:\x1b[0m ", msg))), error: (msg) => console.error(("".concat(PREFIX, " \x1b[31merror:\x1b[0m ", msg))), step: (msg) => console.error(("".concat(PREFIX, " \x1b[1m→\x1b[0m ", msg))), ok: (msg) => console.error(("".concat(PREFIX, " \x1b[32m✓\x1b[0m ", msg)))};
