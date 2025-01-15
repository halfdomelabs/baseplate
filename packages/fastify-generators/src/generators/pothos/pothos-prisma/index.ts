import {
  nodeProvider,
  projectScope,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

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

const createMainTask = createTaskConfigBuilder(() => ({
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
          '@pothos/plugin-prisma': '4.3.1',
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
}));

export const pothosPrismaGenerator = createGenerator({
  name: 'pothos/pothos-prisma',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));

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
