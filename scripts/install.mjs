// Copy profile/ (user.js + chrome/) into a Firefox profile. Plain Node.
//
//   node scripts/install.mjs                 install into the "rewrite" profile (created if missing)
//   node scripts/install.mjs --launch        …and start Firefox on it
//   node scripts/install.mjs --launch --marionette   …with Marionette on, for scripts/dev-eval.mjs
//
//   node scripts/install.mjs --install-loader       write the loader stub into the Firefox
//                                                   folder (once; needs an administrator terminal)
//
// Options: --profile <name>, --firefox <install dir>.
// Firefox must be closed on that profile for user.js changes to apply
// (--launch restarts it).

import { execFileSync, spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const opts = { profile: "rewrite", launch: false, marionette: false, installLoader: false };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--profile") opts.profile = argv[++i];
  else if (a === "--firefox") opts.firefox = argv[++i];
  else if (a === "--launch") opts.launch = true;
  else if (a === "--marionette") opts.marionette = true;
  else if (a === "--install-loader") opts.installLoader = true;
  else throw new Error(`unknown option ${a}`);
}

const win = platform() === "win32";
const mac = platform() === "darwin";
const ffDir = resolve(
  opts.firefox ??
    (win ? join(process.env.ProgramFiles ?? "C:\\Program Files", "Mozilla Firefox")
      : mac ? "/Applications/Firefox.app/Contents/MacOS"
      : ["/usr/lib/firefox", "/usr/lib64/firefox", "/opt/firefox"].find(existsSync) ?? "/usr/lib/firefox")
);
const exe = join(ffDir, win ? "firefox.exe" : "firefox");
const profilesRoot = win ? join(process.env.APPDATA, "Mozilla", "Firefox")
  : mac ? join(homedir(), "Library", "Application Support", "Firefox")
  : join(homedir(), ".mozilla", "firefox");

function findProfile(name) {
  const ini = join(profilesRoot, "profiles.ini");
  if (!existsSync(ini)) return null;
  for (const section of readFileSync(ini, "utf8").split(/^\[/m)) {
    const kv = Object.fromEntries(
      section.split(/\r?\n/).map((l) => l.match(/^(\w+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()])
    );
    if (kv.Name === name && kv.Path) return kv.IsRelative === "1" ? join(profilesRoot, ...kv.Path.split("/")) : kv.Path;
  }
  return null;
}

function stopFirefoxOn(name) {
  if (!win) return; // elsewhere: close it yourself
  try {
    execFileSync("powershell", ["-NoProfile", "-Command",
      `Get-CimInstance Win32_Process -Filter "Name='firefox.exe'" | Where-Object { $_.CommandLine -match '-P ${name}( |$)' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`]);
  } catch {}
}

// The loader stub (firefox/ in this repo) lets the profile's chrome/js run.
// It goes into the Firefox folder, so it needs admin rights; it never changes.
const ffRoot = mac ? join(ffDir, "..", "Resources") : ffDir;
const loaderFiles = [
  [join(root, "firefox", "config.js"), join(ffRoot, "config.js")],
  [join(root, "firefox", "defaults", "pref", "config-prefs.js"), join(ffRoot, "defaults", "pref", "config-prefs.js")],
];
const loaderCurrent = loaderFiles.every(([src, dst]) => existsSync(dst) && readFileSync(dst, "utf8") === readFileSync(src, "utf8"));
if (opts.installLoader) {
  try {
    const cfg = join(ffRoot, "config.js");
    if (existsSync(cfg) && !existsSync(cfg + ".bak")) writeFileSync(cfg + ".bak", readFileSync(cfg));
    for (const [src, dst] of loaderFiles) writeFileSync(dst, readFileSync(src));
    console.log(`loader stub installed in ${ffRoot}`);
  } catch (e) {
    if (e.code !== "EPERM" && e.code !== "EACCES") throw e;
    console.error(`No write access to ${ffRoot}: run this from an administrator terminal (sudo elsewhere).`);
    process.exit(1);
  }
  process.exit(0);
} else if (!loaderCurrent) {
  console.warn("Note: the loader stub in the Firefox folder is missing or outdated, so chrome/js (vim keys) won't run.");
  console.warn("      Run once from an administrator terminal:  node scripts/install.mjs --install-loader");
}

let profileDir = findProfile(opts.profile);
if (!profileDir) {
  execFileSync(exe, ["-CreateProfile", opts.profile]);
  profileDir = findProfile(opts.profile);
  console.log(`created profile "${opts.profile}"`);
}
if (opts.launch) stopFirefoxOn(opts.profile);

mkdirSync(profileDir, { recursive: true });
cpSync(join(root, "profile", "user.js"), join(profileDir, "user.js"));
rmSync(join(profileDir, "chrome"), { recursive: true, force: true });
cpSync(join(root, "profile", "chrome"), join(profileDir, "chrome"), { recursive: true });
// Firefox caches compiled chrome scripts per profile; drop the cache so the
// next start runs the new files (it lives in the local, non-roaming folder on
// Windows/macOS).
const rel = profileDir.startsWith(profilesRoot) ? profileDir.slice(profilesRoot.length) : null;
const localDir = rel && win ? join(process.env.LOCALAPPDATA, "Mozilla", "Firefox", rel)
  : rel && mac ? join(homedir(), "Library", "Caches", "Firefox", rel)
  : profileDir;
rmSync(join(localDir, "startupCache"), { recursive: true, force: true });
console.log(`installed into ${profileDir}`);

if (opts.launch) {
  const env = { ...process.env };
  if (opts.marionette) env.MOZ_REMOTE_ALLOW_SYSTEM_ACCESS = "1";
  const args = ["-P", opts.profile, "-no-remote", ...(opts.marionette ? ["-marionette"] : [])];
  spawn(exe, args, { env, detached: true, stdio: "ignore" }).unref();
  console.log(`launched Firefox on "${opts.profile}"`);
}
