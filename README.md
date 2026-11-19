# Firefox profile setup

A dark, vertical-tab Firefox built from a plain profile: no custom Firefox
build, nothing compiled. Built on Firefox 160's own vertical tabs and sidebar.

- `profile/user.js` — about:config settings (applied on every start; edit here, not in about:config)
- `profile/chrome/userChrome.css` — browser window look (palette, floating content card, tabs)
- `profile/chrome/userContent.css` — Firefox's own pages (new tab)

## Install

Needs Node 18+ and Firefox.

```
node scripts/install.mjs --launch
```

This creates (or updates) a separate Firefox profile named `rewrite`, copies
`profile/` into it and starts Firefox on it. Your other profiles are untouched.
Use `--profile <name>` for another profile.

## Developing

```
node scripts/install.mjs --launch --marionette
node scripts/dev-eval.mjs "return document.getElementById('nav-bar').children.length"
node scripts/dev-eval.mjs --screenshot shot.png
```

`--marionette` turns on Firefox's automation interface (the address bar gets
red stripes while it is on), so `dev-eval.mjs` can run code in the browser
window and take screenshots — use it to look up element ids before writing CSS.
