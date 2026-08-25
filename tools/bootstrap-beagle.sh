#!/bin/sh
# Provision the exact Beagle object configured by Gjoa, then compile all tools
# beneath that verified compiler/runtime environment.
set -eu

die() {
  echo "gjoa bootstrap: $*" >&2
  exit 1
}

command -v git >/dev/null 2>&1 || die "git is required to provision Beagle"
command -v bun >/dev/null 2>&1 || die "bun is required to compile Gjoa tooling"
[ -n "${HOME:-}" ] || die "HOME is required to provision Beagle"

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd -P)
ref_file=$repo_root/configs/beagle.ref
upstream=https://github.com/tompassarelli/beagle.git
[ -f "$ref_file" ] || die "missing configs/beagle.ref"

if ! beagle_ref=$(awk '
  /^[[:space:]]*#/ || /^[[:space:]]*$/ { next }
  {
    line = $0
    sub(/^[[:space:]]*/, "", line)
    sub(/[[:space:]]*$/, "", line)
    count++
    if (length(line) != 40 || line !~ /^[0-9a-f]+$/) bad = 1
    value = line
  }
  END {
    if (count != 1 || bad) exit 1
    print value
  }
' "$ref_file"); then
  die "configs/beagle.ref must contain exactly one lowercase 40-hex object"
fi

home_root=$(CDPATH= cd -- "$HOME" && pwd -P) || die "HOME is not readable"
canonical_container=$home_root/code/beagle
canonical_main=$canonical_container/main
canonical_pins=$canonical_container/pins
canonical_pin=$canonical_pins/$beagle_ref
canonical_sidecar=$canonical_pin.pin

checkout_common_dir() {
  checkout_common_raw=$(git -C "$1" rev-parse --git-common-dir 2>/dev/null) || return 1
  case $checkout_common_raw in
    /*) checkout_common_path=$checkout_common_raw ;;
    *) checkout_common_path=$1/$checkout_common_raw ;;
  esac
  (CDPATH= cd -- "$checkout_common_path" 2>/dev/null && pwd -P)
}

validate_compiler_checkout() {
  checkout=$1
  [ -d "$checkout" ] || die "Beagle checkout is missing: $checkout"
  actual=$(git -C "$checkout" rev-parse 'HEAD^{commit}' 2>/dev/null) ||
    die "Beagle checkout has no readable HEAD: $checkout"
  [ "$actual" = "$beagle_ref" ] ||
    die "Beagle checkout mismatch at $checkout (expected $beagle_ref, found $actual)"
  if git -C "$checkout" symbolic-ref -q HEAD >/dev/null 2>&1; then
    die "Beagle checkout must be detached: $checkout"
  fi
  checkout_status=$(git -C "$checkout" status --porcelain=v1 --untracked-files=all 2>/dev/null) ||
    die "cannot read Beagle checkout status: $checkout"
  [ -z "$checkout_status" ] || die "Beagle checkout must be clean: $checkout"
  [ -f "$checkout/bin/beagle-build" ] ||
    die "pinned Beagle checkout has no bin/beagle-build: $checkout"
  [ -d "$checkout/beagle-lib/lib/beagle" ] ||
    die "pinned Beagle checkout has no runtime collection: $checkout"
}

validate_main_checkout() {
  main_checkout=$1
  [ -d "$main_checkout" ] || die "canonical Beagle main is missing: $main_checkout"
  main_top=$(git -C "$main_checkout" rev-parse --show-toplevel 2>/dev/null) ||
    die "canonical Beagle main is not a Git checkout: $main_checkout"
  main_top=$(CDPATH= cd -- "$main_top" 2>/dev/null && pwd -P) ||
    die "canonical Beagle main is unreadable: $main_checkout"
  expected_main=$(CDPATH= cd -- "$main_checkout" 2>/dev/null && pwd -P) ||
    die "canonical Beagle main is unreadable: $main_checkout"
  [ "$main_top" = "$expected_main" ] ||
    die "canonical Beagle main resolves to an unexpected worktree: $main_top"
  main_status=$(git -C "$main_checkout" status --porcelain=v1 --untracked-files=all 2>/dev/null) ||
    die "cannot read canonical Beagle main status: $main_checkout"
  [ -z "$main_status" ] || die "canonical Beagle main must be clean before provisioning"
}

validate_canonical_pin() {
  validate_compiler_checkout "$canonical_pin"
  pin_common=$(checkout_common_dir "$canonical_pin") ||
    die "cannot resolve canonical pin registration: $canonical_pin"
  main_common=$(checkout_common_dir "$canonical_main") ||
    die "cannot resolve canonical main registration: $canonical_main"
  [ "$pin_common" = "$main_common" ] ||
    die "canonical Beagle pin is not a worktree of $canonical_main"
}

validate_sidecar() {
  [ -f "$canonical_sidecar" ] || die "canonical Beagle pin sidecar is missing"
  [ ! -L "$canonical_sidecar" ] || die "canonical Beagle pin sidecar must not be a symlink"
  awk -v expected="$beagle_ref" '
    BEGIN { objects = 0; consumers = 0; purposes = 0; bad = 0 }
    /^object: / {
      objects++
      if ($0 != "object: " expected) bad = 1
      next
    }
    /^consumer-main: / {
      consumers++
      if (length($0) == length("consumer-main: ")) bad = 1
      next
    }
    /^purpose: / {
      purposes++
      if (length($0) == length("purpose: ")) bad = 1
      next
    }
    { bad = 1 }
    END {
      if (objects != 1 || consumers < 1 || purposes != 1 || bad) exit 1
    }
  ' "$canonical_sidecar" || die "canonical Beagle pin sidecar is malformed"
}

gjoa_common=$(checkout_common_dir "$repo_root") ||
  die "cannot resolve Gjoa's primary checkout"
[ "$(basename -- "$gjoa_common")" = .git ] ||
  die "Gjoa common Git directory has an unexpected shape: $gjoa_common"
consumer_main=$(dirname -- "$gjoa_common")
consumer_project_dir=$(dirname -- "$consumer_main")
consumer_code_dir=$(dirname -- "$consumer_project_dir")
if [ "$(basename -- "$consumer_main")" = main ] &&
   [ "$(basename -- "$consumer_code_dir")" = code ]; then
  consumer_record="~/code/$(basename -- "$consumer_project_dir")/main"
else
  consumer_record=$consumer_main
fi

lock_dir=$canonical_container/.gjoa-bootstrap.lock
scratch_main=
scratch_pin=
scratch_sidecar=
lock_held=0

cleanup() {
  cleanup_status=$?
  trap - 0 1 2 15
  cleanup_failed=0

  if [ "$cleanup_status" -ne 0 ]; then
    if [ -n "$scratch_main" ]; then
      echo "gjoa bootstrap: preserving Beagle scratch main path after failure: $scratch_main" >&2
    fi
    if [ -n "$scratch_pin" ]; then
      echo "gjoa bootstrap: preserving Beagle scratch pin path after failure: $scratch_pin" >&2
    fi
    if [ -n "$scratch_sidecar" ]; then
      echo "gjoa bootstrap: preserving Beagle scratch sidecar after failure: $scratch_sidecar" >&2
    fi
  fi
  if [ "$lock_held" -eq 1 ]; then
    rmdir "$lock_dir" >/dev/null 2>&1 || cleanup_failed=1
  fi

  if [ "$cleanup_failed" -ne 0 ]; then
    echo "gjoa bootstrap: could not release provisioning lock: $lock_dir" >&2
    [ "$cleanup_status" -ne 0 ] || cleanup_status=1
  fi
  exit "$cleanup_status"
}
trap cleanup 0
trap 'exit 129' 1
trap 'exit 130' 2
trap 'exit 143' 15

acquire_lock() {
  mkdir -p "$canonical_container" || die "cannot create canonical Beagle container"
  lock_attempt=0
  while ! mkdir "$lock_dir" 2>/dev/null; do
    lock_attempt=$((lock_attempt + 1))
    [ "$lock_attempt" -lt 30 ] ||
      die "timed out waiting for canonical Beagle provisioning lock: $lock_dir"
    sleep 1
  done
  lock_held=1
}

ensure_consumer_sidecar() {
  mkdir -p "$canonical_pins" || die "cannot create canonical Beagle pins directory"
  if [ ! -e "$canonical_sidecar" ]; then
    scratch_sidecar=$(mktemp "$canonical_pins/.gjoa-bootstrap-sidecar.XXXXXX") ||
      die "cannot allocate Beagle sidecar scratch file"
    {
      echo "object: $beagle_ref"
      echo "consumer-main: $consumer_record"
      echo "purpose: Exact Beagle compiler revision consumed by Gjoa."
    } >"$scratch_sidecar"
    mv "$scratch_sidecar" "$canonical_sidecar"
    scratch_sidecar=
    return
  fi

  validate_sidecar
  if grep -Fqx "consumer-main: $consumer_record" "$canonical_sidecar"; then
    return
  fi

  scratch_sidecar=$(mktemp "$canonical_pins/.gjoa-bootstrap-sidecar.XXXXXX") ||
    die "cannot allocate Beagle sidecar scratch file"
  awk -v consumer="consumer-main: $consumer_record" '
    /^purpose: / && !added { print consumer; added = 1 }
    { print }
  ' "$canonical_sidecar" >"$scratch_sidecar"
  mv "$scratch_sidecar" "$canonical_sidecar"
  scratch_sidecar=
}

provision_canonical_pin() {
  acquire_lock

  if [ ! -e "$canonical_main" ]; then
    scratch_main=$(mktemp -d "$canonical_container/.gjoa-bootstrap-main.XXXXXX") ||
      die "cannot allocate canonical Beagle main scratch path"
    rmdir "$scratch_main" || die "cannot prepare canonical Beagle main scratch path"
    git clone --filter=blob:none "$upstream" "$scratch_main"
    validate_main_checkout "$scratch_main"
    [ ! -e "$canonical_main" ] || die "canonical Beagle main appeared during provisioning"
    mv "$scratch_main" "$canonical_main"
    scratch_main=
  fi
  validate_main_checkout "$canonical_main"

  mkdir -p "$canonical_pins" || die "cannot create canonical Beagle pins directory"
  if [ ! -e "$canonical_pin" ]; then
    git -C "$canonical_main" fetch --depth 1 "$upstream" "$beagle_ref"
    git -C "$canonical_main" cat-file -e "$beagle_ref^{commit}" ||
      die "configured Beagle object was not fetched: $beagle_ref"
    scratch_pin=$(mktemp -d "$canonical_pins/.gjoa-bootstrap-pin.XXXXXX") ||
      die "cannot allocate canonical Beagle pin scratch path"
    rmdir "$scratch_pin" || die "cannot prepare canonical Beagle pin scratch path"
    git -C "$canonical_main" worktree add --detach "$scratch_pin" "$beagle_ref"
    validate_compiler_checkout "$scratch_pin"
    scratch_pin_common=$(checkout_common_dir "$scratch_pin") ||
      die "cannot validate provisioned Beagle pin registration"
    main_common=$(checkout_common_dir "$canonical_main") ||
      die "cannot validate canonical Beagle main registration"
    [ "$scratch_pin_common" = "$main_common" ] ||
      die "provisioned Beagle pin has the wrong Git common directory"
    [ ! -e "$canonical_pin" ] || die "canonical Beagle pin appeared during provisioning"
    git -C "$canonical_main" worktree move "$scratch_pin" "$canonical_pin"
    scratch_pin=
  fi

  validate_canonical_pin
  ensure_consumer_sidecar
  validate_sidecar

  rmdir "$lock_dir"
  lock_held=0
}

if [ -n "${BEAGLE_PIN_ROOT:-}" ] && [ "$BEAGLE_PIN_ROOT" != "$canonical_pin" ]; then
  beagle_root=$BEAGLE_PIN_ROOT
  validate_compiler_checkout "$beagle_root"
else
  provision_canonical_pin
  beagle_root=$canonical_pin
fi

export BEAGLE_PIN_ROOT=$beagle_root

mkdir -p "$repo_root/node_modules"
if [ -e "$repo_root/node_modules/beagle" ] && [ ! -L "$repo_root/node_modules/beagle" ]; then
  die "node_modules/beagle exists and is not a symlink"
fi
ln -sfn "$beagle_root/beagle-lib/lib/beagle" "$repo_root/node_modules/beagle"

boot_out=$repo_root/.beagle-tools/.boot/build-tools.js
if [ ! -f "$boot_out" ] || [ "$ref_file" -nt "$boot_out" ] ||
   [ -n "$(find "$repo_root/tools" -name '*.bjs' -newer "$boot_out" -print -quit 2>/dev/null)" ]; then
  mkdir -p "$(dirname -- "$boot_out")"
  bash "$beagle_root/bin/beagle-build" "$repo_root/tools/build-tools.bjs" "$boot_out"
fi

cd "$repo_root"
bun "$boot_out"
