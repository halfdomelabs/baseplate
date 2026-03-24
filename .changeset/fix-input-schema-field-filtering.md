---
'@baseplate-dev/fastify-generators': patch
---

Fix create/update input schemas to only include their respective fields instead of the union of all fields, and skip transform path when the operation has no transform fields
