---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-web': patch
---

Support configuring a default and maximum page size for paginated GraphQL endpoints so large objects can't be fetched en masse, and allow cursor pagination to be enabled independently of offset pagination — a model can now expose a list query, a connection query, or both, with where filtering and ordering available to either.
