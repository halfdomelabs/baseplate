import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { prismaModelProvider } from '../prisma-model/index.js';

const descriptorSchema = z.object({
  fields: z.array(
    z.object({
      name: z.string().min(1),
    }),
  ),
});

export const prismaModelUniqueGenerator = createGenerator({
  name: 'prisma/prisma-model-unique',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) =>
    descriptor.fields.map(({ name }) => name).join('_'),
  buildTasks: ({ fields }) => [
    createGeneratorTask({
      name: 'main',
      dependencies: {
        prismaModel: prismaModelProvider,
      },
      run({ prismaModel }) {
        prismaModel.addModelAttribute({
          name: '@@unique',
          args: [fields.map(({ name }) => name)],
        });
        return {};
      },
    }),
  ],
});
