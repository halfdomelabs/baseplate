import type { PrismaConfig } from 'prisma';

import { loadEnvFile } from 'node:process';

loadEnvFile();

export default {
  migrations: {
    seed: /* TPL_SEED_COMMAND:START */ 'tsx --env-file-if-exists=.env --env-file-if-exists=.seed.env src/prisma/seed.ts' /* TPL_SEED_COMMAND:END */,
  },
} satisfies PrismaConfig;
