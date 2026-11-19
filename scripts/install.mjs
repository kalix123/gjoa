// Copy profile/ (user.js + chrome/) into a Firefox profile. Plain Node.
//
//   node scripts/install.mjs                 install into the "rewrite" profile (created if missing)
//   node scripts/install.mjs --launch        …and start Firefox on it
//   node scripts/install.mjs --launch --marionette   …with Marionette on, for scripts/dev-eval.mjs
//
// Options: --profile <name>, --firefox <install dir>.
// Firefox must be closed on that profile for user.js changes to apply
// (--launch restarts it).

import { execFileSync, spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const opts = { profile: "rewrite", launch: false, marionette: false };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--profile") opts.profile = argv[++i];
  else if (a === "--firefox") opts.firefox = argv[++i];
  else if (a === "--launch") opts.launch = true;
  else if (a === "--marionette") opts.marionette = true;
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
console.log(`installed into ${profileDir}`);

if (opts.launch) {
  const env = { ...process.env };
  if (opts.marionette) env.MOZ_REMOTE_ALLOW_SYSTEM_ACCESS = "1";
  const args = ["-P", opts.profile, "-no-remote", ...(opts.marionette ? ["-marionette"] : [])];
  spawn(exe, args, { env, detached: true, stdio: "ignore" }).unref();
  console.log(`launched Firefox on "${opts.profile}"`);
}
