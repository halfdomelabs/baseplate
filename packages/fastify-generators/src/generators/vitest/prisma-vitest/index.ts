import {
  ImportMapper,
  makeImportAndFilePath,
  nodeProvider,
  projectProvider,
  TypescriptCodeUtils,
  typescriptProvider,
  vitestProvider,
} from '@halfdomelabs/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { fastifyVitestProvider } from '../fastify-vitest/index.js';
import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type PrismaVitestProvider = ImportMapper;

export const prismaVitestProvider =
  createProviderType<PrismaVitestProvider>('prisma-vitest');

const PrismaVitestGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    vitest: vitestProvider,
    typescript: typescriptProvider,
    prismaOutput: prismaOutputProvider,
    project: projectProvider,
    fastifyVitest: fastifyVitestProvider,
  },
  exports: {
    prismaVitest: prismaVitestProvider,
  },
  createGenerator(
    descriptor,
    { node, vitest, project, typescript, prismaOutput },
  ) {
    node.addDevPackages({
      'vitest-mock-extended': '1.3.1',
      'pg-connection-string': '2.6.1',
    });

    const [dbHelperImport, dbHelperPath] = makeImportAndFilePath(
      'src/tests/helpers/db.vitest-helper.ts',
    );

    const [prismaHelperImport, prismaHelperPath] = makeImportAndFilePath(
      'src/tests/helpers/prisma.vitest-helper.ts',
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

    vitest.getConfig().appendUnique('customSetupBlocks', [
      TypescriptCodeUtils.createBlock(
        `
// don't run database set-up if only running unit tests
if (!globalConfig.testPathPattern.includes('.unit.')) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  // create separate test DB
  const testDatabaseUrl = await createTestDatabase(process.env.DATABASE_URL);

  // back up original database URL
  process.env.ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;
  process.env.DATABASE_URL = testDatabaseUrl;

  console.log('\\nDatabase migrations ran!');
}
`,
        [`import { createTestDatabase } from '%prisma-vitest/db'`],
        { importMappers: [{ getImportMap: () => importMap }] },
      ),
    ]);

    return {
      getProviders: () => ({
        prismaVitest: {
          getImportMap: () => importMap,
        },
      }),
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: 'db.vitest-helper.ts',
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
            source: 'prisma.vitest-helper.ts',
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
});

export default PrismaVitestGenerator;
