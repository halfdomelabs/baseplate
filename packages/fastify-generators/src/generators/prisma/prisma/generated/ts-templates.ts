import { createTsTemplateFile } from '@halfdomelabs/core-generators';

const seed = createTsTemplateFile({
  name: 'seed',
  projectExports: {},
  source: { path: 'prisma/seed.ts' },
  variables: {},
});

const service = createTsTemplateFile({
  name: 'service',
  projectExports: { prisma: {} },
  source: { path: 'services/prisma.ts' },
  variables: {},
});

export const PRISMA_PRISMA_TS_TEMPLATES = { seed, service };
