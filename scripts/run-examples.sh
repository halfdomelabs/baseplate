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

for dir in "${DIRS[@]}"; do
  name="${dir#"$ROOT_DIR"/}"
  echo ">>> Running in $name: $*"
  (cd "$dir" && "$@")
done
