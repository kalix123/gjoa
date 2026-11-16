# Building gjoa

gjoa is Firefox plus three layers kept in this repository:

| Layer | Where | Changing it needs |
|---|---|---|
| Engine patches (C++/Rust: native blocking, dark mode) | `patches/*.patch` | a full engine build |
| Browser modules, about: pages, actors, default prefs | `src/gjoa/browser`, `src/gjoa/toolkit`, `src/gjoa/defaults/pref` | `./mach build faster` (or a full build) |
| Window chrome (tabs, drawer, vim keys, theme, …) | `src/gjoa/chrome` (ES modules → bundles) | nothing: hot-reloads in dev mode |

Everything gjoa adds is plain JavaScript with no npm dependencies. Beyond what
Firefox itself needs (`mach` bootstraps its own toolchain), the only tools are
Node 22+, git, curl and tar.

## Prepare the source tree

```sh
node scripts/prepare.mjs
```

This downloads the Firefox source named in `gjoa.json` (cached under
`~/.cache/gjoa/sources`), checks it against `configs/firefox-<version>.sha256`,
extracts it to `engine/`, applies `patches/` in order, overlays `src/gjoa/`,
bundles the chrome scripts, generates branding + default prefs, and writes
`engine/mozconfig` if there isn't one. Re-running it resets `engine/` to
vanilla Firefox first (build outputs in `engine/obj-*` are kept), so it is
always safe to run again.

## Build

```sh
cd engine
./mach bootstrap --application-choice=browser   # first time only
./mach build
./mach run
./mach package                                  # distributable archive
```

Windows release builds are cross-compiled from Linux in CI
(`.github/workflows/build-windows.yml`); building natively on Windows uses
MozillaBuild as for Firefox.

## Fast iteration on window chrome

The loader can read the chrome bundles from a directory next to the binary
instead of from omni.ja:

```sh
node scripts/chrome-bundle.mjs --dev engine/obj-*/dist/bin
GJOA_DEV_LOADER=1 ./mach run
```

Re-run the first command after editing anything under `src/gjoa/chrome/`;
open windows tear down and reload the bundles within a second. Dev mode is
refused unless `GJOA_DEV_LOADER=1` is set and the directory is not group- or
world-writable.

Bundles are listed in `src/gjoa/chrome/bundles.json`. Each module is an ES
module; only relative `import { … } from "./x.mjs"` / `import * as ns` and
`export function|const|let|class` forms are supported by the bundler.

## Tests

```sh
npm test
```

Runs the unit tests in `tests/` with Node's built-in test runner (dark-mode
color math, patch invariants, the niri workspace reducer). CI additionally
starts the built Linux binary headless and requires every chrome bundle to
initialise without script errors (`.github/scripts/chrome-smoke.sh`).

## Updating Firefox

1. Set `firefox.version` / `firefox.candidate` in `gjoa.json`.
2. Add `configs/firefox-<version>.sha256` from Mozilla's `SHA256SUMS`
   (`https://archive.mozilla.org/pub/firefox/releases/<version>/SHA256SUMS`,
   the `source/firefox-<version>.source.tar.xz` line) and delete the old one.
3. `node scripts/prepare.mjs`. If a patch no longer applies, rebase it onto the
   new tree (`git apply -3` inside `engine/` helps), regenerate it with
   `git diff`, and update its `baseline-firefox:` header line.
4. Build and run.

## Releases

Push a `vX.Y.Z` tag whose version matches `displayVersion` in `gjoa.json`
and which has notes at `.github/release-notes/vX.Y.Z.md`. CI builds every
platform and creates a **draft** GitHub release to review and publish.
