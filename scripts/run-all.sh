#!/usr/bin/env bash
set -euo pipefail

if [ $# -eq 0 ]; then
  echo "Usage: pnpm run:all <command...>"
  echo "Example: pnpm run:all pnpm install"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIRS=("$ROOT_DIR")

for dir in "$ROOT_DIR"/examples/*/package.json "$ROOT_DIR"/tests/*/package.json; do
  [ -f "$dir" ] && DIRS+=("$(dirname "$dir")")
done

for dir in "${DIRS[@]}"; do
  name="${dir#"$ROOT_DIR"/}"
  if [ "$dir" = "$ROOT_DIR" ]; then
    name="root"
  fi
  echo ">>> Running in $name: $*"
  (cd "$dir" && "$@")
done
