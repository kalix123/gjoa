import { existsSync, readdirSync, statSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { ENGINE_DIR } from './paths.js';
import { log } from './log.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const LOCALE_DIR = join(ENGINE_DIR, "browser", "locales", "en-US");

const SUBSTITUTIONS = [["Get speed, safety, and privacy every time you browse.", "A browser at your command."], ["Get speed, safety and privacy every time you browse.", "A browser at your command."]];

function walk_bang(root) {
  const out = [];
  (() => { function recurse(dir) { readdirSync(dir).forEach((name) => {
  const p = join(dir, name);
  const st = statSync(p);
  if (((_truthy) => _truthy !== false && _truthy != null)(st.isDirectory())) {
    recurse(p);
  } else {
    if (((_truthy) => _truthy !== false && _truthy != null)(st.isFile())) {
      out.push(p);
    }
  }
}); } return recurse(root); })();
  return out;
}

const TEXT_EXTS = new RegExp("\\.(ftl|dtd|properties|js|json|html|xml|md|txt)$", "i");

function apply_subs(text) {
  return SUBSTITUTIONS.reduce((acc, pair) => { const from = pair[0];
const to = pair[1];
return (((_truthy) => _truthy !== false && _truthy != null)(acc.includes(from)) ? acc.split(from).join(to) : acc); }, text);
}

function text_file_p(path) {
  return TEXT_EXTS.test(path);
}

async function rewrite_one(path) {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(text_file_p(path)))) {
    return 0;
  } else {
    const text = await (async () => { try {
    return await readFile(path, "utf8");
  } catch (e) {
    return null;
  } })();
    if ((text == null)) {
      return 0;
    } else {
      const next = apply_subs(text);
      if ((!($$bc$equiv(next, text)))) {
        await writeFile(path, next, "utf8");
        return 1;
      } else {
        return 0;
      }
    }
  }
}

export async function locales_bang() {
  if ((!((_truthy) => _truthy !== false && _truthy != null)(existsSync(LOCALE_DIR)))) {
    log.warn(("".concat("locales: ", LOCALE_DIR, " missing -- skipping (engine/ not imported?)")));
    return null;
  } else {
    log.step("rewriting Firefox-isms in browser locales");
    const results = await Promise.all(walk_bang(LOCALE_DIR).map(rewrite_one));
    const changed = results.reduce((a, b) => (a + b), 0);
    return log.ok(("".concat("locales: rewrote ", changed, " file", (($$bc$equiv(changed, 1)) ? "" : "s"))));
  }
}
