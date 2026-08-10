---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/fastify-generators': patch
---

Model fields can now have an optional description, editable from the field's options menu, which is included as the `description` on the corresponding generated GraphQL object type field.
