import { createGeneratorWithTasks } from '@halfdomelabs/sync';
import { z } from 'zod';

import { prismaSchemaProvider } from '../prisma/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.object({ name: z.string().min(1) })),
});

const PrismaEnumGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, { name, values }) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        prisma: prismaSchemaProvider,
      },
      run({ prisma }) {
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
  },
});

export default PrismaEnumGenerator;
