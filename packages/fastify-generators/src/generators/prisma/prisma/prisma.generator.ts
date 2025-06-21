import type { TsCodeFragment } from '@baseplate-dev/core-generators';
import type { formatSchema } from '@prisma/internals';

import {
  extractPackageVersions,
  nodeProvider,
  normalizeTsPathToJsPath,
  packageInfoProvider,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  tsTemplate,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
  createReadOnlyProviderType,
  POST_WRITE_COMMAND_PRIORITY,
} from '@baseplate-dev/sync';
import { createRequire } from 'node:module';
import { z } from 'zod';

import type {
  PrismaOutputEnum,
  PrismaOutputModel,
} from '#src/types/prisma-output.js';
import type { ServiceOutputEnum } from '#src/types/service-output.js';
import type { PrismaModelBlockWriter } from '#src/writers/prisma-schema/index.js';
import type { PrismaGeneratorBlock } from '#src/writers/prisma-schema/types.js';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { configServiceProvider } from '#src/generators/core/config-service/index.js';
import { fastifyHealthCheckConfigProvider } from '#src/generators/core/fastify-health-check/index.js';
import { fastifyOutputProvider } from '#src/generators/core/fastify/index.js';
import {
  createPrismaSchemaDatasourceBlock,
  createPrismaSchemaGeneratorBlock,
  PrismaSchemaFile,
} from '#src/writers/prisma-schema/schema.js';

import { PRISMA_PRISMA_GENERATED } from './generated/index.js';
import { prismaImportsProvider } from './generated/ts-import-providers.js';

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

export interface PrismaOutputProvider {
  getPrismaServicePath(): string;
  getPrismaModel(model: string): PrismaOutputModel;
  getServiceEnum(name: string): ServiceOutputEnum;
  getPrismaModelFragment(model: string): TsCodeFragment;
  getModelTypeFragment(model: string): TsCodeFragment;
}

export const prismaOutputProvider =
  createReadOnlyProviderType<PrismaOutputProvider>('prisma-output');

const internalRequire = createRequire(import.meta.url);

export const prismaGenerator = createGenerator({
  name: 'prisma/prisma',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    paths: PRISMA_PRISMA_GENERATED.paths.task,
    imports: PRISMA_PRISMA_GENERATED.imports.task,
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
    configService: createGeneratorTask({
      dependencies: {
        configService: configServiceProvider,
        packageInfo: packageInfoProvider,
      },
      run({ configService, packageInfo }) {
        const defaultDatabaseUrl =
          descriptor.defaultDatabaseUrl ??
          `postgres://postgres:${packageInfo.getPackageName()}-password@localhost:${
            descriptor.defaultPort
          }/postgres?schema=public`;

        configService.configFields.set('DATABASE_URL', {
          comment: 'Connection URL of the database',
          validator: tsCodeFragment('z.string().min(1)'),
          exampleValue: defaultDatabaseUrl,
        });
      },
    }),
    service: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        paths: PRISMA_PRISMA_GENERATED.paths.provider,
      },
      run({ typescriptFile, paths }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: PRISMA_PRISMA_GENERATED.templates.service,
                destination: paths.service,
              }),
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: PRISMA_PRISMA_GENERATED.templates.seed,
                destination: paths.seed,
                writeOptions: {
                  shouldNeverOverwrite: true,
                },
              }),
            );
          },
        };
      },
    }),
    fastifyHealthCheckConfig: createGeneratorTask({
      dependencies: {
        fastifyHealthCheckConfig: fastifyHealthCheckConfigProvider,
        prismaImports: prismaImportsProvider,
      },
      run({ fastifyHealthCheckConfig, prismaImports }) {
        fastifyHealthCheckConfig.healthChecks.set(
          'prisma',
          tsCodeFragment(
            '// check Prisma is operating\nawait prisma.$queryRaw`SELECT 1;`;',
            prismaImports.prisma.declaration(),
          ),
        );
      },
    }),
    schema: createGeneratorTask({
      dependencies: {
        prismaImports: prismaImportsProvider,
        paths: PRISMA_PRISMA_GENERATED.paths.provider,
      },
      exports: { prismaSchema: prismaSchemaProvider.export(packageScope) },
      outputs: { prismaOutput: prismaOutputProvider.export(packageScope) },
      run({ prismaImports, paths }) {
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

            return {
              prismaOutput: {
                getPrismaServicePath: () =>
                  normalizeTsPathToJsPath(paths.service),
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
                    expression: TsCodeUtils.importFragment(
                      block.name,
                      '@prisma/client',
                    ),
                  };
                },
                getPrismaModelFragment: (modelName) => {
                  const modelExport =
                    modelName.charAt(0).toLocaleLowerCase() +
                    modelName.slice(1);
                  return tsTemplate`${prismaImports.prisma.fragment()}.${modelExport}`;
                },
                getModelTypeFragment: (modelName) =>
                  TsCodeUtils.typeImportFragment(modelName, '@prisma/client'),
              },
            };
          },
        };
      },
    }),
  }),
});
