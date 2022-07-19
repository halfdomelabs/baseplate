import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
} from '@baseplate/sync';
import { z } from 'zod';
import { PrismaDataTransformerFactory } from '@src/providers/prisma/prisma-data-transformable';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
});

export interface PrismaCrudServiceSetupProvider {
  getModelName(): string;
  addTransformer(name: string, factory: PrismaDataTransformerFactory): void;
}

export const prismaCrudServiceSetupProvider =
  createProviderType<PrismaCrudServiceSetupProvider>(
    'prisma-crud-service-setup'
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
        generator: '@baseplate/fastify/prisma/prisma-crud-create',
        name: 'create',
        modelName,
      },
    },
    update: {
      defaultDescriptor: {
        generator: '@baseplate/fastify/prisma/prisma-crud-update',
        name: 'update',
        type: 'update',
        modelName,
      },
    },
    delete: {
      defaultDescriptor: {
        generator: '@baseplate/fastify/prisma/prisma-crud-delete',
        name: 'delete',
        modelName,
      },
    },
    transformers: { isMultiple: true },
  }),
  buildTasks(taskBuilder, { modelName }) {
    const setupTask = taskBuilder.addTask({
      name: 'setup',
      exports: { prismaCrudServiceSetup: prismaCrudServiceSetupProvider },
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
      exports: { prismaCrudService: prismaCrudServiceProvider },
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
