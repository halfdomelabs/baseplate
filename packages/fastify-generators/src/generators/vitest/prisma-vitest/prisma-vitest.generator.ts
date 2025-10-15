import {
  createNodePackagesTask,
  extractPackageVersions,
  packageInfoProvider,
  tsCodeFragment,
  typescriptFileProvider,
  vitestConfigProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { prismaImportsProvider } from '#src/generators/prisma/prisma/index.js';

import { VITEST_PRISMA_VITEST_GENERATED } from './generated/index.js';
import { prismaVitestImportsProvider } from './generated/ts-import-providers.js';

const descriptorSchema = z.object({});

export const prismaVitestGenerator = createGenerator({
  name: 'vitest/prisma-vitest',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      dev: extractPackageVersions(FASTIFY_PACKAGES, [
        'vitest-mock-extended',
        'pg-connection-string',
      ]),
    }),
    paths: VITEST_PRISMA_VITEST_GENERATED.paths.task,
    imports: VITEST_PRISMA_VITEST_GENERATED.imports.task,
    renderers: VITEST_PRISMA_VITEST_GENERATED.renderers.task,
    vitestConfig: createGeneratorTask({
      dependencies: {
        vitestConfig: vitestConfigProvider,
        prismaVitestImports: prismaVitestImportsProvider,
      },
      run({ vitestConfig, prismaVitestImports }) {
        vitestConfig.globalSetupOperations.set(
          'prisma',
          tsCodeFragment(
            `
const { TEST_MODE } = process.env;

// don't run database set-up if only running unit tests
if (TEST_MODE !== 'unit') {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  // create separate test DB
  const testDatabaseUrl = await createTestDatabase(process.env.DATABASE_URL);

  // back up original database URL
  process.env.ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;
  process.env.DATABASE_URL = testDatabaseUrl;

  console.info('\\nDatabase migrations ran!');
}
`,
            prismaVitestImports.createTestDatabase.declaration(),
          ),
        );
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        prismaImports: prismaImportsProvider,
        packageInfo: packageInfoProvider,
        paths: VITEST_PRISMA_VITEST_GENERATED.paths.provider,
        renderers: VITEST_PRISMA_VITEST_GENERATED.renderers.provider,
      },
      run({ packageInfo, typescriptFile, prismaImports, paths, renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.dbTestHelper.render({
                variables: {
                  TPL_TEST_DB: quot(
                    `${packageInfo.getPackageName().replaceAll('-', '_')}_test`,
                  ),
                },
              }),
            );

            await builder.apply(
              renderers.prismaTestHelper.render({
                variables: {
                  TPL_PRISMA_PATH: quot(
                    typescriptFile.resolveModuleSpecifier(
                      prismaImports.prisma.moduleSpecifier,
                      paths.prismaTestHelper,
                    ),
                  ),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
