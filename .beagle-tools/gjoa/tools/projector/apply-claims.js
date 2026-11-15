import { readFileSync, writeFileSync } from 'fs';
import { join, resolve, sep } from 'path';
import { json__gtdoc, replay } from './claims.js';
import { parses_p } from './set-body.js';

function main_bang() {
  const artifact_path = process.argv[2];
  const engine_dir = process.argv[3];
  const doc = json__gtdoc(readFileSync(artifact_path, "utf8"));
  const file = doc.file;
  const edits = doc.edits;
  const target = join(engine_dir, file);
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : (!((_truthy) => _truthy !== false && _truthy != null)(resolve(target).startsWith(("".concat(resolve(engine_dir), sep)))))))(file.includes("..")))) {
    console.error(("".concat("  claim-doc :file escapes engine-dir, refusing: ", file)));
    process.exit(1);
  }
  const src = readFileSync(target, "utf8");
  const r = replay(edits, src);
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? parses_p(r.src) : _logical))(r.ok))) {
    writeFileSync(target, r.src);
    console.error(("".concat("  claim-doc replay OK -> ", file, " (", edits.length, " set-body edit(s))")));
    return process.exit(0);
  } else {
    console.error(("".concat("  claim-doc replay FAILED: ", (((_truthy) => _truthy !== false && _truthy != null)(r.ok) ? "rendered result does not parse" : r.reason))));
    return process.exit(1);
  }
}

if (((_truthy) => _truthy !== false && _truthy != null)(import.meta.main)) {
  main_bang();
}
