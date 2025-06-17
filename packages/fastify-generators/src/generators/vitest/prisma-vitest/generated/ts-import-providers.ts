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

import { VITEST_PRISMA_VITEST_PATHS } from './template-paths.js';

const prismaVitestImportsSchema = createTsImportMapSchema({
  createTestDatabase: {},
  createTestDatabaseFromTemplate: {},
  destroyTestDatabase: {},
  getTestPrisma: {},
  prismaMock: {},
  replaceDatabase: {},
});

export type PrismaVitestImportsProvider = TsImportMapProviderFromSchema<
  typeof prismaVitestImportsSchema
>;

export const prismaVitestImportsProvider =
  createReadOnlyProviderType<PrismaVitestImportsProvider>(
    'prisma-vitest-imports',
  );

const vitestPrismaVitestImportsTask = createGeneratorTask({
  dependencies: {
    paths: VITEST_PRISMA_VITEST_PATHS.provider,
  },
  exports: {
    prismaVitestImports: prismaVitestImportsProvider.export(projectScope),
  },
  run({ paths }) {
    return {
      providers: {
        prismaVitestImports: createTsImportMap(prismaVitestImportsSchema, {
          createTestDatabase: paths.dbTestHelper,
          createTestDatabaseFromTemplate: paths.dbTestHelper,
          destroyTestDatabase: paths.dbTestHelper,
          getTestPrisma: paths.dbTestHelper,
          prismaMock: paths.prismaTestHelper,
          replaceDatabase: paths.dbTestHelper,
        }),
      },
    };
  },
});

export const VITEST_PRISMA_VITEST_IMPORTS = {
  task: vitestPrismaVitestImportsTask,
};
