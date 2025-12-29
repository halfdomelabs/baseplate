import type { PrismaConfig } from 'prisma';

import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

// Only load .env file if it exists
if (existsSync('.env')) {
  loadEnvFile();
}

export default {
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
    seed: /* TPL_SEED_COMMAND:START */ 'tsx --env-file-if-exists=.env --env-file-if-exists=.seed.env src/prisma/seed.ts' /* TPL_SEED_COMMAND:END */,
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
} satisfies PrismaConfig;
