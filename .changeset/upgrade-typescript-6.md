---
'@baseplate-dev/core-generators': patch
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-notifications': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

Upgraded generated projects to TypeScript 6.0.3 (from 5.9.3), with typescript-eslint 8.65.0, `@vitest/eslint-plugin` 1.6.23, `eslint-plugin-perfectionist` 5.10.0, and `vitest-mock-extended` 3.1.1 for compatibility. Generated React apps now set `"types": ["node"]` in `tsconfig.app.json` and generated backends set `rootDir`/`types` in their `tsconfig.json`, since TypeScript 6 no longer implicitly includes `@types/node` globals for composite builds. Note that `@module-federation/vite` is pinned at exactly 1.17.0 — 1.17.1+ breaks the module federation shared-scope singleton for `zod`/`@baseplate-dev/project-builder-lib`, which left entity IDs unassigned when plugin-seeded models were merged into a new project during setup.
