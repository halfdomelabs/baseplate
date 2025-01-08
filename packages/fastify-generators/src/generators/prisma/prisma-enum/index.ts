import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';

import { prismaSchemaProvider } from '../prisma/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.object({ name: z.string().min(1) })),
});

const PrismaEnumGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prisma: prismaSchemaProvider,
  },
  createGenerator({ name, values }, { prisma }) {
    prisma.addPrismaEnum({
      name,
      values: values.map((v) => ({ name: v.name })),
    });

    return {
      getProviders: () => ({
        prismaEnum: {},
      }),
    };
  },
});

export default PrismaEnumGenerator;
