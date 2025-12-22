import type { TsCodeFragment } from '@baseplate-dev/core-generators';
import type { formatSchema } from '@prisma/internals';

import {
  eslintConfigProvider,
  extractPackageVersions,
  nodeGitIgnoreProvider,
  nodeProvider,
  normalizeTsPathToJsPath,
  packageInfoProvider,
  packageScope,
  prettierProvider,
  tsCodeFragment,
  TsCodeUtils,
  tsTemplate,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
  createReadOnlyProviderType,
  POST_WRITE_COMMAND_PRIORITY,
} from '@baseplate-dev/sync';
import { doubleQuot, quot } from '@baseplate-dev/utils';
import { sortBy } from 'es-toolkit';
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

import { prismaGeneratedImportsProvider } from '../_providers/prisma-generated-imports.js';
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

interface PrismaSeedEnvField {
  name: string;
  exampleValue: string;
}

export interface PrismaSeedProvider {
  getSeedDirectory(): string;
  addSeedEnvField(field: PrismaSeedEnvField): void;
  addSeedFragment(name: string, fragment: TsCodeFragment): void;
}

export const prismaSeedProvider =
  createProviderType<PrismaSeedProvider>('prisma-seed');

const internalRequire = createRequire(import.meta.url);

export const prismaGenerator = createGenerator({
  name: 'prisma/prisma',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    paths: PRISMA_PRISMA_GENERATED.paths.task,
    imports: PRISMA_PRISMA_GENERATED.imports.task,
    renderers: PRISMA_PRISMA_GENERATED.renderers.task,
    node: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
      },
      run({ node }) {
        node.packages.addPackages({
          prod: extractPackageVersions(FASTIFY_PACKAGES, [
            '@prisma/client',
            '@prisma/adapter-pg',
          ]),
          dev: extractPackageVersions(FASTIFY_PACKAGES, ['prisma']),
        });
        // add prisma generate script to postinstall for pnpm (https://github.com/prisma/prisma/issues/6603)
        node.scripts.mergeObj({
          postinstall: 'prisma generate',
        });
      },
    }),
    eslint: createGeneratorTask({
      dependencies: {
        eslintConfig: eslintConfigProvider,
        prettier: prettierProvider,
      },
      run({ eslintConfig, prettier }) {
        eslintConfig.tsDefaultProjectFiles.push('prisma.config.mts');
        eslintConfig.eslintIgnore.push('src/generated/prisma/**/*.ts');
        prettier.addPrettierIgnore('src/generated/prisma/**/*.ts');
      },
    }),
    seed: createGeneratorTask({
      dependencies: {
        fastifyOutput: fastifyOutputProvider,
        renderers: PRISMA_PRISMA_GENERATED.renderers.provider,
      },
      exports: {
        prismaSeed: prismaSeedProvider.export(packageScope),
      },
      run({ fastifyOutput, renderers }) {
        const seedEnvFields = new Map<string, PrismaSeedEnvField>();
        const seedFragments = new Map<string, TsCodeFragment>();

        return {
          providers: {
            prismaSeed: {
              getSeedDirectory: () => `@/src/prisma`,
              addSeedEnvField: (field) => {
                if (seedEnvFields.has(field.name)) {
                  throw new Error(
                    `Seed env field ${field.name} already exists`,
                  );
                }
                seedEnvFields.set(field.name, field);
              },
              addSeedFragment: (name, fragment) => {
                if (seedFragments.has(name)) {
                  throw new Error(`Seed fragment ${name} already exists`);
                }
                seedFragments.set(name, fragment);
              },
            },
          },
          build: async (builder) => {
            if (seedEnvFields.size > 0) {
              const envFileContents = sortBy(
                [...seedEnvFields],
                [([key]) => key],
              )
                .map(([key, field]) => `${key}=${field.exampleValue}`)
                .join('\n');
              builder.writeFile({
                id: 'prisma-seed-env',
                destination: '.seed.env',
                contents: envFileContents,
                options: {
                  shouldNeverOverwrite: true,
                },
              });
              builder.writeFile({
                id: 'prisma-seed-env-example',
                destination: '.seed.env.example',
                contents: envFileContents,
              });
            }

            await builder.apply(
              renderers.seed.render({
                variables: {
                  TPL_SEED_BODY: TsCodeUtils.mergeFragments(seedFragments),
                },
              }),
            );

            await builder.apply(
              renderers.prismaConfig.render({
                variables: {
                  TPL_SEED_COMMAND: quot(
                    `tsx ${fastifyOutput.getNodeFlagsDev('dev-env').join(' ')} --env-file-if-exists=.seed.env src/prisma/seed.ts`,
                  ),
                },
              }),
            );
          },
        };
      },
    }),
    gitignore: createGeneratorTask({
      dependencies: {
        nodeGitIgnore: nodeGitIgnoreProvider,
      },
      run({ nodeGitIgnore }) {
        return {
          build: (builder) => {
            nodeGitIgnore.exclusions.set('prisma', [
              '# Prisma generated files',
              'src/generated/prisma/*',
              ...(builder.metadataOptions.includeTemplateMetadata
                ? [
                    '!src/generated/prisma/client.ts',
                    '!src/generated/prisma/.templates-info.json',
                  ]
                : []),
            ]);
          },
        };
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
        renderers: PRISMA_PRISMA_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.generatedGroup.render({}));
            await builder.apply(renderers.service.render({}));
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
        prismaGeneratedImports: prismaGeneratedImportsProvider,
        paths: PRISMA_PRISMA_GENERATED.paths.provider,
      },
      exports: { prismaSchema: prismaSchemaProvider.export(packageScope) },
      outputs: { prismaOutput: prismaOutputProvider.export(packageScope) },
      run({ prismaImports, paths, prismaGeneratedImports }) {
        const schemaFile = new PrismaSchemaFile();

        schemaFile.addGeneratorBlock(
          createPrismaSchemaGeneratorBlock({
            name: 'client',
            provider: 'prisma-client',
            additionalOptions: {
              output: doubleQuot('../src/generated/prisma'),
              engineType: doubleQuot('client'),
            },
          }),
        );

        schemaFile.setDatasourceBlock(
          createPrismaSchemaDatasourceBlock({
            name: 'db',
            provider: 'postgresql',
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
                      prismaGeneratedImports['*'].moduleSpecifier,
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
                  TsCodeUtils.typeImportFragment(
                    modelName,
                    prismaGeneratedImports['*'].moduleSpecifier,
                  ),
              },
            };
          },
        };
      },
    }),
  }),
});
