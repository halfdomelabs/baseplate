import {
  createNodePackagesTask,
  extractPackageVersions,
  packageInfoProvider,
  typescriptFileProvider,
  vitestConfigProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { prismaImportsProvider } from '#src/generators/prisma/prisma/index.js';

import { VITEST_PRISMA_VITEST_GENERATED } from './generated/index.js';

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
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        prismaImports: prismaImportsProvider,
        packageInfo: packageInfoProvider,
        vitestConfig: vitestConfigProvider,
        paths: VITEST_PRISMA_VITEST_GENERATED.paths.provider,
        renderers: VITEST_PRISMA_VITEST_GENERATED.renderers.provider,
      },
      run({
        packageInfo,
        typescriptFile,
        prismaImports,
        vitestConfig,
        paths,
        renderers,
      }) {
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

            // Render the global setup file and register it with vitest
            await builder.apply(renderers.globalSetupPrisma.render({}));
            vitestConfig.globalSetupFiles.push(
              `./${paths.globalSetupPrisma.replace('@/src/', '')}`,
            );
          },
        };
      },
    }),
  }),
});
