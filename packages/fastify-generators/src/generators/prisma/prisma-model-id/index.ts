import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';
import { prismaModelProvider } from '../prisma-model';

const descriptorSchema = z.object({
  fields: z.array(z.string().min(1)),
});

const PrismaModelIdGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaModel: prismaModelProvider,
  },
  createGenerator({ fields }, { prismaModel }) {
    prismaModel.addModelAttribute({
      name: '@@id',
      args: [fields],
    });
    return {
      build: async () => {},
    };
  },
});

export default PrismaModelIdGenerator;
