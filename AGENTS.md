# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Build and Test Commands

See @.cursor/rules/dev-commands.mdc for dev commands for building and testing.

## Code Style Guidelines

See @.cursor/rules/code-style.mdc for code style guidelines.

## UI Development Guidelines

See .cursor/rules/ui-rules.mdc for UI development guidelines.

See .cursor/rules/ui-components.mdc for the full UI component reference.

## Testing Best Practices

See .cursor/rules/testing.mdc for testing best practices.

## Repository Structure

Baseplate is organized into several core packages:

### Project Builder

- **packages/project-builder-cli**: CLI application that starts the server and web interface
- **packages/project-builder-web**: React app for configuring project definitions
- **packages/project-builder-server**: Fastify-based backend API for the web interface using TRPC
- **packages/project-builder-lib**: Shared library with common logic and schema definitions
- **packages/project-builder-common**: Common types and utilities shared across builder packages
- **packages/project-builder-test**: Test runner and utilities for integration testing
- **packages/create-project**: CLI tool for bootstrapping new Baseplate projects
- **packages/ui-components**: Reusable UI component library with Storybook

### Sync Engine

- **packages/sync**: Core package orchestrating code generation workflow
- **packages/core-generators**: Generates TypeScript code and base abstractions
- **packages/react-generators**: Generates React components and structure
- **packages/fastify-generators**: Generates Fastify-based backend code

### Utilities

- **packages/code-morph**: Tools for codebase transformations
- **packages/tools**: Common configurations (ESLint, Prettier, TSConfig, Vitest)
- **packages/utils**: Utility functions

### Plugins

- **plugins/plugin-auth**: Authentication plugin (includes auth0 and local auth implementations)
- **plugins/plugin-storage**: Storage plugin (S3 and local file storage)

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

## String Comparison

**IMPORTANT**: Always use `compareStrings` from `@baseplate-dev/utils` instead of `String.prototype.localeCompare()`.

### When to Use localeCompare

Only use `localeCompare()` when:

1. Building user-facing features that require locale-aware sorting
2. Displaying sorted lists in the UI
3. Explicitly requested by product requirements

For all code generation, file sorting, and internal data structures, use `compareStrings`.

## Key Reminders for Claude Code

- Run `pnpm lint:affected` and `pnpm typecheck` before committing changes
- If a particular interface or type is not exported, change the file so it is exported
- If you are adding a new feature or changing an existing feature, please also add a new Changeset for it in the `.changeset/` directory of the form (keeping things to patch changes for now):

  ```markdown
  ---
  'package-name': patch
  ---

  Description of the feature or change
  ```

- IMPORTANT: If you have to go through more than two cycles of edits to fix linting, type, or test errors, please stop and ask for help. Often fixing errors will cause worse changes so it's better to ask for help than to continue. Feel free to ask for help at any time for any issues.

## Baseplate Documentation

The Baseplate documentation is available in the local filesystem at `~/baseplate-docs` (when accessible) or via the baseplate-docs MCP server.

### Local Documentation Structure (Preferred when available)

When `~/baseplate-docs` is accessible (check via `.claude/settings.json` permissions), use direct file access:

**Directory Structure:**

- `~/baseplate-docs/baseplate-docs/` - Main Baseplate documentation
  - `baseplate-architecture/` - Architecture documentation
  - `components/` - UI components documentation
  - `developer-guide/` - Developer guides
  - `internal-tooling/` - Internal tooling documentation
  - `project-builder/` - Project builder documentation
- `~/baseplate-docs/design-docs/` - Design documents
  - `completed/` - Completed design documents
  - `design-document-template.md` - Template for new design docs

**Tips for local access:**

- Read files directly with the Read tool for better performance
- Create new design docs by copying `~/baseplate-docs/design-docs/design-document-template.md`
- Use Grep/Glob tools for searching across documentation
- Write new documents directly with Write/Edit tools
- Please use Mermaid diagrams instead of ASCII art diagrams

### Baseplate Docs MCP (Fallback)

If `~/baseplate-docs` is not accessible, use the baseplate-docs MCP server:

**Collection keys:**

- **baseplate-docs**: Baseplate documentation
- **design-docs**: Design documentation

**Document Retrieval:**

- get-document - Retrieve full document content by URI (format: documents://collection-name/path/to/doc.md)
- get-document-by-id - Retrieve document by its Outline ID
- list-documents - List documents with optional filters

**Search Tools:**

- search-documents - Semantic search returning full documents
- search-rag-documents - RAG search returning specific document chunks

**Document Editing (if enabled):**

- edit-document - Replace entire document content
- inline-edit - Make specific edits within a document
- create-document - Create new document in a collection

**Usage Examples:**

- Find specific info: search-rag-documents with query "how to configure authentication"
- Browse content: list-documents with collection filter
- Read document: get-document with URI like "documents://design-docs/completed/auth-plugin-refactor.md"

## Baseplate Development Server MCP

See .cursor/rules/mcp-actions.mdc for detailed MCP action documentation.

The MCP server provides programmatic access to:

- Project syncing and diffing
- Template extraction and generation
- Generator scaffolding
- Snapshot management

## Development Workflows (Skills)

For detailed step-by-step workflows, use the following Claude Code skills:

| Skill                 | Command                  | Description                                                                                      |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| Modify Generated Code | `/modify-generated-code` | Complete workflow for modifying generated code, template extraction, and project synchronization |
| Package Upgrade       | `/package-upgrade`       | Systematic approach for upgrading packages in the monorepo                                       |

These skills provide detailed instructions, MCP commands, and best practices for common development tasks.
