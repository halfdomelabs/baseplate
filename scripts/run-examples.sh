#!/usr/bin/env bash
set -euo pipefail

if [ $# -eq 0 ]; then
  echo "Usage: pnpm run:examples -- <command...>"
  echo "Example: pnpm run:examples -- pnpm install"
  exit 1
fi

# Skip the -- separator if present
if [ "$1" = "--" ]; then
  shift
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIRS=()

for dir in "$ROOT_DIR"/examples/*/package.json; do
  [ -f "$dir" ] && DIRS+=("$(dirname "$dir")")
done

# Collect npm_/pnpm_ env vars injected by the pnpm script runner
# so they don't leak into example project commands
UNSET_ARGS=()
while IFS='=' read -r key _; do
  case "$key" in
    npm_*|pnpm_*) UNSET_ARGS+=("-u" "$key") ;;
  esac
done < <(env)

for dir in "${DIRS[@]}"; do
  name="${dir#"$ROOT_DIR"/}"
  echo ">>> Running in $name: $*"
  (cd "$dir" && env "${UNSET_ARGS[@]}" "$@")
done
