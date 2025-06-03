import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { prismaSchemaProvider } from '../prisma/prisma.generator.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.object({ name: z.string().min(1) })),
});

export const prismaEnumGenerator = createGenerator({
  name: 'prisma/prisma-enum',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.name,
  buildTasks: ({ name, values }) => ({
    main: createGeneratorTask({
      dependencies: {
        prisma: prismaSchemaProvider,
      },
      run({ prisma }) {
        prisma.addPrismaEnum({
          name,
          values: values.map((v) => ({ name: v.name })),
        });

        return {};
      },
    }),
  }),
});
