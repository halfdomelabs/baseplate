import {
  nodeProvider,
  projectScope,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import { createGenerator, createProviderType } from '@halfdomelabs/sync';
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
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        pothosSetup: pothosSetupProvider,
        prismaOutput: prismaOutputProvider,
      },
      exports: {
        pothosPrisma: pothosPrismaProvider.export(projectScope),
      },
      run({ node, pothosSetup, prismaOutput }) {
        return {
          providers: {
            pothosPrisma: {},
          },
          build: () => {
            node.addPackages({
              '@pothos/plugin-prisma':
                FASTIFY_PACKAGES['@pothos/plugin-prisma'],
            });

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
    });

    taskBuilder.addTask({
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
    });
  },
});
