import { nodeProvider, TypescriptCodeUtils } from '@baseplate/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@baseplate/sync';
import { z } from 'zod';
import {
  prismaOutputProvider,
  prismaSchemaProvider,
} from '@src/generators/prisma/prisma';
import { createPrismaSchemaGeneratorBlock } from '@src/writers/prisma-schema';
import { pothosSetupProvider } from '../pothos';

const descriptorSchema = z.object({});

type Descriptor = z.infer<typeof descriptorSchema>;

export type PothosPrismaProvider = unknown;

export const pothosPrismaProvider =
  createProviderType<PothosPrismaProvider>('pothos-prisma');

const createMainTask = createTaskConfigBuilder((descriptor: Descriptor) => ({
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
        node.addPackages({ '@pothos/plugin-prisma': '3.40.1' });

        pothosSetup
          .getConfig()
          .append(
            'pothosPlugins',
            TypescriptCodeUtils.createExpression(
              `PrismaPlugin`,
              `import PrismaPlugin from '@pothos/plugin-prisma';`
            )
          )
          .append('schemaTypeOptions', {
            key: 'PrismaTypes',
            value: TypescriptCodeUtils.createExpression(
              `PrismaTypes`,
              `import type PrismaTypes from '@pothos/plugin-prisma/generated';`
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
              { importMappers: [prismaOutput] }
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
            provider: 'prisma-pothos-types',
          })
        );
        return {};
      },
    });
  },
});

export default PothosPrismaGenerator;
