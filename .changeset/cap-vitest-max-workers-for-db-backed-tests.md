---
'@baseplate-dev/core-generators': patch
---

The generated `vitest.config.ts` now supports an optional `maxWorkers` value so DB-backed test suites can cap parallel Vitest workers, avoiding Postgres connection or clone-lock exhaustion on high-core CI runners while unit-only runs stay uncapped.
