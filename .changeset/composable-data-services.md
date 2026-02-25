---
'@baseplate-dev/fastify-generators': patch
---

Refactor data services from factory pattern to composable compose/commit pattern

- Replace `defineCreateOperation`/`defineUpdateOperation`/`defineDeleteOperation` with explicit `composeCreate`/`commitCreate`, `composeUpdate`/`commitUpdate`, and `commitDelete` functions
- Export Zod schemas separately (`generateCreateSchema`/`generateUpdateSchema`) for use in GraphQL input validation
- Remove `skipValidation` option from service output methods
- Add `field-utils.ts`, `commit-operations.ts`, and `compose-operations.ts` templates; remove `define-operations.ts`
