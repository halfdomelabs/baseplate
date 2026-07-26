---
'@baseplate-dev/fastify-generators': patch
---

Generated backends now cap Vitest to 8 parallel workers for the default `test` run, since each worker clones its own database from the template; `pnpm test:unit` (`TEST_MODE=unit`) remains uncapped since it has no database involvement.
