# gjoa security policy

## Update cadence

| Trigger | Target |
|---|---|
| Mozilla ships a patch release (e.g. X.Y.1 → X.Y.2) | 7 days |
| Mozilla ships a major release with MFSAs | 48 hours |
| Any in-the-wild CVE against our pin | same day |
| Zero-day disclosed | immediately |

Updating Firefox is described in [BUILDING.md](BUILDING.md#updating-firefox).

## In-browser out-of-date check

`src/gjoa/chrome/security/index.mjs` runs when a browser window loads and
again every 60 minutes. It compares the build's Firefox version with Mozilla's
product-details feed:

- one or more **major** versions behind: a console error and one dialog per
  session pointing at the releases page; the browser keeps running;
- a **point** release behind: a console warning;
- offline or a malformed response: fail open (logged).

`GJOA_ALLOW_INSECURE=1` disables the check for that process.

Sources of truth:

- Mozilla product-details: https://product-details.mozilla.org/1.0/firefox_versions.json
- Mozilla known-vulnerabilities index: https://www.mozilla.org/security/known-vulnerabilities/firefox/

## Security-critical patches

Every patch in `patches/` must apply: `scripts/prepare.mjs` stops at the first
patch that fails, so a mitigation carried as a patch can never silently drop
out of a build after a Firefox update. A patch that exists *as* a security fix
should say so in its header, for example:

```
# security:
#   refs:
#     - CVE-2025-XXXX
#   mitigates: <one line: what it blocks>
```

No current patch carries such a block.
