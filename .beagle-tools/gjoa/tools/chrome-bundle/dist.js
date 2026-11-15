import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { mkdir, copyFile, readdir, rm } from 'fs/promises';
import { join } from 'path';
import { equivV as $$bc$equiv } from 'beagle/core.js';

const REPO_ROOT = process.cwd();

const SRC_CHROME = join(REPO_ROOT, "src", "gjoa", "chrome");

const DIST = join(REPO_ROOT, "dist");

const DIST_CHROME = join(DIST, "chrome");

const TOOLS_DIR = join(REPO_ROOT, ".beagle-tools", "gjoa", "tools", "chrome-bundle");

async function step(name, fn) {
  const __ = console.log(("".concat("→ ", name)));
  return await fn();
}

async function copy_dir(src, dst) {
  const __ = await mkdir(dst, {recursive: true});
  const names = await readdir(src);
  for (const name of names) {
  await copyFile(join(src, name), join(dst, name));
}
}

async function main_bang() {
  if (((_truthy) => _truthy !== false && _truthy != null)(existsSync(DIST))) {
    await rm(DIST, {recursive: true});
  }
  await mkdir(DIST_CHROME, {recursive: true});
  await step("compiling beagle sources", async () => { const proc = Bun.spawn({cmd: ["bun", join(TOOLS_DIR, "compile.js")], cwd: REPO_ROOT, stdout: "inherit", stderr: "inherit"});
const code = await proc.exited;
if ((!($$bc$equiv(code, 0)))) {
  return (() => { throw new Error(("".concat("beagle compile failed (exit ", code, ")"))); })();
} });
  await step("bundling chrome JS", async () => { const proc = Bun.spawn({cmd: ["bun", join(TOOLS_DIR, "build.js")], cwd: REPO_ROOT, stdout: "inherit", stderr: "inherit"});
const code = await proc.exited;
if ((!($$bc$equiv(code, 0)))) {
  return (() => { throw new Error(("".concat("chrome bundle failed (exit ", code, ")"))); })();
} });
  await step("staging chrome/CSS", async () => await copy_dir(join(SRC_CHROME, "css"), join(DIST_CHROME, "CSS")));
  await step("writing bundle stamp", () => { const Hasher = Bun.CryptoHasher;
const hasher = new Hasher("sha256");
(() => { ["JS", "CSS"].forEach((sub) => {
  const dir = join(DIST_CHROME, sub);
  const names = readdirSync(dir).sort();
  (() => { names.forEach((name) => {
  hasher.update(name);
  hasher.update(readFileSync(join(dir, name)));
}); })();
}); })();
return writeFileSync(join(DIST_CHROME, ".bundle-stamp"), hasher.digest("hex")); });
  console.log("\n✓ chrome distribution ready at dist/");
  return console.log("  install: bun run chrome:install");
}

await main_bang();
