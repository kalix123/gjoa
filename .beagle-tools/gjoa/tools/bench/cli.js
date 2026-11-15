import { equivV as $$bc$equiv } from 'beagle/core.js';

const subcommand = Bun.argv[2];

function usage() {
  return console.log(("".concat("\nUsage: bun tools/bench/cli.ts <command> [options]\n\nCommands:\n  cold-start    Measure time-to-window-visible\n  memory        Measure memory usage with N tabs\n  all           Run all benchmarks\n  env-check     Check if environment is ready for benchmarking\n\nOptions are passed through to subcommands. See individual scripts for details.\n\nCommon options:\n  --gjoa-bin=<path>       Path to gjoa binary\n  --firefox-bin=<path>    Path to firefox binary\n  --runs=N                Number of runs (cold-start, default 20)\n  --tabs=N                Number of tabs (memory, default 50)\n\nPrepare environment first:\n  sudo bash tools/bench/env.sh           # disable turbo, set governor, etc.\n  sudo bash tools/bench/env.sh --restore # undo after benchmarking\n")));
}

function check_environment() {
  const warnings = [];
  const push = (w) => warnings.push(w);
  const intel_turbo = Bun.spawnSync(["cat", "/sys/devices/system/cpu/intel_pstate/no_turbo"]);
  const amd_boost = Bun.spawnSync(["cat", "/sys/devices/system/cpu/cpufreq/boost"]);
  if (($$bc$equiv(intel_turbo.exitCode, 0))) {
    if (($$bc$equiv(intel_turbo.stdout.toString().trim(), "0"))) {
      push("Intel turbo boost is ON — results will have high variance. Run: sudo bash tools/bench/env.sh");
    }
  } else if (($$bc$equiv(amd_boost.exitCode, 0))) {
    if (($$bc$equiv(amd_boost.stdout.toString().trim(), "1"))) {
      push("AMD boost is ON — results will have high variance. Run: sudo bash tools/bench/env.sh");
    }
  } else {
    null;
  }
  const governor = Bun.spawnSync(["cat", "/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor"]);
  if (($$bc$equiv(governor.exitCode, 0))) {
    const gov = governor.stdout.toString().trim();
    if ((!($$bc$equiv(gov, "performance")))) {
      push(("".concat("CPU governor is '", gov, "' (want 'performance'). Run: sudo bash tools/bench/env.sh")));
    }
  }
  const aslr = Bun.spawnSync(["cat", "/proc/sys/kernel/randomize_va_space"]);
  if (($$bc$equiv(aslr.exitCode, 0))) {
    const val = aslr.stdout.toString().trim();
    if ((!($$bc$equiv(val, "0")))) {
      push(("".concat("ASLR is enabled (", val, "). Run: sudo bash tools/bench/env.sh")));
    }
  }
  const xdotool = Bun.spawnSync(["which", "xdotool"]);
  if ((!($$bc$equiv(xdotool.exitCode, 0)))) {
    push("xdotool not found — required for window detection. Install it.");
  }
  return {warnings: warnings};
}

function print_environment_status() {
  const warnings = check_environment().warnings;
  if (($$bc$equiv(warnings.length, 0))) {
    console.log("  Environment: OK (turbo off, performance governor, ASLR off)");
  } else {
    console.log("  Environment warnings:");
    warnings.forEach((w) => {
  console.log(("".concat("    WARN: ", w)));
});
  }
  return console.log("");
}

function find_binary(name) {
  if (($$bc$equiv(name, "gjoa"))) {
    const local = ("".concat(process.cwd(), "/result/bin/gjoa"));
    const stat = (() => { try {
    return Bun.file(local);
  } catch (e) {
    return null;
  } })();
    if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (stat.size > 0) : _logical))(stat))) {
      return local;
    } else {
      const result = Bun.spawnSync(["which", name]);
      const path = result.stdout.toString().trim();
      return (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(result.exitCode, 0)) && path)) ? path : null);
    }
  } else {
    const result = Bun.spawnSync(["which", name]);
    const path = result.stdout.toString().trim();
    return (((_truthy) => _truthy !== false && _truthy != null)((($$bc$equiv(result.exitCode, 0)) && path)) ? path : null);
  }
}

async function run_subcommand(script) {
  const args = Bun.argv.slice(3);
  const cmd = ["bun", ("".concat(process.cwd(), "/.beagle-tools/gjoa/tools/bench/", script))].concat(args);
  const proc = Bun.spawn(cmd, {stdout: "inherit", stderr: "inherit", stdin: "inherit"});
  const code = await proc.exited;
  if ((!($$bc$equiv(code, 0)))) {
    return process.exit(code);
  }
}

if (((_truthy) => _truthy !== false && _truthy != null)(((!((_truthy) => _truthy !== false && _truthy != null)(subcommand)) || (($$bc$equiv(subcommand, "--help")) || ($$bc$equiv(subcommand, "-h")))))) {
  usage();
  process.exit(0);
} else {
  console.log("\n=== Gjoa Benchmark Suite ===\n");
  const gjoa_bin = find_binary("gjoa");
  const firefox_bin = find_binary("firefox");
  console.log(("".concat("  Gjoa binary:    ", ((_logical) => (_logical !== false && _logical != null ? _logical : "NOT FOUND"))(gjoa_bin))));
  console.log(("".concat("  Firefox binary: ", ((_logical) => (_logical !== false && _logical != null ? _logical : "NOT FOUND"))(firefox_bin))));
  console.log("");
  print_environment_status();
  await (async () => { const _match_0 = subcommand; if (_match_0 === "cold-start") { return await run_subcommand("cold-start.js"); } else if (_match_0 === "memory") { return await run_subcommand("memory.js"); } else if (_match_0 === "all") { return (async () => { await run_subcommand("cold-start.js");
return await run_subcommand("memory.js"); })(); } else if (_match_0 === "env-check") { return null; } else { return (() => { console.error(("".concat("Unknown command: ", subcommand)));
usage();
return process.exit(1); })(); } })();
}
