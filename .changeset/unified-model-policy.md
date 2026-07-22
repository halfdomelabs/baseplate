---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-server': patch
---

Consolidated model authorization into a single generated policy per model. Each model now emits one `createModelPolicy` file that declares its roles once and derives both the boolean instance check and the Prisma `where` filter from the same declaration, replacing the previously separate authorizer and query-filter files. Reads filter through `policy.read.where`, and get-by-id composes the read grant into the unique selector and maps an unauthorized or missing row to a 404. Instance-authorized updates and deletes now run as a single atomic query that composes the grant into the unique selector (no separate load-then-check round trip and no time-of-check/time-of-use gap), with an unauthorized or missing row surfacing as a 404. Role predicates support scalar-equality matches, relation filters, cached to-one delegation to a parent model's policy, global-role checks, authenticated checks, and `and`/`or` combinations.
