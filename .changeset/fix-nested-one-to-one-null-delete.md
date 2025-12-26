---
'@baseplate-dev/fastify-generators': patch
---

Fix nestedOneToOneField to not error when setting to null on non-existent relation

Previously, setting a nested one-to-one field to `null` would throw an error if the related record didn't exist, because Prisma's `delete: true` syntax requires the record to exist. Now the deletion is performed via an `afterExecute` hook using `deleteMany`, which is idempotent and won't error if no record exists.
