// @ts-nocheck

import type { PrismaConfig } from 'prisma';

import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

// Only load .env file if it exists
if (existsSync('.env')) {
  loadEnvFile();
}

// Only load .env.local file if it exists
if (existsSync('.env.local')) {
  loadEnvFile('.env.local');
}

export default {
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
    seed: TPL_SEED_COMMAND,
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
} satisfies PrismaConfig;
