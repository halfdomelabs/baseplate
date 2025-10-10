// @ts-nocheck

import type { PrismaConfig } from 'prisma';

import { loadEnvFile } from 'node:process';

loadEnvFile();

export default {
  migrations: {
    seed: TPL_SEED_COMMAND,
  },
} satisfies PrismaConfig;
