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

import { VITEST_PRISMA_VITEST_PATHS } from './template-paths.js';

export const prismaVitestImportsSchema = createTsImportMapSchema({
  acquireWorkerDatabase: {},
  createTemplateDatabase: {},
  destroyTestDatabase: {},
  dropStaleTestDatabases: {},
  getTestPrisma: {},
  getTestWorkerId: {},
  getWorkerDatabaseName: {},
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
    prismaVitestImports: prismaVitestImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        prismaVitestImports: createTsImportMap(prismaVitestImportsSchema, {
          acquireWorkerDatabase: paths.dbTestHelper,
          createTemplateDatabase: paths.dbTestHelper,
          destroyTestDatabase: paths.dbTestHelper,
          dropStaleTestDatabases: paths.dbTestHelper,
          getTestPrisma: paths.dbTestHelper,
          getTestWorkerId: paths.dbTestHelper,
          getWorkerDatabaseName: paths.dbTestHelper,
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
