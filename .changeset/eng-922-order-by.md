---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

Added opt-in `orderBy` sorting to GraphQL list and connection queries, with per-field selection of which exposed fields are sortable and multi-field sort support (`orderBy: [{ createdAt: DESC }, { name: ASC }]`). Cursor pagination automatically appends the model's ID field(s) as a stable tiebreaker so pages don't skip or repeat rows when the caller's sort has ties.
