import type {
  ImportMapper,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';
import type { formatSchema } from '@prisma/internals';

import {
  extractPackageVersions,
  nodeProvider,
  projectProvider,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
  createReadOnlyProviderType,
  POST_WRITE_COMMAND_PRIORITY,
} from '@halfdomelabs/sync';
import { createRequire } from 'node:module';
import { z } from 'zod';

import type {
  PrismaOutputEnum,
  PrismaOutputModel,
} from '@src/types/prisma-output.js';
import type { ServiceOutputEnum } from '@src/types/service-output.js';
import type { PrismaModelBlockWriter } from '@src/writers/prisma-schema/index.js';
import type { PrismaGeneratorBlock } from '@src/writers/prisma-schema/types.js';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { configServiceProvider } from '@src/generators/core/config-service/config-service.generator.js';
import { fastifyHealthCheckConfigProvider } from '@src/generators/core/fastify-health-check/fastify-health-check.generator.js';
import { fastifyOutputProvider } from '@src/generators/core/fastify/fastify.generator.js';
import {
  createPrismaSchemaDatasourceBlock,
  createPrismaSchemaGeneratorBlock,
  PrismaSchemaFile,
} from '@src/writers/prisma-schema/schema.js';

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
  createReadOnlyProviderType<PrismaOutputProvider>('prisma-output');

export type PrismaCrudServiceTypesProvider = ImportMapper;

export const prismaCrudServiceTypesProvider =
  createProviderType<PrismaCrudServiceTypesProvider>(
    'prisma-crud-service-types',
  );

const internalRequire = createRequire(import.meta.url);

export const prismaGenerator = createGenerator({
  name: 'prisma/prisma',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    node: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        fastifyOutput: fastifyOutputProvider,
      },
      run({ node, fastifyOutput }) {
        node.packages.addPackages({
          prod: extractPackageVersions(FASTIFY_PACKAGES, ['@prisma/client']),
          dev: extractPackageVersions(FASTIFY_PACKAGES, ['prisma']),
        });
        // add prisma generate script to postinstall for pnpm (https://github.com/prisma/prisma/issues/6603)
        node.scripts.mergeObj({
          postinstall: 'prisma generate',
        });
        node.extraProperties.merge({
          prisma: {
            seed: `tsx ${fastifyOutput.getNodeFlagsDev('dev-env').join(' ')} src/prisma/seed.ts`,
          },
        });
      },
    }),
    schema: createGeneratorTask({
      dependencies: {
        configService: configServiceProvider,
        project: projectProvider,
        fastifyHealthCheckConfig: fastifyHealthCheckConfigProvider,
        typescript: typescriptProvider,
      },
      exports: { prismaSchema: prismaSchemaProvider.export(projectScope) },
      outputs: { prismaOutput: prismaOutputProvider.export(projectScope) },
      run({ configService, project, fastifyHealthCheckConfig, typescript }) {
        const schemaFile = new PrismaSchemaFile();

        schemaFile.addGeneratorBlock(
          createPrismaSchemaGeneratorBlock({
            name: 'client',
            provider: 'prisma-client-js',
          }),
        );

        schemaFile.setDatasourceBlock(
          createPrismaSchemaDatasourceBlock({
            name: 'db',
            provider: 'postgresql',
            url: 'env("DATABASE_URL")',
          }),
        );

        const defaultDatabaseUrl =
          descriptor.defaultDatabaseUrl ??
          `postgres://postgres:${project.getProjectName()}-password@localhost:${
            descriptor.defaultPort
          }/postgres?schema=public`;

        configService.configFields.set('DATABASE_URL', {
          comment: 'Connection URL of the database',
          validator: tsCodeFragment('z.string().min(1)'),
          exampleValue: defaultDatabaseUrl,
        });

        fastifyHealthCheckConfig.healthChecks.set(
          'prisma',
          tsCodeFragment(
            '// check Prisma is operating\nawait prisma.$queryRaw`SELECT 1;`;',
            tsImportBuilder(['prisma']).from('@/src/services/prisma.js'),
          ),
        );

        return {
          providers: {
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
          },
          build: async (builder) => {
            const schemaText = schemaFile.toText();
            const { formatSchema: format } = internalRequire(
              '@prisma/internals',
            ) as { formatSchema: typeof formatSchema };
            const [[, formattedSchemaText]] = await format({
              schemas: [['prisma/schema.prisma', schemaText]],
            });
            builder.writeFile({
              id: 'prisma-schema',
              destination: 'prisma/schema.prisma',
              contents: `${formattedSchemaText.trimEnd()}\n`,
            });

            builder.addPostWriteCommand('pnpm prisma generate', {
              priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
              onlyIfChanged: ['prisma/schema.prisma'],
            });

            await builder.apply(
              typescript.createCopyAction({
                source: 'services/prisma.ts',
                destination: 'src/services/prisma.ts',
              }),
            );

            const seedFile = typescript.createTemplate({
              PRISMA_SERVICE: { type: 'code-expression' },
            });

            seedFile.addCodeEntries({
              PRISMA_SERVICE: TypescriptCodeUtils.createExpression(
                'prisma',
                "import { prisma } from '@/src/services/prisma.js'",
              ),
            });

            await builder.apply(
              seedFile.renderToAction('prisma/seed.ts', 'src/prisma/seed.ts', {
                shouldNeverOverwrite: true,
              }),
            );

            return {
              prismaOutput: {
                getImportMap: () => ({
                  '%prisma-service': {
                    path: '@/src/services/prisma.js',
                    allowedImports: ['prisma'],
                  },
                }),
                getPrismaServicePath: () => '@/src/services/prisma.js',
                getPrismaClient: () =>
                  TypescriptCodeUtils.createExpression(
                    'prisma',
                    "import { prisma } from '@/src/services/prisma.js'",
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
                      `import { ${block.name} } from '@prisma/client'`,
                    ),
                  };
                },
                getPrismaModelExpression: (modelName) => {
                  const modelExport =
                    modelName.charAt(0).toLocaleLowerCase() +
                    modelName.slice(1);
                  return TypescriptCodeUtils.createExpression(
                    `prisma.${modelExport}`,
                    "import { prisma } from '@/src/services/prisma.js'",
                  );
                },
                getModelTypeExpression: (modelName) =>
                  TypescriptCodeUtils.createExpression(
                    modelName,
                    `import { ${modelName} } from '@prisma/client'`,
                  ),
              },
            };
          },
        };
      },
    }),
  }),
});
