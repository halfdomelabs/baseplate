# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Build and Test Commands

See @.agents/dev-commands.md for dev commands for building and testing.

## Code Style Guidelines

See @.agents/code-style.md for code style guidelines.

## UI Development Guidelines

See .agents/ui-rules.md for UI development guidelines.

See .agents/ui-components.md for the full UI component reference.

## Testing Best Practices

See .agents/testing.md for testing best practices.

## Repository Structure

Baseplate is organized into several core packages:

### Project Builder

- **packages/project-builder-cli** (`@baseplate-dev/project-builder-cli`): CLI application that starts the server and web interface
- **packages/project-builder-web** (`@baseplate-dev/project-builder-web`): React app for configuring project definitions
- **packages/project-builder-server** (`@baseplate-dev/project-builder-server`): Fastify-based backend API for the web interface using TRPC
- **packages/project-builder-lib** (`@baseplate-dev/project-builder-lib`): Shared library with common logic and schema definitions
- **packages/project-builder-common** (`@baseplate-dev/project-builder-common`): Common types and utilities shared across builder packages
- **packages/project-builder-test** (`@baseplate-dev/project-builder-test`): Test runner and utilities for integration testing
- **packages/create-project** (`@baseplate-dev/create-project`): CLI tool for bootstrapping new Baseplate projects
- **packages/ui-components** (`@baseplate-dev/ui-components`): Reusable UI component library with Storybook

### Sync Engine

- **packages/sync** (`@baseplate-dev/sync`): Core package orchestrating code generation workflow
- **packages/core-generators** (`@baseplate-dev/core-generators`): Generates TypeScript code and base abstractions
- **packages/react-generators** (`@baseplate-dev/react-generators`): Generates React components and structure
- **packages/fastify-generators** (`@baseplate-dev/fastify-generators`): Generates Fastify-based backend code

### Utilities

- **packages/code-morph** (`@baseplate-dev/code-morph`): Tools for codebase transformations
- **packages/tools** (`@baseplate-dev/tools`): Common configurations (ESLint, Prettier, TSConfig, Vitest)
- **packages/utils** (`@baseplate-dev/utils`): Utility functions

### Plugins

- **plugins/plugin-auth** (`@baseplate-dev/plugin-auth`): Authentication plugin (includes auth0 and local auth implementations)
- **plugins/plugin-storage** (`@baseplate-dev/plugin-storage`): Storage plugin (S3 and local file storage)
- **plugins/plugin-queue** (`@baseplate-dev/plugin-queue`): Queue plugin (BullMQ and PgBoss)
- **plugins/plugin-rate-limit** (`@baseplate-dev/plugin-rate-limit`): Rate limit plugin (Prisma/Redis)

## Architecture Overview

Baseplate consists of two main tiers:

1. **Project Builder**: UI-driven configuration tool that produces a project definition (JSON)
   - Allows configuring data models, authentication, etc.
   - Compiles high-level definitions into generator bundles

2. **Sync Engine**: Code generation system that processes generator bundles
   - Executes generators in dependency order
   - Handles Task Phases for multi-stage code generation
   - Manages Dynamic Tasks for data-driven generation
   - Uses Provider Scopes for communication between tasks
   - Merges generated code with existing codebase using Git Diff3

## Key Concepts

### Generators

- Created with `createGenerator`
- Define configuration via descriptor schema (Zod)
- Consist of one or more tasks

### Tasks

- Created with `createGeneratorTask`
- Have `run` (initialization) and `build` (code generation) phases
- Export and consume providers
- May be organized into phases for ordered execution

### Providers

- Enable communication between tasks
- Standard providers (mutable state) vs. Output providers (read-only)
- Use scopes to control visibility and prevent collisions

### TypeScript Code Generation

- `TsCodeFragment` for composable code pieces
- `TsCodeUtils` for manipulating fragments
- Import builder for managing dependencies
- Template system for code generation

## Plugin System

- Extends Baseplate with custom features, generators, and UI components
- Uses spec-implementation pattern for loose coupling
- Supports multi-platform modules (node, web, common)

## Code Structure Patterns

- Follow task-based architecture for generators
- Use provider scopes for explicit wiring
- Leverage TypeScript rendering system for code generation
- Organize complex generation with Task Phases
- Use Dynamic Tasks for data-driven generation

## Key Reminders

- Run `pnpm check` after finishing a new feature or bug fix to validate everything works correctly
- If you are adding a new feature or changing an existing feature, please also add a new Changeset for it in the `.changeset/` directory of the form (keeping things to patch changes for now):

  ```markdown
  ---
  'package-name': patch
  ---

  Description of the feature or change
  ```

- IMPORTANT: If you have to go through more than two cycles of edits to fix linting, type, or test errors, please stop and ask for help. Often fixing errors will cause worse changes so it's better to ask for help than to continue. Feel free to ask for help at any time for any issues.
- IMPORTANT: If you notice you are looping, encountering contradictory instructions, or something seems off, stop and flag it to the user immediately. See .agents/code-style.md for the full list of glitch indicators.

## Baseplate Development Server MCP

See .agents/mcp-actions.md for detailed MCP action documentation.

The MCP server provides programmatic access to:

- Project syncing and diffing
- Template extraction and generation
- Generator scaffolding
- Snapshot management
