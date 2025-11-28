import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';

const client = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'generated',
  name: 'client',
  projectExports: { $Enums: {}, '*': {}, Prisma: {}, PrismaClient: {} },
  projectExportsOnly: true,
  source: { contents: '' },
  variables: {},
});

export const generatedGroup = { client };

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
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'service',
  projectExports: { prisma: {} },
  referencedGeneratorTemplates: { client: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/services/prisma.ts'),
  },
  variables: {},
});

export const PRISMA_PRISMA_TEMPLATES = {
  generatedGroup,
  prismaConfig,
  seed,
  service,
};
