import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface VitestPrismaVitestPaths {
  dbTestHelper: string;
  globalSetupPrisma: string;
  prismaTestHelper: string;
}

const vitestPrismaVitestPaths = createProviderType<VitestPrismaVitestPaths>(
  'vitest-prisma-vitest-paths',
);

const vitestPrismaVitestPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { vitestPrismaVitestPaths: vitestPrismaVitestPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        vitestPrismaVitestPaths: {
          dbTestHelper: `${srcRoot}/tests/helpers/db.test-helper.ts`,
          globalSetupPrisma: `${srcRoot}/tests/scripts/global-setup-prisma.ts`,
          prismaTestHelper: `${srcRoot}/tests/helpers/prisma.test-helper.ts`,
        },
      },
    };
  },
});

export const VITEST_PRISMA_VITEST_PATHS = {
  provider: vitestPrismaVitestPaths,
  task: vitestPrismaVitestPathsTask,
};
