---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

Added opt-in `where` filtering to GraphQL list, count, and connection queries, with per-field selection of which exposed fields are filterable. Caller-supplied filters compose with existing row-level authorization and are capped in depth/breadth to prevent overly complex queries.
