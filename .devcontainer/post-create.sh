#!/bin/sh

set -e

# Fix permissions on pnpm store and remove sudo permissions
sudo chown vscode:vscode node_modules
sudo chown vscode:vscode /home/vscode/.local/share/pnpm
sudo chown vscode:vscode /home/vscode/.claude
sudo init-firewall.sh
sudo rm /etc/sudoers.d/vscode

# Trust mise and install dependencies
mise trust
pnpm install
