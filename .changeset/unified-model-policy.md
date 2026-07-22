---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-server': patch
---

Consolidated model authorization into a single generated policy per model. Each model now emits one `createModelPolicy` file that declares its roles once and derives both the boolean instance check and the Prisma `where` filter from the same declaration, replacing the previously separate authorizer and query-filter files. Reads filter through `policy.read.where`, get-by-id composes the read grant into the unique selector and maps an unauthorized or missing row to a 404, and authorized updates and deletes run as a single atomic query. Role predicates support scalar-equality matches, relation filters, cached to-one delegation to a parent model's policy, global-role checks, authenticated checks, and `and`/`or` combinations.
