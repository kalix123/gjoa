import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ENGINE_DIR = "engine";

function dirname(p) {
  const i = p.lastIndexOf("/");
  return ((i < 0) ? "." : p.slice(0, i));
}

export function locate_gjoa(...$beagle$args) {
  if (arguments.length === 0) {
    return locate_gjoa(process.cwd());
  }
  if (arguments.length === 1) {
    const cwd = $beagle$args[0];
    const gjoa_bin = process.env.GJOA_BIN;
    if (((_truthy) => _truthy !== false && _truthy != null)(gjoa_bin)) {
      if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(gjoa_bin)))) {
        (() => { throw new Error(("".concat("$GJOA_BIN points at ", gjoa_bin, " but no such file exists"))); })();
      }
      return {path: gjoa_bin, installRoot: dirname(gjoa_bin)};
    } else {
      const engineDir = join(cwd, ENGINE_DIR);
      if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(engineDir)))) {
        (() => { throw new Error(("".concat("gjoa-locator: ", engineDir, " not found.\n", "Run from the gjoa repo root, or set $GJOA_BIN."))); })();
      }
      const objDir = (() => { let names = readdirSync(engineDir); while (true) {
    if ((names.length === 0)) { return null; } else { const name = names[0]; if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? statSync(join(engineDir, name)).isDirectory() : _logical))(name.startsWith("obj-")))) { return join(engineDir, name); } else { const _recur_0 = names.slice(1); names = _recur_0; continue; } }
  } })();
      if ((objDir == null)) {
        (() => { throw new Error(("".concat("gjoa-locator: no engine/obj-* build dir found.\n", "Run `mach build faster` (Lane 2) inside engine/ first."))); })();
      }
      const binDir = join(objDir, "dist", "bin");
      const result = (() => { let candidates = ["gjoa-bin", "gjoa", "firefox-bin", "firefox"]; while (true) {
    if ((candidates.length === 0)) { return null; } else { const candidate = candidates[0]; const p = join(binDir, candidate); if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(p))) { return {path: p, installRoot: binDir}; } else { const _recur_0 = candidates.slice(1); candidates = _recur_0; continue; } }
  } })();
      return (((_truthy) => _truthy !== false && _truthy != null)(result) ? result : (() => { throw new Error(("".concat("gjoa-locator: no gjoa-bin / gjoa / firefox-bin / firefox under ", binDir, ".\n", "The build dir exists but no binary — did the build complete?"))); })());
    }
  }
  throw new Error('No matching arity: ' + $beagle$args.length);
}
