// @ts-nocheck

import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { defineConfig, env } from 'prisma/config';

// Only load .env file if it exists
if (existsSync('.env')) {
  loadEnvFile();
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
    seed: TPL_SEED_COMMAND,
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
