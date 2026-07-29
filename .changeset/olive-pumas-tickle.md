---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

Sortable and filterable field selections have moved out of the list query settings into a new model-level Sorting & Filtering section, since list queries and list relations sort by the same fields, and models can now define a default sort that orders results whenever a caller supplies no orderBy — including on relations and queries that expose no orderBy argument at all. Existing projects migrate automatically.
