---
'@baseplate-dev/fastify-generators': patch
---

Improve Prisma schema merge by normalizing whitespace before diff3 to reduce false conflicts caused by Prisma's column-aligning formatter.
