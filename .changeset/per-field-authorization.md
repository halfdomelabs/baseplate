---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

Add per-field authorization support for GraphQL object type fields

- Rename `roles` to `globalRoles` on object type field entries to distinguish from query/mutation-level roles
- Extend `PothosAuthProvider` with `formatMixedAuthorizeConfig` for mixed global + instance role arrays
- Expand `pothosPrismaObjectGenerator` descriptor to carry per-field auth config (`globalRoles`, `instanceRoles`)
- Thread `authorize` option through Pothos field writers for both scalar and relation fields
- Update compiler to pass auth data from project definition to generator descriptors
- Update migration-024 to handle `roles` → `globalRoles` rename
