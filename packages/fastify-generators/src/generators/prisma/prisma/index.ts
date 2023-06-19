import { createRequire } from 'module';
import {
  copyTypescriptFileAction,
  ImportMapper,
  makeImportAndFilePath,
  nodeProvider,
  projectProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
} from '@halfdomelabs/sync';
import type { formatSchema } from '@prisma/internals';
import { z } from 'zod';
import { configServiceProvider } from '@src/generators/core/config-service/index.js';
import { fastifyOutputProvider } from '@src/generators/core/fastify/index.js';
import { fastifyHealthCheckProvider } from '@src/generators/core/fastify-health-check/index.js';
import { serviceContextProvider } from '@src/generators/core/service-context/index.js';
import {
  PrismaOutputEnum,
  PrismaOutputModel,
} from '@src/types/prismaOutput.js';
import { ServiceOutputEnum } from '@src/types/serviceOutput.js';
import { PrismaModelBlockWriter } from '@src/writers/prisma-schema/index.js';
import {
  createPrismaSchemaDatasourceBlock,
  createPrismaSchemaGeneratorBlock,
  PrismaSchemaFile,
} from '@src/writers/prisma-schema/schema.js';
import { PrismaGeneratorBlock } from '@src/writers/prisma-schema/types.js';

const descriptorSchema = z.object({
  defaultPort: z.number().default(5432),
  defaultDatabaseUrl: z.string().optional(),
});

export interface PrismaSchemaProvider {
  addPrismaGenerator(generator: PrismaGeneratorBlock): void;
  addPrismaModel(model: PrismaModelBlockWriter): void;
  addPrismaEnum(block: PrismaOutputEnum): void;
}

export const prismaSchemaProvider =
  createProviderType<PrismaSchemaProvider>('prisma-schema');

export interface PrismaOutputProvider extends ImportMapper {
  getPrismaServicePath(): string;
  getPrismaClient(): TypescriptCodeExpression;
  getPrismaModel(model: string): PrismaOutputModel;
  getServiceEnum(name: string): ServiceOutputEnum;
  getPrismaModelExpression(model: string): TypescriptCodeExpression;
  getModelTypeExpression(model: string): TypescriptCodeExpression;
}

export const prismaOutputProvider =
  createProviderType<PrismaOutputProvider>('prisma-output');

export type PrismaCrudServiceTypesProvider = ImportMapper;

export const prismaCrudServiceTypesProvider =
  createProviderType<PrismaCrudServiceTypesProvider>(
    'prisma-crud-service-types'
  );

const internalRequire = createRequire(import.meta.url);

const PrismaGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    const schemaTask = taskBuilder.addTask({
      name: 'schema',
      dependencies: {
        node: nodeProvider,
        configService: configServiceProvider,
        project: projectProvider,
        fastifyHealthCheck: fastifyHealthCheckProvider,
        fastifyOutput: fastifyOutputProvider,
        typescript: typescriptProvider,
      },
      exports: { prismaSchema: prismaSchemaProvider },
      run({
        node,
        configService,
        project,
        fastifyHealthCheck,
        fastifyOutput,
        typescript,
      }) {
        node.addDevPackages({
          prisma: '4.11.0',
        });

        node.addPackages({
          '@prisma/client': '4.11.0',
        });

        node.mergeExtraProperties({
          prisma: {
            seed: `ts-node ${fastifyOutput.getDevLoaderString()} src/prisma/seed.ts`,
          },
        });

        const schemaFile = new PrismaSchemaFile();

        schemaFile.addGeneratorBlock(
          createPrismaSchemaGeneratorBlock({
            name: 'client',
            provider: 'prisma-client-js',
          })
        );

        schemaFile.setDatasourceBlock(
          createPrismaSchemaDatasourceBlock({
            name: 'db',
            provider: 'postgresql',
            url: 'env("DATABASE_URL")',
          })
        );

        const defaultDatabaseUrl =
          descriptor.defaultDatabaseUrl ||
          `postgres://postgres:${project.getProjectName()}-password@localhost:${
            descriptor.defaultPort
          }/postgres?schema=public`;

        configService.getConfigEntries().set('DATABASE_URL', {
          comment: 'Connection URL of the database',
          value: TypescriptCodeUtils.createExpression('z.string().min(1)'),
          exampleValue: defaultDatabaseUrl,
        });

        fastifyHealthCheck.addCheck(
          TypescriptCodeUtils.createBlock(
            '// check Prisma is operating\nawait prisma.$queryRaw`SELECT 1;`;',
            "import { prisma } from '@/src/services/prisma'"
          )
        );

        return {
          getProviders: () => ({
            prismaSchema: {
              addPrismaGenerator: (generator) => {
                schemaFile.addGeneratorBlock(generator);
              },
              addPrismaModel: (model) => {
                schemaFile.addModelWriter(model);
              },
              addPrismaEnum: (block) => {
                schemaFile.addEnum(block);
              },
            },
          }),
          build: async (builder) => {
            const schemaText = schemaFile.toText();
            const { formatSchema: format } = internalRequire(
              '@prisma/internals'
            ) as { formatSchema: typeof formatSchema };
            const formattedSchemaText = await format({
              schema: schemaText,
            });
            builder.writeFile(
              'prisma/schema.prisma',
              `${formattedSchemaText.trimEnd()}\n`
            );

            builder.addPostWriteCommand('yarn prisma generate', {
              onlyIfChanged: ['prisma/schema.prisma'],
            });

            await builder.apply(
              copyTypescriptFileAction({
                source: 'services/prisma.ts',
                destination: 'src/services/prisma.ts',
              })
            );

            const seedFile = typescript.createTemplate({
              PRISMA_SERVICE: { type: 'code-expression' },
            });

            seedFile.addCodeEntries({
              PRISMA_SERVICE: TypescriptCodeUtils.createExpression(
                'prisma',
                "import { prisma } from '@/src/services/prisma'"
              ),
            });

            await builder.apply(
              seedFile.renderToAction('prisma/seed.ts', 'src/prisma/seed.ts', {
                neverOverwrite: true,
              })
            );

            return { schemaFile };
          },
        };
      },
    });

    taskBuilder.addTask({
      name: 'crud-service-types',
      dependencies: {
        typescript: typescriptProvider,
        serviceContext: serviceContextProvider,
      },
      exports: {
        prismaCrudServiceTypes: prismaCrudServiceTypesProvider,
      },
      run({ serviceContext, typescript }) {
        const [typesImport, typesPath] = makeImportAndFilePath(
          'src/types/crud-service-types.ts'
        );
        return {
          getProviders: () => ({
            prismaCrudServiceTypes: {
              getImportMap: () => ({
                '%prisma-crud-service-types': {
                  path: typesImport,
                  allowedImports: ['CreateServiceInput', 'UpdateServiceInput'],
                },
              }),
            },
          }),
          async build(builder) {
            await builder.apply(
              typescript.createCopyAction({
                source: 'types/crud-service-types.ts',
                destination: typesPath,
                importMappers: [serviceContext],
              })
            );
          },
        };
      },
    });

    taskBuilder.addTask({
      name: 'output',
      exports: { prismaOutput: prismaOutputProvider },
      taskDependencies: { schemaTask },
      run(deps, { schemaTask: { schemaFile } }) {
        return {
          getProviders: () => ({
            prismaOutput: {
              getImportMap: () => ({
                '%prisma-service': {
                  path: '@/src/services/prisma',
                  allowedImports: ['prisma'],
                },
              }),
              getPrismaServicePath: () => '@/src/services/prisma',
              getPrismaClient: () =>
                TypescriptCodeUtils.createExpression(
                  'prisma',
                  "import { prisma } from '@/src/services/prisma'"
                ),
              getPrismaModel: (modelName) => {
                const modelBlock = schemaFile.getModelBlock(modelName);
                if (!modelBlock) {
                  throw new Error(`Model ${modelName} not found`);
                }
                return modelBlock;
              },
              getServiceEnum: (name) => {
                const block = schemaFile.getEnum(name);
                if (!block) {
                  throw new Error(`Enum ${name} not found`);
                }
                return {
                  name: block.name,
                  values: block.values,
                  expression: TypescriptCodeUtils.createExpression(
                    block.name,
                    `import { ${block.name} } from '@prisma/client'`
                  ),
                };
              },
              getPrismaModelExpression: (modelName) => {
                const modelExport =
                  modelName.charAt(0).toLocaleLowerCase() + modelName.slice(1);
                return TypescriptCodeUtils.createExpression(
                  `prisma.${modelExport}`,
                  "import { prisma } from '@/src/services/prisma'"
                );
              },
              getModelTypeExpression: (modelName) =>
                TypescriptCodeUtils.createExpression(
                  modelName,
                  `import { ${modelName} } from '@prisma/client'`
                ),
            },
          }),
        };
      },
    });
  },
});

export default PrismaGenerator;
