---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-web': patch
---

Support configuring a default and maximum page size for paginated GraphQL endpoints so large objects can't be fetched en masse, applied to list queries, connection queries, and paginated list relations alike; setting only a maximum also applies it as the default, since a cap alone would be bypassed by omitting the argument. Cursor pagination can now be enabled independently of offset pagination — a model can expose a list query, a connection query, or both, with where filtering and ordering available to either.
