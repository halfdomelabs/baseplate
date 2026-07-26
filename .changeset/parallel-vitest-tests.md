---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/core-generators': patch
---

Generated backend test suites now run in parallel across Vitest workers instead of being pinned to a single worker. Each worker migrates a shared template database once, then clones its own per-worker database from it, and Redis keys are namespaced per worker — so concurrent test files no longer clobber each other's data. The generated vitest config no longer forces `maxWorkers: 1`, letting all generated packages use Vitest's default parallelism.
