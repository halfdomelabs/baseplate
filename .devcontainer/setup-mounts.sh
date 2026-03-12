#!/usr/bin/env bash

# Create mounts directory if it doesn't exist
MOUNTS_DIR="${PWD}/.devcontainer/mounts"
if [ ! -d "$MOUNTS_DIR" ]; then
    echo "Creating mounts directory: $MOUNTS_DIR"
    mkdir -p "$MOUNTS_DIR"
else
    echo "Mounts directory already exists: $MOUNTS_DIR"
fi

# Ensure secrets file exists (prevents bind mount failure if missing)
# User should create ~/.devcontainers/<basename>.env with GH_TOKEN=ghp_xxx
SECRETS_DIR="$HOME/.devcontainers"
BASENAME=$(basename "$PWD")
SECRETS_FILE="$SECRETS_DIR/${BASENAME}.env"

mkdir -p "$SECRETS_DIR"
if [ ! -f "$SECRETS_FILE" ]; then
    touch "$SECRETS_FILE"
    echo "Created empty secrets file: $SECRETS_FILE"
    echo "Add GH_TOKEN=ghp_xxx to enable GitHub auth"
fi
chmod 600 "$SECRETS_FILE"

echo "Mount setup completed successfully"
