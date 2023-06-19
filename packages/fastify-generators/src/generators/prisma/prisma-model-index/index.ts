import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';
import { prismaModelProvider } from '../prisma-model/index.js';

const descriptorSchema = z.object({
  fields: z.array(z.string().min(1)),
});

const PrismaModelIndexGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaModel: prismaModelProvider,
  },
  createGenerator({ fields }, { prismaModel }) {
    prismaModel.addModelAttribute({
      name: 'index',
      args: [fields],
    });
    return {
      build: async () => {},
    };
  },
});

export default PrismaModelIndexGenerator;
