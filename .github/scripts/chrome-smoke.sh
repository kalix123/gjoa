#!/usr/bin/env bash
# Launch the built browser headless with a fresh profile and assert that every
# gjoa chrome bundle initialised and no chrome script threw.
#   bash .github/scripts/chrome-smoke.sh <path-to-gjoa-binary>
set -uo pipefail
bin=$1
profile=$(mktemp -d)
cat > "$profile/user.js" <<'EOF'
user_pref("devtools.console.stdout.chrome", true);
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.aboutwelcome.enabled", false);
EOF
log=$(mktemp)
markers=("gjoa-drawer: initialized" "gjoa-tabs: initialized" "gjoa-darkmode: initialized"
         "gjoa-blocking: initialized" "gjoa-theme: initialized")
GJOA_ALLOW_INSECURE=1 MOZ_HEADLESS=1 "$bin" --headless --no-remote --profile "$profile" about:blank >"$log" 2>&1 &
pid=$!
for _ in $(seq 1 90); do
  ok=1
  for m in "${markers[@]}"; do grep -qF "$m" "$log" || ok=0; done
  [ "$ok" = 1 ] && break
  sleep 1
done
kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null
fail=0
for m in "${markers[@]}"; do
  if grep -qF "$m" "$log"; then echo "ok: $m"; else echo "::error::missing: $m"; fail=1; fi
done
if grep -E "(SyntaxError|ReferenceError|TypeError).*(uc\.js|GjoaLoader)" "$log"; then
  echo "::error::chrome script error (see above)"; fail=1
fi
[ "$fail" = 0 ] || { echo "----- browser output (tail) -----"; tail -n 80 "$log"; }
exit "$fail"
