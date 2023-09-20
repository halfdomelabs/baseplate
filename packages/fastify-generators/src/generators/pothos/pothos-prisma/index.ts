import {
  nodeProvider,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
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
    pothosPrisma: pothosPrismaProvider,
  },
  run({ node, pothosSetup, prismaOutput }) {
    return {
      getProviders: () => ({
        pothosPrisma: {},
      }),
      build: () => {
        node.addPackages({ '@pothos/plugin-prisma': '3.52.0' });

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

const PothosPrismaGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
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

export default PothosPrismaGenerator;
