---
'@baseplate-dev/fastify-generators': patch
---

Refactor authorization system to use ABAC pattern with string-based roles

- Add `authorizerCache` and `authorizerModelCache` fields to ServiceContext via the `authorizer-utils` generator for caching authorization decisions
- Remove `AuthRole` type and `extractRoles` config from pothos-auth generator as authorization now uses string-based roles with instance role functions
- Add new authorizer utilities including `checkGlobalAuthorization`, `checkInstanceAuthorization`, and `createModelAuthorizer` for flexible authorization patterns
