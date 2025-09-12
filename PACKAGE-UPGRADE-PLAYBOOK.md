# Package Upgrade Playbook for Baseplate

This playbook provides a systematic approach for upgrading packages in the Baseplate monorepo, ensuring consistency between the monorepo dependencies and generated project code.

## Overview

Baseplate has a dual-location package management system:

1. **Monorepo catalog** (`pnpm-workspace.yaml`) - Defines versions for the Baseplate development environment
2. **Generator constants** - Defines versions that get injected into generated projects

Both locations must be kept in sync to ensure generated projects use the intended package versions.

## Quick Reference Commands

```bash
# 1. Find package locations
grep -r "package-name" pnpm-workspace.yaml packages/*/src/constants/

# 2. Check latest versions
npm view package-name version

# 3. Update dependencies
pnpm install

# 4. Resolve conflicts
pnpm dedupe

# 5. Sync generated projects
pnpm start sync-examples

# 6. Verify everything works
pnpm typecheck
```

## Step-by-Step Process

### 1. Identify Package Locations

Before upgrading, identify where the package is defined:

```bash
# Search for package in catalog
grep "package-name" pnpm-workspace.yaml

# Search for package in generator constants
find packages/ -name "*.ts" -exec grep -l "package-name" {} \;

# Common generator constants locations:
# - packages/react-generators/src/constants/react-packages.ts (React ecosystem)
# - packages/fastify-generators/src/constants/fastify-packages.ts (Backend ecosystem)
# - packages/core-generators/src/constants/core-packages.ts (Core utilities)
```

### 2. Check Current and Latest Versions

```bash
# Check current version in catalog
grep "package-name" pnpm-workspace.yaml

# Check current version in generator constants
grep "package-name" packages/*/src/constants/*.ts

# Get latest version from npm
npm view package-name version

# Get all available versions (helpful for major version planning)
npm view package-name versions --json
```

### 3. Research Breaking Changes

Before upgrading, especially for major versions:

- Check the package's CHANGELOG.md or release notes
- Look for migration guides
- Check compatibility with other packages (peer dependencies)
- Test in a separate branch for major upgrades

### 4. Update Package Versions

#### 4.1 Update Monorepo Catalog

Edit `pnpm-workspace.yaml`:

```yaml
catalog:
  package-name: NEW_VERSION # Update this line
```

#### 4.2 Update Generator Constants

Find and update the appropriate constants file:

```typescript
// Example: packages/react-generators/src/constants/react-packages.ts
export const REACT_PACKAGES = {
  'package-name': 'NEW_VERSION', // Update this line
  // ... other packages
} as const;
```

**Common generator constants files:**

- `packages/react-generators/src/constants/react-packages.ts` - React, Vite, Tailwind, UI libraries
- `packages/fastify-generators/src/constants/fastify-packages.ts` - Fastify, server-side packages
- `packages/core-generators/src/constants/core-packages.ts` - Core Node.js utilities

### 5. Install and Resolve Dependencies

```bash
# Install new versions
pnpm install

# Resolve duplicate dependencies and conflicts
pnpm dedupe
```

**Note:** `pnpm dedupe` is crucial as it resolves version conflicts that can occur when upgrading packages with complex dependency trees.

### 6. Sync Generated Projects

Update all example projects to use the new package versions:

```bash
# Sync all example projects
pnpm start sync-examples
```

This command:

- Regenerates all projects in `examples/` directory
- Updates `package.json` files with new versions
- Ensures generated code reflects any API changes

### 7. Verification and Testing

```bash
# Run type checking across all packages
pnpm typecheck

# Run linting (with auto-fix)
pnpm lint:only:affected -- --fix

# Run tests if available
pnpm test:affected

# Build all packages to ensure compatibility
pnpm build
```

### 8. Create Changeset

After successfully upgrading packages, create a changeset to document the changes:

```bash
# Create a new changeset file
echo "---
'@baseplate-dev/react-generators': patch
---

Upgrade Vite to 7.1.5 and related packages

- vite: 6.3.5 → 7.1.5
- @vitejs/plugin-react: 4.4.1 → 5.0.2
- @tailwindcss/vite: 4.1.6 → 4.1.13
- tailwindcss: 4.1.6 → 4.1.13
- vite-plugin-svgr: 4.3.0 → 4.5.0" > .changeset/upgrade-vite-7.md
```

**Changeset guidelines:**

- Use patch level for most package upgrades unless they introduce breaking changes
- Include affected package names in the frontmatter
- List all upgraded packages with version changes
- Mention any breaking changes or migration steps required

### 9. Handle Issues

#### Type Errors

- Check for breaking API changes in upgraded packages
- Update TypeScript configurations if needed
- Fix import statements or usage patterns

