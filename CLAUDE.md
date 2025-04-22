# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Test Commands

- Build: `pnpm build`
- Lint: `pnpm lint`
- Type check: `pnpm typecheck`
- Test all: `pnpm test`
- Test single file: `pnpm vitest <path/to/file.unit.test.ts>`
- Run only specific tests: `pnpm vitest -t "test name pattern"`

## Baseplate Documentation MCP Server Structure

The `baseplate-docs` MCP server contains comprehensive documentation about Baseplate architecture and features, located at `doc-sync/docs/`. The documentation is organized as follows:

### Main Sections

- **baseplate-architecture/** - Core architecture documentation:

  - **Architecture/** - Fundamental concepts and components:
    - **Typescript Rendering System/** - Code generation system
    - **intro, sync-engine, provider-scopes, plugin-system** files
  - **Developing with Baseplate/** - Guides for plugin development
  - **Internal Tooling/** - Internal tools documentation
  - **Project Builder/** - Documentation for the project builder

- **design-docs/** - Design documents for various features:
  - **Completed/** - Implemented design documents
    - **Draft/** - Draft design documents
  - **design-doc-template.md** - Template for new design docs

### Key Documentation Files

For quick reference, these are important docs to look up:

- Introduction: `baseplate-architecture/Architecture/introduction.md`
- Plugin System: `baseplate-architecture/Architecture/plugin-system.md`
- Creating Generators: `baseplate-architecture/Architecture/creating-a-baseplate-generator.md`
- Plugin Developer Guide: `baseplate-architecture/Developing with Baseplate/building-baseplate-plugins-developer-guide.md`

## Code Style Guidelines

- TypeScript with strict type checking
- Unit tests use `.unit.test.ts` suffix, integration tests use `.int.test.ts`
- Node 16 module resolution - include file extensions in imports (`.js`)
- Always import vitest globals explicitly (describe, it, expect)
- Sort imports by group: external libs first, then local imports
- Use camelCase for variables/functions, PascalCase for types/classes
- Prefer functional programming patterns
- Colocate tests with implementation files
- Use Prettier for formatting (configured via @halfdomelabs/tools)
- Include absolute paths in import statements via tsconfig paths

## Repository Structure

Baseplate is organized into several core repositories:

### Project Builder

- **packages/project-builder-cli**: CLI application that starts the server and web interface
- **packages/project-builder-web**: React app for configuring project definitions
- **packages/project-builder-server**: Fastify-based backend API for the web interface
- **packages/project-builder-lib**: Shared library with common logic and schema definitions
- **packages/create-project**: CLI tool for bootstrapping new Baseplate projects
- **packages/ui-components**: Reusable UI component library with Storybook

### Sync Engine

- **packages/sync**: Core package orchestrating code generation workflow
- **packages/core-generators**: Generates TypeScript code and base abstractions
- **packages/react-generators**: Generates React components and structure
- **packages/fastify-generators**: Generates Fastify-based backend code
- **packages/cli**: Legacy command-line interface

### Utilities

- **packages/code-morph**: Tools for codebase transformations
- **packages/tools**: Common configurations (ESLint, etc.)
- **packages/utils**: Utility functions

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
