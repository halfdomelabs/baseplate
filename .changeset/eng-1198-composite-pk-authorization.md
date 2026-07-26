---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-lib': patch
---

Model policies and `r.via` role delegation now support models with composite primary keys and relations backed by multiple foreign key columns. Previously, defining an authorizer role on a model with a composite primary key, or delegating through a multi-column foreign key relation, would fail to generate.
