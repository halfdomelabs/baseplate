#!/bin/bash

# Source environment variables from ../.env if it exists
if [ -f ".env" ]; then
    echo "Sourcing environment variables from .env"
    source ".env"
else
    echo "No .env file found, using default values"
fi

# Create mounts directory if it doesn't exist
MOUNTS_DIR="${PWD}/.devcontainer/mounts"
if [ ! -d "$MOUNTS_DIR" ]; then
    echo "Creating mounts directory: $MOUNTS_DIR"
    mkdir -p "$MOUNTS_DIR"
else
    echo "Mounts directory already exists: $MOUNTS_DIR"
fi

# Handle BASEPLATE_DEV_EXTENSION_PATH
if [ -n "$BASEPLATE_DEV_EXTENSION_PATH" ] && [ -f "$BASEPLATE_DEV_EXTENSION_PATH" ]; then
    echo "Linking extension from: $BASEPLATE_DEV_EXTENSION_PATH"
    if [ -e "$MOUNTS_DIR/extension.vsix" ] || [ -L "$MOUNTS_DIR/extension.vsix" ]; then
        rm -rf "$MOUNTS_DIR/extension.vsix"
    fi
    ln -s "$BASEPLATE_DEV_EXTENSION_PATH" "$MOUNTS_DIR/extension.vsix"
    echo "Extension linked to: $MOUNTS_DIR/extension.vsix"
else
    echo "BASEPLATE_DEV_EXTENSION_PATH not set or file doesn't exist, creating empty extension.vsix"
    touch "$MOUNTS_DIR/extension.vsix"
fi

# Handle BASEPLATE_DEV_DOCS_PATH
if [ -n "$BASEPLATE_DEV_DOCS_PATH" ] && [ -d "$BASEPLATE_DEV_DOCS_PATH" ]; then
    echo "Linking docs from: $BASEPLATE_DEV_DOCS_PATH"
    if [ -e "$MOUNTS_DIR/docs" ] || [ -L "$MOUNTS_DIR/docs" ]; then
        rm -rf "$MOUNTS_DIR/docs"
    fi
    ln -s "$BASEPLATE_DEV_DOCS_PATH/docs" "$MOUNTS_DIR/docs"
    echo "Docs linked to: $MOUNTS_DIR/docs"
else
    echo "BASEPLATE_DEV_DOCS_PATH not set or directory doesn't exist, creating empty docs directory"
    mkdir -p "$MOUNTS_DIR/docs"
fi

echo "Mount setup completed successfully"
