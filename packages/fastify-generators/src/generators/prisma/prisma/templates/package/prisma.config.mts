// @ts-nocheck

import { loadEnvFile } from 'node:process';
import type { PrismaConfig } from 'prisma';

loadEnvFile();

export default {
  migrations: {
    seed: TPL_SEED_COMMAND,
  },
} satisfies PrismaConfig;
