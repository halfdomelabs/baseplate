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
  createTestRunId: {},
  createWorkerMarkerDirectory: {},
  dropRunTestDatabases: {},
  ensureWorkerDatabase: {},
  getTemplateDatabaseName: {},
  getTemplateDatabaseUrl: {},
  getTestPrisma: {},
  getWorkerDatabaseName: {},
  getWorkerDatabaseUrl: {},
  parseTestDatabaseName: {},
  prismaMock: {},
  reclaimStaleTestDatabases: {},
  removeWorkerMarkerDirectory: {},
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
          createTemplateDatabase: paths.dbTestHelper,
          createTestRunId: paths.workerDatabaseTestHelper,
          createWorkerMarkerDirectory: paths.workerDatabaseTestHelper,
          dropRunTestDatabases: paths.dbTestHelper,
          ensureWorkerDatabase: paths.workerDatabaseTestHelper,
          getTemplateDatabaseName: paths.workerDatabaseTestHelper,
          getTemplateDatabaseUrl: paths.workerDatabaseTestHelper,
          getTestPrisma: paths.dbTestHelper,
          getWorkerDatabaseName: paths.workerDatabaseTestHelper,
          getWorkerDatabaseUrl: paths.workerDatabaseTestHelper,
          parseTestDatabaseName: paths.workerDatabaseTestHelper,
          prismaMock: paths.prismaTestHelper,
          reclaimStaleTestDatabases: paths.dbTestHelper,
          removeWorkerMarkerDirectory: paths.workerDatabaseTestHelper,
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
