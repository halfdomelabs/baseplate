---
'@baseplate-dev/fastify-generators': patch
---

Fix create/update input schemas to only include their respective fields using Zod `.pick()`, make fieldSchemas a `z.object()`, skip transform path when the operation has no transform fields, and omit unused `context` parameter in scalar-only methods without auth
