# @baseplate-dev/tools

This package contains common development tools and configurations used throughout the Baseplate monorepo.

## Purpose

The tools package provides:

- Shared oxlint configuration, including Baseplate's custom JS plugin rules
- oxfmt configurations for consistent code formatting
- TypeScript configurations for various project types
- Vitest configurations for testing
- Common development tool settings

## Configurations Included

- **oxlint**: Base config and the `baseplate` JS plugin (`no-unused-generator-dependencies`)
- **oxfmt**: Base and React formatting configs
- **TypeScript**: Base configs for CLI, library, and Vite projects
- **Vitest**: Test runner configurations for Node.js and React

## Part of Baseplate Monorepo

This package is part of the Baseplate monorepo and provides standardized development configurations to ensure consistency across all packages.
