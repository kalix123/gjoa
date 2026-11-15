import { readFileSync } from 'fs';
import { join } from 'path';
import { REPO_ROOT } from './paths.js';
import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

const cached = ({value: null, watches: {}});

export function load_config_bang() {
  if (((_truthy) => _truthy !== false && _truthy != null)(cached.value)) {
    return cached.value;
  } else {
    const path = join(REPO_ROOT, "gjoa.json");
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw);
    validate(parsed);
    (() => { const _a = cached, _v = parsed; const _old = _a.value; _a.value = _v; for (const _k in _a.watches) _a.watches[_k](_k, _a, _old, _v); return _v; })();
    return parsed;
  }
}

function validate(c) {
  const required = ["name", "binaryName", "appId", "vendor", "displayVersion", "license", "github", "firefox", "branding", "urls"];
  required.forEach((k) => {
  if (($$bc$equiv($$bc$get(c, k), undefined))) {
    (() => { throw new Error(("".concat("gjoa.json missing required field: ", k))); })();
  }
});
  if ((!((_truthy) => _truthy !== false && _truthy != null)(c.firefox.version))) {
    (() => { throw new Error("gjoa.json: firefox.version is required"); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(c.firefox.version.match(new RegExp("^[0-9]+(\\.[0-9]+){1,3}(esr)?$"))))) {
    (() => { throw new Error(("".concat("gjoa.json: firefox.version \"", c.firefox.version, "\" is not a valid Firefox version"))); })();
  }
  if ((!((_truthy) => _truthy !== false && _truthy != null)(c.binaryName.match(new RegExp("^[a-z0-9-]+$"))))) {
    return (() => { throw new Error(("".concat("gjoa.json: binaryName \"", c.binaryName, "\" must be lowercase alphanumeric+hyphen"))); })();
  }
}
