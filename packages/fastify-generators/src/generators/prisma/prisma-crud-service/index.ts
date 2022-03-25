import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';

const descriptorSchema = yup.object({
  modelName: yup.string().required(),
});

const PrismaCrudServiceGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: ({ modelName }) => ({
    create: {
      defaultDescriptor: {
        generator: '@baseplate/fastify/prisma/prisma-crud-method',
        name: 'create',
        type: 'create',
        modelName,
      },
    },
    update: {
      defaultDescriptor: {
        generator: '@baseplate/fastify/prisma/prisma-crud-method',
        name: 'update',
        type: 'update',
        modelName,
      },
    },
    delete: {
      defaultDescriptor: {
        generator: '@baseplate/fastify/prisma/prisma-crud-method',
        name: 'delete',
        type: 'delete',
        modelName,
      },
    },
  }),
  dependencies: {},
  createGenerator() {
    return {
      getProviders: () => ({}),
      build: async () => {},
    };
  },
});

export default PrismaCrudServiceGenerator;
