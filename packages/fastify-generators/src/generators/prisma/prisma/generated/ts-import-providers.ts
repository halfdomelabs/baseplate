import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import {
  prismaGeneratedImportsProvider,
  prismaGeneratedImportsSchema,
} from '#src/generators/prisma/_providers/prisma-generated-imports.js';

import { PRISMA_PRISMA_PATHS } from './template-paths.js';

export const prismaImportsSchema = createTsImportMapSchema({ prisma: {} });

export type PrismaImportsProvider = TsImportMapProviderFromSchema<
  typeof prismaImportsSchema
>;

export const prismaImportsProvider =
  createReadOnlyProviderType<PrismaImportsProvider>('prisma-imports');

const prismaPrismaImportsTask = createGeneratorTask({
  dependencies: {
    paths: PRISMA_PRISMA_PATHS.provider,
  },
  exports: {
    prismaGeneratedImports: prismaGeneratedImportsProvider.export(packageScope),
    prismaImports: prismaImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        prismaGeneratedImports: createTsImportMap(
          prismaGeneratedImportsSchema,
          {
            $Enums: paths.client,
            '*': paths.client,
            Prisma: paths.client,
            PrismaClient: paths.client,
          },
        ),
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
