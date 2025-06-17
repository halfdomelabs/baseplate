import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  projectScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { PRISMA_PRISMA_PATHS } from './template-paths.js';

const prismaImportsSchema = createTsImportMapSchema({ prisma: {} });

export type PrismaImportsProvider = TsImportMapProviderFromSchema<
  typeof prismaImportsSchema
>;

export const prismaImportsProvider =
  createReadOnlyProviderType<PrismaImportsProvider>('prisma-imports');

const prismaPrismaImportsTask = createGeneratorTask({
  dependencies: {
    paths: PRISMA_PRISMA_PATHS.provider,
  },
  exports: { prismaImports: prismaImportsProvider.export(projectScope) },
  run({ paths }) {
    return {
      providers: {
        prismaImports: createTsImportMap(prismaImportsSchema, {
          prisma: paths.service,
        }),
      },
    };
  },
});

export const PRISMA_PRISMA_IMPORTS = {
  task: prismaPrismaImportsTask,
};
