# AGENTS.md

This file provides guidance to AI agents working with the **{{TPL_PROJECT_NAME}}** project.

## Project Overview

{{TPL_PROJECT_NAME}} is a full-stack TypeScript monorepo built with [Baseplate](https://www.baseplate.dev).

### Applications

{{TPL_APPS_LIST}}

## Build & Test Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm prettier:write
```

## Project Structure

This is a pnpm monorepo managed with Turborepo. Key directories:

- `apps/` — Application packages (backend, web, admin)
- `libs/` — Shared library packages
- `baseplate/` — Baseplate project configuration and generated code
- `docker/` — Docker Compose configuration for local services

## Conventions

- **Language:** TypeScript throughout (strict mode)
- **Package manager:** pnpm with workspace protocol
- **Monorepo tool:** Turborepo for task orchestration
- **Code style:** Prettier for formatting, ESLint for linting

## Baseplate

This project uses Baseplate for code generation. The project definition is stored in `baseplate/project-definition.json`.

- See `.agents/baseplate.md` for how to use the Baseplate MCP server, modify data models, and manage plugins
