import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { prismaImportsProvider } from '../../../prisma/prisma/generated/ts-import-maps.js';

const dbTestHelper = createTsTemplateFile({
  name: 'db-test-helper',
  projectExports: {
    createTestDatabase: {},
    createTestDatabaseFromTemplate: {},
    destroyTestDatabase: {},
    getTestPrisma: {},
    replaceDatabase: {},
  },
  source: { path: 'db.test-helper.ts' },
  variables: { TPL_TEST_DB: {} },
});

const prismaTestHelper = createTsTemplateFile({
  importMapProviders: { prismaImports: prismaImportsProvider },
  name: 'prisma-test-helper',
  projectExports: { prismaMock: {} },
  source: { path: 'prisma.test-helper.ts' },
  variables: { TPL_PRISMA_PATH: {} },
});

export const VITEST_PRISMA_VITEST_TS_TEMPLATES = {
  dbTestHelper,
  prismaTestHelper,
};
