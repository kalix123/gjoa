<div align="center">

<img src="configs/branding/gjoa/content/about-logo.png" width="84" alt="gjoa" />

# gjoa

**A Firefox fork with the power-user stack built in.**

Native blocking, site-aware dark mode, vertical tree tabs, workspaces, vim navigation, session history, and egress auditing live in the browser—not in an extension collection.

<img src="screenshots/gjoa-newtab.png" width="760" alt="gjoa new-tab navigator, vertical tabs, and dark mode" />

</div>

## Why gjoa

Gjoa is a return to form for what the browser was meant to be.

The browser should belong to its user: open, adaptable, deeply customizable, and capable of serious work.

Modern workflows too often depend on fragile layers of extensions, scripts, hidden preferences, and configuration workarounds. Gjoa reclaims the browser as a personal computing environment by bringing vertical tabs, workspaces, keyboard-driven navigation, interface control, native dark mode, and privacy-oriented controls into the browser itself.

## Included

| Capability | What it does |
|---|---|
| Blocking | Native network, cosmetic, and curated scriptlet filtering |
| Dark mode | Pre-paint darkening for light sites while preserving native dark themes |
| Tabs + keyboard | Vertical tree tabs, modal navigation, remappable bindings, and commands |
| Workspaces | Named tab spaces that persist across session restore |
| History | Searchable, append-only session history |
| Browser UI | Floating urlbar, sidebar drawer, and a custom new-tab page |
| Control | `about:gjoa` settings, reversible features, and `about:sovereignty` egress audit |

## Releases

Tagged releases produce draft GitHub releases with portable artifacts for:

- Linux x86_64 (`.tar.xz` or `.AppImage`)
- Linux arm64 (`.tar.xz` or `.AppImage`)
- macOS Apple Silicon (`.dmg`)
- Windows x86_64 (`.zip`)

Download the artifact for your platform from [Releases](../../releases). Extract archives before launching `gjoa`; AppImages run directly after `chmod +x`.

## Build from source

Requires Node 22+, git, curl and tar, plus whatever Mozilla's `mach bootstrap` installs.

```sh
node scripts/prepare.mjs        # fetch + verify Firefox, apply patches, overlay gjoa
cd engine
./mach bootstrap --application-choice=browser   # first time only
./mach build && ./mach run
```

Window chrome (tabs, drawer, vim keys, theme) is plain JavaScript under
`src/gjoa/chrome/` and hot-reloads into a running build without recompiling;
see [docs/BUILDING.md](docs/BUILDING.md).

```sh
npm test                        # unit tests (Node's built-in runner)
```

## Documentation

- [Building, developing and updating Firefox](docs/BUILDING.md)
- [Dark mode](docs/dark-mode.md)
- [Security policy](docs/security-policy.md)

## License

[MPL-2.0](LICENSE), the same license as Firefox.
