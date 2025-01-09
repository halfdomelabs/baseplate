import { projectScope } from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import type { PrismaDataTransformerFactory } from '@src/providers/prisma/prisma-data-transformable.js';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
});

export interface PrismaCrudServiceSetupProvider {
  getModelName(): string;
  addTransformer(name: string, factory: PrismaDataTransformerFactory): void;
}

export const prismaCrudServiceSetupProvider =
  createProviderType<PrismaCrudServiceSetupProvider>(
    'prisma-crud-service-setup',
  );

export interface PrismaCrudServiceProvider {
  getTransformerByName(name: string): PrismaDataTransformerFactory;
}

export const prismaCrudServiceProvider =
  createProviderType<PrismaCrudServiceProvider>('prisma-crud-service');

const PrismaCrudServiceGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: ({ modelName }) => ({
    create: {
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/prisma/prisma-crud-create',
        name: 'create',
        modelName,
      },
    },
    update: {
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/prisma/prisma-crud-update',
        name: 'update',
        type: 'update',
        modelName,
      },
    },
    delete: {
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/prisma/prisma-crud-delete',
        name: 'delete',
        modelName,
      },
    },
    transformers: { isMultiple: true },
  }),
  buildTasks(taskBuilder, { modelName }) {
    const setupTask = taskBuilder.addTask({
      name: 'setup',
      exports: {
        prismaCrudServiceSetup: prismaCrudServiceSetupProvider.export(),
      },
      run() {
        const transformers = createNonOverwriteableMap<
          Record<string, PrismaDataTransformerFactory>
        >({});

        return {
          getProviders: () => ({
            prismaCrudServiceSetup: {
              getModelName() {
                return modelName;
              },
              addTransformer(name, transformer) {
                transformers.set(name, transformer);
              },
            },
          }),
          build: () => ({ transformers }),
        };
      },
    });

    taskBuilder.addTask({
      name: 'main',
      taskDependencies: { setupTask },
      exports: {
        prismaCrudService: prismaCrudServiceProvider
          // export to children and project under model name
          .export()
          .andExport(projectScope, modelName),
      },
      run(deps, { setupTask: { transformers } }) {
        return {
          getProviders() {
            return {
              prismaCrudService: {
                getTransformerByName(name) {
                  const transformer = transformers.get(name);
                  if (!transformer) {
                    throw new Error(`Transformer ${name} not found`);
                  }
                  return transformer;
                },
              },
            };
          },
        };
      },
    });
  },
});

export default PrismaCrudServiceGenerator;
