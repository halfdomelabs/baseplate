import {
  createNodePackagesTask,
  extractPackageVersions,
  packageScope,
  tsCodeFragment,
  tsImportBuilder,
  tsTemplate,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { doubleQuot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { configServiceImportsProvider } from '#src/generators/core/index.js';
import {
  prismaImportsProvider,
  prismaSchemaProvider,
} from '#src/generators/prisma/prisma/index.js';
import { createPrismaSchemaGeneratorBlock } from '#src/writers/prisma-schema/index.js';

import { pothosConfigProvider } from '../pothos/index.js';
import { POTHOS_POTHOS_PRISMA_GENERATED } from './generated/index.js';
import { pothosPrismaImportsProvider } from './generated/ts-import-providers.js';

const descriptorSchema = z.object({});

export type PothosPrismaProvider = unknown;

export const pothosPrismaProvider =
  createProviderType<PothosPrismaProvider>('pothos-prisma');

export const pothosPrismaGenerator = createGenerator({
  name: 'pothos/pothos-prisma',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: POTHOS_POTHOS_PRISMA_GENERATED.paths.task,
    imports: POTHOS_POTHOS_PRISMA_GENERATED.imports.task,
    renderers: POTHOS_POTHOS_PRISMA_GENERATED.renderers.task,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['@pothos/plugin-prisma']),
    }),
    main: createGeneratorTask({
      dependencies: {
        pothosConfig: pothosConfigProvider,
        prismaImports: prismaImportsProvider,
        pothosPrismaImports: pothosPrismaImportsProvider,
        renderers: POTHOS_POTHOS_PRISMA_GENERATED.renderers.provider,
        configServiceImports: configServiceImportsProvider,
      },
      exports: {
        pothosPrisma: pothosPrismaProvider.export(packageScope),
      },
      run({
        pothosConfig,
        prismaImports,
        pothosPrismaImports,
        renderers,
        configServiceImports,
      }) {
        return {
          providers: {
            pothosPrisma: {},
          },
          build: async (builder) => {
            pothosConfig.pothosPlugins.set(
              'PrismaPlugin',
              tsCodeFragment(
                'PrismaPlugin',
                tsImportBuilder()
                  .default('PrismaPlugin')
                  .from('@pothos/plugin-prisma'),
              ),
            );
            pothosConfig.schemaTypeOptions.set(
              'PrismaTypes',
              pothosPrismaImports.PrismaTypes.typeFragment(),
            );
            pothosConfig.schemaBuilderOptions.set(
              'prisma',
              tsTemplate`{
                client: ${prismaImports.prisma.fragment()},
                dmmf: ${pothosPrismaImports.getDatamodel.fragment()}(),
                exposeDescriptions: false,
                filterConnectionTotalCount: true,
                onUnusedQuery: ${configServiceImports.config.fragment()}.APP_ENVIRONMENT === 'dev' ? 'warn' : null,
              }`,
            );
            await builder.apply(renderers.pothosPrismaTypes.render({}));
          },
        };
      },
    }),
    prismaGenerator: createGeneratorTask({
      dependencies: {
        prismaSchema: prismaSchemaProvider,
      },
      run({ prismaSchema }) {
        prismaSchema.addPrismaGenerator(
          createPrismaSchemaGeneratorBlock({
            name: 'pothos',
            provider: 'pnpm prisma-pothos-types',
            additionalOptions: {
              clientOutput: doubleQuot('./client.js'),
              output: doubleQuot(
                '../src/generated/prisma/pothos-prisma-types.ts',
              ),
            },
          }),
        );
        return {};
      },
    }),
  }),
});
