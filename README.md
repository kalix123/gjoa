# Vim Firefox

A dark, see-through Firefox with vertical tabs and Vim keys built in, made
entirely from a Firefox profile: no custom Firefox build, no extension,
nothing to compile. It runs on regular Firefox (built and tested on Firefox
160, Windows 11).

- **Look:** the sidebar and the page sit as two floating cards over a
  Windows acrylic (blurred) backdrop, with see-through menus, settings pages
  and addons.mozilla.org.
- **Vim keys everywhere:** websites, the new tab page, Settings, about:addons
  and addons.mozilla.org — places a Tridactyl/Vimium extension can't reach.
  Keys are read before the page sees them, so sites can't take them over.
- **Tridactyl-style config file**, a `?` help panel and a `:` command line.

## Install

Needs [Node.js](https://nodejs.org) 18+ and Firefox.

1. **Once, from an administrator terminal** (on Windows: right-click
   PowerShell → *Run as administrator*):

   ```
   node scripts/install.mjs --install-loader
   ```

   This writes two small files into the Firefox install folder
   (`config.js` and `defaults/pref/config-prefs.js`) that let a profile run
   its own JavaScript. Profiles without this setup are unaffected. Any
   existing `config.js` is kept as `config.js.bak`. It never needs to be run
   again, even after updates.

2. **Install the profile and start it:**

   ```
   node scripts/install.mjs --launch
   ```

   This creates a separate Firefox profile named `rewrite` (or updates it),
   copies `profile/` into it and starts Firefox on it. Your other Firefox
   profiles are left alone. `--profile <name>` picks another profile name,
   `--firefox <folder>` another Firefox install.

Run step 2 again after pulling changes. It replaces everything in the
profile's `chrome/` folder **except your key config** (`chrome/vimrc`).

### Starting it without a terminal

Firefox opens its *default* profile when started normally. Either:

- open `about:profiles` in Firefox and click **Set as default profile**
  under `rewrite` — the normal Firefox icon then opens this setup; or
- make a shortcut that runs
  `"C:\Program Files\Mozilla Firefox\firefox.exe" -P rewrite`
  and keep your default profile as it is.

## Vim keys

Press `?` on any page for the full list (it reflects your own config).

| Keys | Does |
| --- | --- |
| `j` `k` `h` `l` | scroll down / up / left / right |
| `<C-d>` `<C-u>`, `<C-f>` `<C-b>` | half page / full page down, up |
| `gg` `G` | top / bottom |
| `H` `L` | back / forward |
| `r` `R` | reload / reload bypassing the cache |
| `gu` `gU` | up one level in the address / site root |
| `J` `K` (also `gt` `gT`) | next / previous tab |
| `g0` `g$` | first / last tab |
| `d` `u` | close tab / reopen closed tab |
| `t` | `:tabopen ` — type an address or search, Enter opens it in a new tab |
| `yt` `gp` | duplicate / pin tab |
| `o` `O` | address bar / edit the current address |
| `p` `P` | open the copied address or search here / in a new tab |
| `yy` | copy the address |
| `f` `F` | link hints: type the label to click / open in a background tab |
| `gi` | first text field |
| `/` `n` `N` | find in page, next, previous |
| `zi` `zo` `zz` | zoom in / out / reset |
| `gb` | show / hide the sidebar |
| `?` | help panel |
| `:` | command line |
| `<S-Insert>` | keys off / on for this tab (for sites with their own shortcuts) |

A number before a key repeats it (`5j`). Text fields get every key; `<Esc>`
leaves the field. New tabs keep focus on the page, so keys work right away;
use `o` or `Ctrl+L` for the address bar. Pending keys and modes (`HINT`,
`IGNORE`) show at the bottom of the sidebar.

### Command line (`:`)

`Tab` completes, `↑` `↓` recall earlier commands, `Esc` closes. Every command
from the table works by name (`:tabclose`, `:hint`, `:5 scrolldown`), plus:

| Command | Does |
| --- | --- |
| `:open <url or search>` | open it in this tab |
| `:tabopen <url or search>` | open it in a new tab |
| `:config` | open your config file in an editor |
| `:source` | re-read the config files |
| `:set <name> <value>` | change a setting until restart |
| `:bind <keys> <command> [args]` | add a binding until restart |
| `:unbind <keys>` | remove a binding until restart |
| `:help` | the help panel |
| `:q` | close the tab |

### Config

Your bindings and settings live in **`chrome/vimrc` inside the profile**.
`:config` opens it; saved changes apply within a second, no restart. The
installer creates it once from a commented template and never overwrites it.
The built-in defaults are in `chrome/js/vim/defaults.vimrc` (replaced on
every install — don't edit it); your file is read after it, so it can
override or `unbind` anything.

```vim
" bind <keys> <command> [args]   unbind <keys>   unbindall   set <name> <value>
bind x tabclose
bind gh open https://github.com
unbind d
set scrollstep 120
set hintchars asdfjkl
set editor code          " what :config opens the file with (Notepad if unset)
```

Key names: characters as typed (`G` is shift+g), `<C-x>` ctrl, `<A-x>` alt,
`<S-Insert>`, `<Esc>`, `<Space>`, `<CR>`, `<Tab>`, `<BS>`, arrows `<Up>` …,
`<F1>`…`<F12>`, `<lt>` for `<`. Sequences are written together: `gg`, `gt`.
Settings: `hintchars`, `scrollstep` (pixels), `smoothscroll` (true/false),
`timeout` (ms to wait for the rest of a sequence), `editor`.

## What's in the repo

```
profile/
  user.js                    about:config settings (applied on every start)
  chrome/
    userChrome.css           browser window look
    userContent.css          Firefox's own pages and addons.mozilla.org
    vimrc                    template for your key config (installed once)
    js/
      boot.sys.mjs           entry point: config, commands, window keys, status
      vim/defaults.vimrc     built-in bindings
      vim/keys.js            key notation (<C-d>, gg, …)
      vim/content.js         runs in every page: keys, scrolling, hints
      vim/commands.sys.mjs   tab, history, find, zoom, clipboard commands
      vim/config.sys.mjs     vimrc parser
      vim/ui.sys.mjs         ? help panel and : command line
firefox/                     loader stub for the Firefox folder (--install-loader)
scripts/
  install.mjs                installer
  dev-eval.mjs               drive a running Firefox for development
```

How the keys get into pages: the loader in the Firefox folder registers
`chrome/js` as `resource://profile-js/` and imports `boot.sys.mjs` at
startup. Boot parses the config, shares it with every Firefox process, and
sends `keys.js` + `content.js` to every process as a *process script*. Web
pages run in sandboxed processes that can't read the profile folder, so the
code is sent as text rather than loaded from a file. Each page gets a
capturing key listener before any of the page's own scripts run.

`profile/user.js` settings win over changes made in about:config, so change
them in the file. Notable ones: native vertical tabs, Windows acrylic
backdrop (`widget.windows.mica.toplevel-backdrop` 2; 1 = Mica), dark content,
a quiet new tab page, and telemetry, AI features and onboarding turned off.

## Developing

```
node scripts/install.mjs --launch --marionette
node scripts/dev-eval.mjs "return gBrowser.tabs.length"              # browser window
node scripts/dev-eval.mjs --content "return document.title"         # current page
node scripts/dev-eval.mjs --content --sys "return Services.appinfo.remoteType"
node scripts/dev-eval.mjs --keys "jj<C-d>f"                          # type real keys into the page
node scripts/dev-eval.mjs --chrome-keys "abc<CR>"                    # …into the browser window
node scripts/dev-eval.mjs --screenshot shot.png
```

`--marionette` turns on Firefox's automation interface (the address bar gets
red stripes while it is on), so `dev-eval.mjs` can inspect and drive the
browser — look up element ids before writing CSS, and test keys. Under
automation Firefox blanks the new tab page, and focus jumps back to the page
after each typed key, which closes the `?`/`:` panels; test those by hand.

The page script can't be reloaded in a running browser; restart Firefox
(`install.mjs --launch` does) after changing `content.js`. Config changes
apply live.
