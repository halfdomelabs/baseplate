import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const seed = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'seed',
  source: {
    path: path.join(import.meta.dirname, '../templates/src/prisma/seed.ts'),
  },
  variables: {},
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

export const PRISMA_PRISMA_TEMPLATES = { seed, service };
