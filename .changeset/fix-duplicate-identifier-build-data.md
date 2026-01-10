---
'@baseplate-dev/fastify-generators': patch
---

Fix duplicate identifier bug in generated nested field buildData functions

- Split `buildData` into separate `buildCreateData` and `buildUpdateData` functions
- Each function now has its own scope, avoiding duplicate identifier errors when FK fields are destructured
- Use `Promise.all` for parallel execution of buildCreateData and buildUpdateData
