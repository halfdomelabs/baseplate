---
'@baseplate-dev/fastify-generators': patch
---

Generated `prisma.config.ts` now also loads `.env.local` (in addition to `.env`), so local environment overrides are picked up by Prisma CLI commands like migrations.
