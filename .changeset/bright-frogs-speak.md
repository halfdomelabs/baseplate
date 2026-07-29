---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

GraphQL list relation fields can now opt into orderBy arguments using the related model's sortable fields, and requesting ordering on a model with no sortable fields now fails with a clear error instead of generating an invalid schema.
