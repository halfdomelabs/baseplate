---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/core-generators': patch
---

Generated backend test suites now run in parallel across Vitest workers instead of being pinned to a single worker: each worker migrates a shared template database once then clones its own per-worker database from it, and Redis keys are namespaced per worker, so concurrent test files no longer clobber each other's data. The generated `vitest.config.ts` takes an optional `maxWorkers` value, which DB-backed runs cap at 8 to avoid exhausting Postgres connections or clone locks on high-core CI runners, while unit-only runs (`TEST_MODE=unit`) stay uncapped.
