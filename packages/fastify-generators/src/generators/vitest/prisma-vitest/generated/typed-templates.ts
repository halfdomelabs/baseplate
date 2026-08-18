import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { prismaGeneratedImportsProvider } from '#src/generators/prisma/_providers/prisma-generated-imports.js';
import { prismaImportsProvider } from '#src/generators/prisma/prisma/generated/ts-import-providers.js';

const dbTestHelper = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    prismaGeneratedImports: prismaGeneratedImportsProvider,
  },
  name: 'db-test-helper',
  projectExports: {
    acquireWorkerDatabase: {},
    createTemplateDatabase: {},
    dropStaleTestDatabases: {},
    getTestPrisma: {},
  },
  referencedGeneratorTemplates: { workerDatabaseTestHelper: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/tests/helpers/db.test-helper.ts',
    ),
  },
  variables: {},
});

const globalSetupPrisma = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'global-setup-prisma',
  referencedGeneratorTemplates: {
    dbTestHelper: {},
    workerDatabaseTestHelper: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/tests/scripts/global-setup-prisma.ts',
    ),
  },
  variables: {},
});

const prismaTestHelper = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { prismaImports: prismaImportsProvider },
  name: 'prisma-test-helper',
  projectExports: { prismaMock: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/tests/helpers/prisma.test-helper.ts',
    ),
  },
  variables: { TPL_PRISMA_PATH: {} },
});

const setupDb = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'setup-db',
  referencedGeneratorTemplates: { workerDatabaseTestHelper: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/tests/scripts/setup-db.ts',
    ),
  },
  variables: { TPL_DB_TEST_HELPER_PATH: {} },
});

const workerDatabaseTestHelper = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'worker-database-test-helper',
  projectExports: {
    clearWorkerDatabaseRecords: {},
    ensureWorkerDatabase: {},
    getTemplateDatabaseUrl: {},
    getWorkerDatabaseName: {},
    getWorkerDatabaseUrl: {},
    TEMPLATE_DATABASE_NAME: {},
    TEST_DATABASE_NAME: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/tests/helpers/worker-database.test-helper.ts',
    ),
  },
  variables: { TPL_TEST_DB: {} },
});

export const VITEST_PRISMA_VITEST_TEMPLATES = {
  dbTestHelper,
  globalSetupPrisma,
  prismaTestHelper,
  setupDb,
  workerDatabaseTestHelper,
};
