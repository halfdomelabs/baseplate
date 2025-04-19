import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  projectProvider,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  typescriptProvider,
  vitestConfigProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { prismaOutputProvider } from '@src/generators/prisma/prisma/prisma.generator.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type PrismaVitestProvider = ImportMapper;

export const prismaVitestProvider =
  createProviderType<PrismaVitestProvider>('prisma-vitest');

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
    main: createGeneratorTask({
      dependencies: {
        vitestConfig: vitestConfigProvider,
        typescript: typescriptProvider,
        prismaOutput: prismaOutputProvider,
        project: projectProvider,
      },
      exports: {
        prismaVitest: prismaVitestProvider.export(projectScope),
      },
      run({ vitestConfig, project, typescript, prismaOutput }) {
        const [dbHelperImport, dbHelperPath] = makeImportAndFilePath(
          'src/tests/helpers/db.test-helper.ts',
        );

        const [prismaHelperImport, prismaHelperPath] = makeImportAndFilePath(
          'src/tests/helpers/prisma.test-helper.ts',
        );

        const importMap = {
          '%prisma-vitest/db': {
            path: dbHelperImport,
            allowedImports: ['createTestDatabase', 'destroyTestDatabase'],
          },
          '%prisma-vitest/prisma': {
            path: prismaHelperImport,
            allowedImports: ['prismaMock'],
          },
        };

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

  // eslint-disable-next-line no-console
  console.info('\\nDatabase migrations ran!');
}
`,
            tsImportBuilder(['createTestDatabase']).from(dbHelperImport),
          ),
        );

        return {
          providers: {
            prismaVitest: {
              getImportMap: () => importMap,
            },
          },
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'db.test-helper.ts',
                destination: dbHelperPath,
                replacements: {
                  TEST_DATABASE_NAME_VALUE: `${project
                    .getProjectName()
                    .replace('-', '_')}_test`,
                },
              }),
            );

            await builder.apply(
              typescript.createCopyAction({
                source: 'prisma.test-helper.ts',
                destination: prismaHelperPath,
                importMappers: [prismaOutput],
                replacements: {
                  PRISMA_SERVICE_PATH: typescript.resolveModule(
                    prismaOutput.getPrismaServicePath(),
                    prismaHelperPath,
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
