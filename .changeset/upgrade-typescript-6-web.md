---
'@baseplate-dev/project-builder-web': patch
---

Bump `@module-federation/enhanced` to 2.7.0 and `@module-federation/vite` to 1.17.0 for TypeScript 6 compatibility. `@module-federation/vite` is pinned at exactly 1.17.0 — 1.17.1+ breaks the module federation shared-scope singleton for `zod`/`@baseplate-dev/project-builder-lib`, which caused entity IDs to go unassigned when plugin-seeded models (e.g. auth, rate-limit) were merged into a new project during setup.
