import {
  ImportMapper,
  jestProvider,
  makeImportAndFilePath,
  nodeProvider,
  projectProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { fastifyJestProvider } from '../fastify-jest';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

export type PrismaJestProvider = ImportMapper;

export const prismaJestProvider =
  createProviderType<PrismaJestProvider>('prisma-jest');

const PrismaJestGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    jest: jestProvider,
    typescript: typescriptProvider,
    prismaOutput: prismaOutputProvider,
    project: projectProvider,
    // TOOD: Figure out how to order fastify jest block before prisma custom setup block
    fastifyJest: fastifyJestProvider,
  },
  exports: {
    prismaJest: prismaJestProvider,
  },
  createGenerator(
    descriptor,
    { node, jest, project, typescript, prismaOutput }
  ) {
    node.addDevPackages({
      'jest-mock-extended': '^2.0.6',
      'pg-connection-string': '^2.5.0',
    });

    const [dbHelperImport, dbHelperPath] = makeImportAndFilePath(
      'src/tests/helpers/db.test-helper.ts'
    );

    const [prismaHelperImport, prismaHelperPath] = makeImportAndFilePath(
      'src/tests/helpers/prisma.test-helper.ts'
    );

    const importMap = {
      '%prisma-jest/db': {
        path: dbHelperImport,
        allowedImports: ['createTestDatabase', 'destroyTestDatabase'],
      },
      '%prisma-jest/prisma': {
        path: prismaHelperImport,
        allowedImports: ['prismaMock'],
      },
    };

    jest.getConfig().appendUnique('customSetupBlocks', [
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
        [`import { createTestDatabase } from '%prisma-jest/db'`],
        { importMappers: [{ getImportMap: () => importMap }] }
      ),
    ]);

    return {
      getProviders: () => ({
        prismaJest: {
          getImportMap: () => importMap,
        },
      }),
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
          })
        );

        await builder.apply(
          typescript.createCopyAction({
            source: 'prisma.test-helper.ts',
            destination: prismaHelperPath,
            importMappers: [prismaOutput],
            replacements: {
              PRISMA_SERVICE_PATH: typescript.resolveModule(
                prismaOutput.getPrismaServicePath(),
                prismaHelperPath
              ),
            },
          })
        );
      },
    };
  },
});

export default PrismaJestGenerator;
