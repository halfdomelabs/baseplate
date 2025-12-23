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
    createTestDatabase: {},
    createTestDatabaseFromTemplate: {},
    destroyTestDatabase: {},
    getTestPrisma: {},
    replaceDatabase: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/tests/helpers/db.test-helper.ts',
    ),
  },
  variables: { TPL_TEST_DB: {} },
});

const globalSetupPrisma = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'global-setup-prisma',
  referencedGeneratorTemplates: { dbTestHelper: {} },
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
  importMapProviders: {
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
  },
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

export const VITEST_PRISMA_VITEST_TEMPLATES = {
  dbTestHelper,
  globalSetupPrisma,
  prismaTestHelper,
};
