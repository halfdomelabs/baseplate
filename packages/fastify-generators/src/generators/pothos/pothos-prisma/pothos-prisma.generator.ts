import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  tsTemplate,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import {
  prismaImportsProvider,
  prismaSchemaProvider,
} from '#src/generators/prisma/prisma/index.js';
import { createPrismaSchemaGeneratorBlock } from '#src/writers/prisma-schema/index.js';

import { pothosConfigProvider } from '../pothos/index.js';

const descriptorSchema = z.object({});

export type PothosPrismaProvider = unknown;

export const pothosPrismaProvider =
  createProviderType<PothosPrismaProvider>('pothos-prisma');

export const pothosPrismaGenerator = createGenerator({
  name: 'pothos/pothos-prisma',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['@pothos/plugin-prisma']),
    }),
    main: createGeneratorTask({
      dependencies: {
        pothosConfig: pothosConfigProvider,
        prismaImports: prismaImportsProvider,
      },
      exports: {
        pothosPrisma: pothosPrismaProvider.export(projectScope),
      },
      run({ pothosConfig, prismaImports }) {
        return {
          providers: {
            pothosPrisma: {},
          },
          build: () => {
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
              tsCodeFragment(
                'PrismaTypes',
                tsImportBuilder()
                  .default('PrismaTypes')
                  .typeOnly()
                  .from('@pothos/plugin-prisma/generated'),
              ),
            );
            pothosConfig.schemaBuilderOptions.set(
              'prisma',
              tsTemplate`{
                client: ${prismaImports.prisma.fragment()},
                exposeDescriptions: false,
                filterConnectionTotalCount: true,
              }`,
            );
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
          }),
        );
        return {};
      },
    }),
  }),
});
