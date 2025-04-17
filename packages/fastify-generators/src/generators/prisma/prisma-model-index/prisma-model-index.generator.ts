import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { prismaModelProvider } from '../prisma-model/prisma-model.generator.js';

const descriptorSchema = z.object({
  fields: z.array(z.string().min(1)),
});

export const prismaModelIndexGenerator = createGenerator({
  name: 'prisma/prisma-model-index',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ fields }) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaModel: prismaModelProvider,
      },
      run({ prismaModel }) {
        prismaModel.addModelAttribute({
          name: 'index',
          args: [fields],
        });
        return {};
      },
    }),
  }),
});
