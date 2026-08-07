// @ts-nocheck

import type { PrismaConfig } from 'prisma';

import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

if (existsSync('.env.local')) {
  loadEnvFile('.env.local');
}

if (existsSync('.env')) {
  loadEnvFile();
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
