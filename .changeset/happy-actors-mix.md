---
'@baseplate-dev/fastify-generators': patch
---

Upgrade Prisma to 6.17.1 and adopt the new Prisma generator architecture:

- Updated to Prisma 6.17.1 for improved performance and features
- Migrated Prisma generated client location from `node_modules/.prisma/client` to `@src/generated/prisma/client.js` for better control and type safety
