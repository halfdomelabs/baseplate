#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: pnpm run:example <example-name> -- <command...>"
  echo "Example: pnpm run:example todo-with-auth0 -- pnpm install"
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

echo ">>> Running in examples/$EXAMPLE_NAME: $*"
(cd "$EXAMPLE_DIR" && "$@")
