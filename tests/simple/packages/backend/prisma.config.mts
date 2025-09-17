import type { PrismaConfig } from 'prisma';

import { loadEnvFile } from 'node:process';

loadEnvFile();

export default {
  migrations: {
    seed: 'tsx --env-file-if-exists=.env --env-file-if-exists=.seed.env src/prisma/seed.ts',
  },
} satisfies PrismaConfig;
