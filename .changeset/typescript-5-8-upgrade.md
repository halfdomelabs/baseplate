---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/core-generators': patch
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/sync': patch
'@baseplate-dev/utils': patch
'@baseplate-dev/tools': patch
'@baseplate-dev/code-morph': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-cli': patch
'@baseplate-dev/project-builder-test': patch
'@baseplate-dev/ui-components': patch
'@baseplate-dev/create-project': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/plugin-queue': patch
---

Upgrade to TypeScript 5.8 with erasable syntax only mode

This upgrade modernizes the codebase with TypeScript 5.8, enables erasable syntax only mode for better performance, and updates runtime dependencies.

**Key Changes:**

- Upgraded TypeScript to version 5.8
- Enabled `erasableSyntaxOnly` compiler option for improved build performance
- Updated Node.js requirement to 22.18
- Updated PNPM requirement to 10.15
- Fixed parameter property syntax to be compatible with erasable syntax only mode
