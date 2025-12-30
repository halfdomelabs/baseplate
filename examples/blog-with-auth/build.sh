#!/bin/bash

# Check if package name argument is provided
if [ -z "$1" ]; then
    echo "Error: Package name argument is required"
    echo "Usage: ./build.sh <package-name>"
    exit 1
fi

PACKAGE_NAME=$1
ROOT_PACKAGE_NAME=blog-with-auth-root

# Install dependencies for the specified package and root workspace
echo "Installing dependencies for $PACKAGE_NAME..."
pnpm install --filter "$PACKAGE_NAME"... --filter "$ROOT_PACKAGE_NAME"

# Run build command for the package using turbo
echo "Building $PACKAGE_NAME..."
pnpm turbo run build --filter="$PACKAGE_NAME"
