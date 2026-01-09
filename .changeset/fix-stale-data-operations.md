---
'@baseplate-dev/fastify-generators': patch
---

Fix stale data bug in data operations when afterExecute/afterCommit hooks modify related records

- Add conditional re-fetch after hooks complete when query includes relations
- Add required `getWhereUnique` to `CreateOperationConfig` for ID extraction
- Extend `findUnique` in `GenericPrismaDelegate` to accept optional `include`
