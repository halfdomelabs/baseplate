# @baseplate-dev/project-builder-web

This package contains the React-based web interface for the Baseplate project builder. It provides the graphical user interface where users configure their project's blueprint.

## Purpose

The project-builder-web package provides:

- A visual interface for defining data models, relationships, and fields
- Configuration through plugin interfaces
- Project settings and configuration management
- Real-time preview of project structure
- Integration with the project-builder-server for saving and synchronizing changes

## Technology Stack

- Built with React and TypeScript
- Uses Vite for bundling and development
- Styled with Tailwind CSS
- Communicates with the backend via tRPC

## Part of Baseplate Monorepo

This package is part of the Baseplate monorepo and is served by the project-builder-cli when users run `pnpm baseplate serve`.
