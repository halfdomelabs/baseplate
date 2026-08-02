---
'@baseplate-dev/fastify-generators': patch
---

Generated model authorizers and query helpers now typecheck in projects with many models, where TypeScript previously could not assign a composed `AND`/`OR` clause against the full model union.
