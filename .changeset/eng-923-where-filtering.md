---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

Added opt-in `where` filtering argument to GraphQL list, count, and connection queries, generating a Prisma-compatible `<Model>WhereInput` type with scalar/enum operators and `AND`/`OR`/`NOT` composition. Caller-supplied filters always compose with (never replace) existing row-level authorization, and filter complexity is capped to prevent overly nested or wide queries.
