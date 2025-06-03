import {
  createNodePackagesTask,
  extractPackageVersions,
  projectProvider,
  projectScope,
  tsCodeFragment,
  typescriptFileProvider,
  vitestConfigProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { prismaImportsProvider } from '#src/generators/prisma/prisma/prisma.generator.js';

import {
  createPrismaVitestImports,
  prismaVitestImportsProvider,
} from './generated/ts-import-maps.js';
import { VITEST_PRISMA_VITEST_TS_TEMPLATES } from './generated/ts-templates.js';

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
    imports: createGeneratorTask({
      exports: {
        prismaVitestImports: prismaVitestImportsProvider.export(projectScope),
      },
      run() {
        return {
          providers: {
            prismaVitestImports: createPrismaVitestImports(
              '@/src/tests/helpers',
            ),
          },
        };
      },
    }),
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
        project: projectProvider,
      },
      run({ project, typescriptFile, prismaImports }) {
        const dbHelperPath = '@/src/tests/helpers/db.test-helper.ts';
        const prismaHelperPath = '@/src/tests/helpers/prisma.test-helper.ts';

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: VITEST_PRISMA_VITEST_TS_TEMPLATES.dbTestHelper,
                destination: dbHelperPath,
                variables: {
                  TPL_TEST_DB: quot(
                    `${project.getProjectName().replaceAll('-', '_')}_test`,
                  ),
                },
              }),
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: VITEST_PRISMA_VITEST_TS_TEMPLATES.prismaTestHelper,
                destination: prismaHelperPath,
                importMapProviders: {
                  prismaImports,
                },
                variables: {
                  TPL_PRISMA_PATH: quot(
                    typescriptFile.resolveModuleSpecifier(
                      prismaImports.prisma.moduleSpecifier,
                      prismaHelperPath,
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
