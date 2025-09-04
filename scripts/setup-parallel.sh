#!/bin/bash

# Script to set up parallel development environments with different port offsets
# Usage: ./setup-parallel.sh [offset]

PORT_OFFSET=${1:-0}

echo "Setting up parallel environment with PORT_OFFSET=$PORT_OFFSET"
echo ""
echo "This will configure the following ports:"
echo "  - Web: $((4300 + PORT_OFFSET))"
echo "  - Server: $((4400 + PORT_OFFSET))"  
echo "  - Dev Server: $((4500 + PORT_OFFSET))"
echo ""

# Determine the repository root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Create .env file with the specified offset
cat > "$REPO_ROOT/.env" << EOF
# Auto-generated for parallel development environment
PORT_OFFSET=$PORT_OFFSET
EOF

echo "Created $REPO_ROOT/.env file with PORT_OFFSET=$PORT_OFFSET"
echo ""
echo "To start the services with this offset: pnpm dev:serve"
echo ""
echo "For additional parallel instances, run this script with different offsets:"
echo "  ./setup-parallel.sh 1  # Ports: 4301, 4401, 4501"
echo "  ./setup-parallel.sh 2  # Ports: 4302, 4402, 4502"