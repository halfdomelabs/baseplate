#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: pnpm run:example <example-name> -- <command...>"
  echo "Example: pnpm run:example todo-with-better-auth -- pnpm install"
  echo ""
  echo "Available examples:"
  for dir in "$(cd "$(dirname "$0")/.." && pwd)"/examples/*/package.json; do
    [ -f "$dir" ] && echo "  - $(basename "$(dirname "$dir")")"
  done
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXAMPLE_NAME="$1"
shift

# Skip the -- separator if present
if [ "${1:-}" = "--" ]; then
  shift
fi

EXAMPLE_DIR="$ROOT_DIR/examples/$EXAMPLE_NAME"

if [ ! -d "$EXAMPLE_DIR" ]; then
  echo "Error: Example '$EXAMPLE_NAME' not found at $EXAMPLE_DIR"
  echo ""
  echo "Available examples:"
  for dir in "$ROOT_DIR"/examples/*/package.json; do
    [ -f "$dir" ] && echo "  - $(basename "$(dirname "$dir")")"
  done
  exit 1
fi

# Collect npm_/pnpm_ env vars injected by the pnpm script runner
# so they don't leak into example project commands
UNSET_ARGS=()
while IFS='=' read -r key _; do
  case "$key" in
    npm_*|pnpm_*) UNSET_ARGS+=("-u" "$key") ;;
  esac
done < <(env)

echo ">>> Running in examples/$EXAMPLE_NAME: $*"
(cd "$EXAMPLE_DIR" && env "${UNSET_ARGS[@]}" "$@")
