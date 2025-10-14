// @ts-nocheck

import type { PrismaConfig } from 'prisma';

import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

// Only load .env file if it exists
if (existsSync('.env')) {
  loadEnvFile();
}

export default {
  migrations: {
    seed: TPL_SEED_COMMAND,
  },
} satisfies PrismaConfig;
