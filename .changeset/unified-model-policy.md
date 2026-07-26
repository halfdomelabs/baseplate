---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-lib': patch
---

Consolidated model authorization into a single generated policy per model. Each model emits one `createModelPolicy` file that declares its roles once and derives both the boolean instance check and the Prisma `where` filter from the same declaration, with action helpers grouped under `policy.actions`; reads filter through the policy, and authorized updates and deletes compose the grant into the query as one atomic operation, hiding an unauthorized row as a 404. Role predicates support scalar matches, relation filters, cached delegation to a parent model's policy via `r.via`, global-role and authenticated checks, and `and`/`or` combinations, and both policies and `r.via` delegation work with composite primary keys and multi-column foreign keys. The `r.userMatch`/`r.userWhere` verbs key a predicate on the authenticated user's id and only run for an authenticated principal, so an anonymous caller is denied without a per-role null guard.
