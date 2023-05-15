import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';
import { prismaModelProvider } from '../prisma-model';

const descriptorSchema = z.object({
  fields: z.array(
    z.object({
      name: z.string().min(1),
    })
  ),
});

const PrismaModelUniqueGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaModel: prismaModelProvider,
  },
  createGenerator({ fields }, { prismaModel }) {
    prismaModel.addModelAttribute({
      name: '@@unique',
      args: [fields.map(({ name }) => name)],
    });
    return {
      build: async () => {},
    };
  },
});

export default PrismaModelUniqueGenerator;
