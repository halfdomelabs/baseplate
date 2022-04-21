import {
  createGeneratorWithChildren,
  createNonOverwriteableMap,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';
import { PrismaDataTransformerFactory } from '@src/providers/prisma/prisma-data-transformable';

const descriptorSchema = yup.object({
  modelName: yup.string().required(),
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

const PrismaCrudServiceGenerator = createGeneratorWithChildren({
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
  exports: {
    prismaCrudServiceSetup: prismaCrudServiceSetupProvider,
    prismaCrudService: prismaCrudServiceProvider
      .export()
      .dependsOn(prismaCrudServiceSetupProvider),
  },
  dependencies: {},
  createGenerator({ modelName }) {
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
        prismaCrudService: {
          getTransformerByName(name) {
            const transformer = transformers.get(name);
            if (!transformer) {
              throw new Error(`Transformer ${name} not found`);
            }
            return transformer;
          },
        },
      }),
      build: async () => {},
    };
  },
});

export default PrismaCrudServiceGenerator;
