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
  clearWorkerDatabaseRecords: {},
  createTemplateDatabase: {},
  dropStaleTestDatabases: {},
  ensureWorkerDatabase: {},
  getTemplateDatabaseUrl: {},
  getTestPrisma: {},
  getWorkerDatabaseName: {},
  getWorkerDatabaseUrl: {},
  prismaMock: {},
  TEMPLATE_DATABASE_NAME: {},
  TEST_DATABASE_NAME: {},
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
          clearWorkerDatabaseRecords: paths.workerDatabaseTestHelper,
          createTemplateDatabase: paths.dbTestHelper,
          dropStaleTestDatabases: paths.dbTestHelper,
          ensureWorkerDatabase: paths.workerDatabaseTestHelper,
          getTemplateDatabaseUrl: paths.workerDatabaseTestHelper,
          getTestPrisma: paths.dbTestHelper,
          getWorkerDatabaseName: paths.workerDatabaseTestHelper,
          getWorkerDatabaseUrl: paths.workerDatabaseTestHelper,
          prismaMock: paths.prismaTestHelper,
          TEMPLATE_DATABASE_NAME: paths.workerDatabaseTestHelper,
          TEST_DATABASE_NAME: paths.workerDatabaseTestHelper,
        }),
      },
    };
  },
});

export const VITEST_PRISMA_VITEST_IMPORTS = {
  generatorName: '@baseplate-dev/fastify-generators#vitest/prisma-vitest',
  task: vitestPrismaVitestImportsTask,
};
