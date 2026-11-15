import { execSync } from 'child_process';

export function sh(cmd, opts) {
  const o = ((_logical) => (_logical !== false && _logical != null ? _logical : {}))(opts);
  const cfg = {encoding: "utf8", maxBuffer: ((_logical) => (_logical !== false && _logical != null ? _logical : (256 * 1024 * 1024)))(o.maxBuffer)};
  const cfg2 = (((_truthy) => _truthy !== false && _truthy != null)(o.cwd) ? Object.assign({}, cfg, {cwd: o.cwd}) : cfg);
  return (((_truthy) => _truthy !== false && _truthy != null)(o.quiet) ? (() => { try {
    return execSync(cmd, Object.assign({}, cfg2, {stdio: ["ignore", "pipe", "ignore"]})).toString();
  } catch (__e) {
    return "";
  } })() : execSync(cmd, cfg2).toString());
}
