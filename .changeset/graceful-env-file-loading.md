---
'@baseplate-dev/fastify-generators': patch
---

Allow prisma.config.mts to gracefully handle missing .env files by checking file existence before calling loadEnvFile(), enabling pnpm prisma generate to run successfully in environments without .env files
