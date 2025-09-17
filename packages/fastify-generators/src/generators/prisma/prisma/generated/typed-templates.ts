import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const prismaConfig = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'prisma-config',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/package/prisma.config.mts',
    ),
  },
  variables: { TPL_SEED_COMMAND: {} },
});

const seed = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'seed',
  referencedGeneratorTemplates: { service: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/prisma/seed.ts'),
  },
  variables: { TPL_SEED_BODY: {} },
});

const service = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'service',
  projectExports: { prisma: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/services/prisma.ts'),
  },
  variables: {},
});

export const PRISMA_PRISMA_TEMPLATES = { prismaConfig, seed, service };
