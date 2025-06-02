# @baseplate-dev/project-builder-server

This package provides the backend API server for the Baseplate project builder. It runs on Node.js with Fastify and handles all server-side operations.

## Purpose

The project-builder-server package provides:

- Backend API endpoints for the project-builder-web interface via tRPC
- Project definition storage and retrieval
- Conversion of high-level project definitions into detailed code generation instructions
- Orchestration of the sync engine for code generation
- Integration of generated code into the project codebase
- File system operations and project management

## Technology Stack

- Built with Fastify
- Uses tRPC for type-safe client-server communication

## Part of Baseplate Monorepo

This package is part of the Baseplate monorepo and is started automatically by the project-builder-cli when running `pnpm baseplate serve`.
