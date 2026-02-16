#!/bin/sh

# 1. Grab the version, strip quotes
PRISMA_VERSION=$(npm pkg get devDependencies.prisma | tr -d '"')

# 2. Capture the project root (where this script is running from)
PROJECT_ROOT=$(pwd)

# 3. Define absolute paths relative to the project root
#    We use "$PROJECT_ROOT" so these become /app/apps/backend/...
#    Adjust the relative part 'apps/backend/...' to match your actual structure
SCHEMA_PATH="$PROJECT_ROOT/prisma/schema.prisma"
CONFIG_PATH="$PROJECT_ROOT/prisma.config.ts"

echo "Deploying with Prisma version: $PRISMA_VERSION"
echo "Using Schema: $SCHEMA_PATH"
echo "Using Config: $CONFIG_PATH"

# 4. Move to /tmp to trick npx into ignoring the local package.json
cd /tmp

# 5. Run the command using the captured absolute paths
npx -y prisma@$PRISMA_VERSION migrate deploy \
  --schema="$SCHEMA_PATH" \
  --config="$CONFIG_PATH"