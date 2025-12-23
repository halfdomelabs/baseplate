---
'@baseplate-dev/core-generators': patch
'@baseplate-dev/fastify-generators': patch
---

Migrate Vitest global setup from single merged file to individual files per generator

- Replace `globalSetupOperations` Map with `globalSetupFiles` array in vitest config provider
- Vitest generator now always renders `global-setup-env.ts` for environment loading
- Each generator (Redis, Prisma) now creates its own global setup file
- Vitest config outputs `globalSetup` as an array with env file first, then sorted additional files
