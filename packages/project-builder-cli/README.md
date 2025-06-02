# @baseplate-dev/project-builder-cli

This package provides the command-line interface (CLI) for Baseplate's project builder. It starts the server and web interface, enabling users to configure and manage their Baseplate projects.

## Purpose

The project-builder-cli serves as the entry point for the Baseplate project builder. When users run `pnpm baseplate serve`, this CLI:

- Starts the Fastify-based backend server (project-builder-server)
- Launches the React web interface (project-builder-web)
- Manages the communication between the UI and server components
- Handles project synchronization and code generation

## Usage

This package is typically installed as part of a Baseplate project and provides the `baseplate` command:

```bash
pnpm baseplate serve    # Start the project builder UI
pnpm baseplate generate # Run code generation
```

## Part of Baseplate Monorepo

This package is part of the Baseplate monorepo and works in conjunction with other packages in the ecosystem.