#### Peer Dependency Warnings

- Check if plugins/packages support the new versions
- Update peer dependencies if available
- Consider waiting for compatible versions

#### Build/Runtime Errors

- Check for breaking changes in build tools (Vite, Webpack, etc.)
- Update configuration files as needed
- Test generated projects manually

## Package Categories and Common Upgrades

### Frontend Packages (React Generators)

**Location:** `packages/react-generators/src/constants/react-packages.ts`

Common packages:

- `react`, `react-dom` - Core React
- `vite`, `@vitejs/plugin-react` - Build tooling
- `tailwindcss`, `@tailwindcss/vite` - Styling
- `@tanstack/react-router` - Routing
- `@apollo/client`, `graphql` - GraphQL client

### Backend Packages (Fastify Generators)

**Location:** `packages/fastify-generators/src/constants/fastify-packages.ts`

Common packages:

- `fastify` - Core server
- `@pothos/core` - GraphQL schema builder
- `prisma` - Database ORM
- `zod` - Validation

### Core Packages (Core Generators)

**Location:** `packages/core-generators/src/constants/core-packages.ts`

Common packages:

- `typescript` - TypeScript compiler
- `eslint`, `prettier` - Code quality
- `vitest` - Testing framework

## Best Practices

### 1. Batch Related Updates

Group related packages together (e.g., React ecosystem, Vite ecosystem) to ensure compatibility.

### 2. Test Major Upgrades Separately

For major version upgrades, create a separate branch and test thoroughly before merging.

### 3. Update Documentation

If the upgrade introduces new features or changes APIs, update relevant documentation.

### 4. Check Example Projects

After upgrading, manually test the generated example projects to ensure they work correctly:

```bash
# Test a generated project
cd examples/blog-with-auth
pnpm install
pnpm dev  # Check if it starts without errors
pnpm build  # Check if it builds successfully
```

### 5. Version Pinning Strategy

- **Patch versions**: Generally safe to auto-update
- **Minor versions**: Review changelog, usually safe
- **Major versions**: Always test thoroughly, may require code changes

## Troubleshooting Common Issues

### Issue: Peer Dependency Warnings

```
peer dep warnings about package X not compatible with Y
```

**Solution:**

1. Check if newer versions of the package are available
2. Look for compatibility matrices in package documentation
3. Consider using `pnpm dedupe` to resolve conflicts
4. If no compatible version exists, consider waiting or finding alternatives

### Issue: Type Errors After Upgrade

```
Property 'newFeature' does not exist on type 'OldInterface'
```

**Solution:**

1. Check the package's TypeScript definitions
2. Update imports and usage to match new API
3. Install updated `@types/*` packages if needed

### Issue: Build Failures

```
Build failed due to configuration changes
```

**Solution:**

1. Check package changelog for breaking configuration changes
2. Update relevant config files (vite.config.ts, etc.)
3. Look for migration guides in package documentation

## Example: Complete Vite Upgrade

Here's the complete process we just performed for upgrading Vite from 6.3.5 to 7.1.5:

```bash
# 1. Check current versions
grep vite pnpm-workspace.yaml
grep vite packages/react-generators/src/constants/react-packages.ts

# 2. Get latest versions
npm view vite version                    # 7.1.5
npm view @vitejs/plugin-react version    # 5.0.2
npm view @tailwindcss/vite version       # 4.1.13
npm view tailwindcss version             # 4.1.13

# 3. Update pnpm-workspace.yaml
vite: 7.1.5
@vitejs/plugin-react: 5.0.2
@tailwindcss/vite: 4.1.13
tailwindcss: 4.1.13

# 4. Update react-packages.ts
vite: '7.1.5',
@vitejs/plugin-react: '5.0.2',
@tailwindcss/vite: '4.1.13',
tailwindcss: '4.1.13',

# 5. Install and resolve
pnpm install
pnpm dedupe

# 6. Sync examples
pnpm start sync-examples

# 7. Verify
pnpm typecheck
```

## Automation Opportunities

Consider creating scripts for:

- Checking for outdated packages across all generator constants
- Automated testing of generated projects after upgrades
- Batch updating of patch versions

## Quick Commands Reference

```bash
# Find all package constants files
find packages/ -name "*packages.ts" -o -name "*constants.ts" | grep -E "(packages|constants)"

# Check for outdated packages in npm
npm outdated

# Update all patch versions (be careful with this!)
pnpm update

# Test a specific generated project
cd examples/blog-with-auth && pnpm install && pnpm build

# Check which packages use a specific dependency
grep -r "package-name" packages/*/package.json
```

This playbook ensures consistent and reliable package upgrades across the entire Baseplate ecosystem.
