# Firefox profile setup

A dark, see-through, vertical-tab Firefox with Vim keys built in, made from a
plain profile: no custom Firefox build, nothing compiled. Built on Firefox
160's own vertical tabs and sidebar.

- `profile/user.js` — about:config settings (applied on every start; edit here, not in about:config)
- `profile/chrome/userChrome.css` — browser window look (cards, tabs, menus, Windows acrylic)
- `profile/chrome/userContent.css` — Firefox's own pages and addons.mozilla.org
- `profile/chrome/vimrc` — **key bindings** (Tridactyl-style; see the comments in it)
- `profile/chrome/js/` — the Vim keys themselves (see below)
- `firefox/` — a small loader that goes into the Firefox folder once

## Install

Needs Node 18+ and Firefox.

Once, from an **administrator** terminal (it writes two small files into the
Firefox folder that let the profile run its own JavaScript; profiles without
`chrome/js/` are unaffected):

```
node scripts/install.mjs --install-loader
```

Then, as often as you like:

```
node scripts/install.mjs --launch
```

This creates (or updates) a separate Firefox profile named `rewrite`, copies
`profile/` into it and starts Firefox on it. Your other profiles are untouched.
Use `--profile <name>` for another profile.

## Vim keys

They work on every page — websites, the new tab page, Settings, about:addons,
addons.mozilla.org — because they are part of the browser, not an extension.
Keys are read before the page sees them, so sites can't steal them. Text
fields get every key; `<Esc>` leaves a field. `<S-Insert>` turns the keys off
for a tab (for sites with their own shortcuts). The current mode and pending
keys show in the sidebar footer.

Defaults (all in `profile/chrome/vimrc`): `j k h l` scroll, `<C-d> <C-u>` half
pages, `gg G` top/bottom, `H L` back/forward, `r` reload, `J K` next/previous
tab, `d` close tab, `u` undo close, `t` new tab, `o O` address bar, `p P` open
the clipboard, `yy` copy the address, `f F` link hints (`F` = background tab),
`gi` first text field, `/ n N` find, `zi zo zz` zoom, `gb` toggle sidebar.
A count repeats: `5j`.

Edit `vimrc` and a running browser picks it up within a second (the copy in
the profile, or edit the repo copy and run `install.mjs`).

How it is built: `js/boot.sys.mjs` is loaded by the loader at startup. It
parses `vimrc` (`js/vim/config.sys.mjs`), shares it with every Firefox process,
and sends `js/vim/keys.js` + `js/vim/content.js` to every process as a process
script — web pages run in sandboxed processes that can't read the profile
folder, so the code travels as text. Browser-level commands are in
`js/vim/commands.sys.mjs`.

## Developing

```
node scripts/install.mjs --launch --marionette
node scripts/dev-eval.mjs "return gBrowser.tabs.length"          # browser window
node scripts/dev-eval.mjs --content "return document.title"     # current page
node scripts/dev-eval.mjs --content --sys "return Services.appinfo.remoteType"
node scripts/dev-eval.mjs --keys "jj<C-d>f"                      # type real keys
node scripts/dev-eval.mjs --screenshot shot.png
```

`--marionette` turns on Firefox's automation interface (the address bar gets
red stripes while it is on), so `dev-eval.mjs` can inspect and drive the
browser — use it to look up element ids before writing CSS, and to test keys.
Under automation Firefox blanks the new tab page, so hints can't be tested there.
