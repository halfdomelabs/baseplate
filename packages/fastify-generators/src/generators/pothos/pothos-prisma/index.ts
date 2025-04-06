import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import {
  prismaOutputProvider,
  prismaSchemaProvider,
} from '@src/generators/prisma/prisma/index.js';
import { createPrismaSchemaGeneratorBlock } from '@src/writers/prisma-schema/index.js';

import { pothosSetupProvider } from '../pothos/index.js';

const descriptorSchema = z.object({});

export type PothosPrismaProvider = unknown;

export const pothosPrismaProvider =
  createProviderType<PothosPrismaProvider>('pothos-prisma');

export const pothosPrismaGenerator = createGenerator({
  name: 'pothos/pothos-prisma',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => [
    createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['@pothos/plugin-prisma']),
    }),
    createGeneratorTask({
      name: 'main',
      dependencies: {
        pothosSetup: pothosSetupProvider,
        prismaOutput: prismaOutputProvider,
      },
      exports: {
        pothosPrisma: pothosPrismaProvider.export(projectScope),
      },
      run({ pothosSetup, prismaOutput }) {
        return {
          providers: {
            pothosPrisma: {},
          },
          build: () => {
            pothosSetup
              .getConfig()
              .append(
                'pothosPlugins',
                TypescriptCodeUtils.createExpression(
                  `PrismaPlugin`,
                  `import PrismaPlugin from '@pothos/plugin-prisma';`,
                ),
              )
              .append('schemaTypeOptions', {
                key: 'PrismaTypes',
                value: TypescriptCodeUtils.createExpression(
                  `PrismaTypes`,
                  `import type PrismaTypes from '@pothos/plugin-prisma/generated';`,
                ),
              })
              .append('schemaBuilderOptions', {
                key: 'prisma',
                value: TypescriptCodeUtils.createExpression(
                  `{
                client: prisma,
                exposeDescriptions: false,
                filterConnectionTotalCount: true,
              }`,
                  'import { prisma } from "%prisma-service"',
                  { importMappers: [prismaOutput] },
                ),
              });
          },
        };
      },
    }),
    createGeneratorTask({
      name: 'prisma-generator',
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
  ],
});
