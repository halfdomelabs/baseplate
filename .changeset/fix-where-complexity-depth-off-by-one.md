---
'@baseplate-dev/fastify-generators': patch
---

Generated GraphQL `where` filters now permit the full configured nesting depth of `AND`/`OR`/`NOT` clauses instead of rejecting queries one level early, and model authorizers and query helpers now typecheck in projects with many models.
