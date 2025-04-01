import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { prismaModelProvider } from '../prisma-model/index.js';

const descriptorSchema = z.object({
  fields: z.array(z.string().min(1)),
});

export const prismaModelIdGenerator = createGenerator({
  name: 'prisma/prisma-model-id',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ fields }) => [
    createGeneratorTask({
      name: 'main',
      dependencies: {
        prismaModel: prismaModelProvider,
      },
      run({ prismaModel }) {
        prismaModel.addModelAttribute({
          name: '@@id',
          args: [fields],
        });
        return {};
      },
    }),
  ],
});
