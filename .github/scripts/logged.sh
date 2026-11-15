#!/usr/bin/env bash
# Run a command; on failure, publish the tail of its output as a GitHub
# annotation. Annotations are readable without auth (unlike raw job logs), so
# failures can be diagnosed from the public API.
#   bash .github/scripts/logged.sh "<title>" cmd args...
set -uo pipefail
title=$1; shift
log=$(mktemp)
"$@" 2>&1 | tee "$log"
rc=${PIPESTATUS[0]}
if [ "$rc" -ne 0 ]; then
  # First compiler/tool errors (mach output is huge), then the tail.
  msg=$( { grep -E -m 40 "(^|[^a-z])(error|Error|ERROR)(\[|:| )" "$log"; echo "----- tail -----"; tail -n 60 "$log"; } | sed 's/\x1b\[[0-9;]*[A-Za-z]//g' | cut -c1-300 \
        | sed -e 's/%/%25/g' | awk 'BEGIN{ORS="%0A"} {gsub(/\r/,""); print}')
  echo "::error title=${title} (exit ${rc})::${msg}"
fi
exit "$rc"
