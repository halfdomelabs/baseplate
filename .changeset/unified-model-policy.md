---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-server': patch
---

Consolidated model authorization into a single generated policy per model. Each model now emits one `createModelPolicy` file that declares its roles once and derives both the boolean instance check and the Prisma `where` filter from the same declaration, replacing the separate authorizer and query-filter files. Reads filter through the policy, and authorized updates and deletes compose the grant into the query as a single atomic operation, hiding an unauthorized row as a 404. Role predicates support scalar matches, relation filters, cached delegation to a parent model's policy, global-role and authenticated checks, and `and`/`or` combinations.
