#!/bin/sh

# Grab the version, strip quotes
PRISMA_VERSION=$(npm pkg get devDependencies.prisma | tr -d '"')

# Run the command
echo "Deploying with Prisma version: $PRISMA_VERSION"
npx -y prisma@$PRISMA_VERSION migrate deploy
