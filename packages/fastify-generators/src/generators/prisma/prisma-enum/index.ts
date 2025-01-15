import { createGenerator } from '@halfdomelabs/sync';
import { z } from 'zod';

import { prismaSchemaProvider } from '../prisma/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.object({ name: z.string().min(1) })),
});

export const prismaEnumGenerator = createGenerator({
  name: 'prisma/prisma-enum',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
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
