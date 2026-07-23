---
'@baseplate-dev/project-builder-web': patch
---

Bump `@module-federation/enhanced` to 2.7.0 for TypeScript 6 compatibility (2.6.0's peer range capped at TypeScript 5). `@module-federation/vite` stays pinned at 1.16.11 — 1.17+ breaks the module federation shared-scope singleton for `zod`/`@baseplate-dev/project-builder-lib`, which caused entity IDs to go unassigned when plugin-seeded models (e.g. auth, rate-limit) were merged into a new project during setup.
