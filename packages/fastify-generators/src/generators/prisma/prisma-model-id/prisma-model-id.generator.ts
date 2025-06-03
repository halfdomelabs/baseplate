import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { prismaModelProvider } from '../prisma-model/prisma-model.generator.js';

const descriptorSchema = z.object({
  fields: z.array(z.string().min(1)),
});

export const prismaModelIdGenerator = createGenerator({
  name: 'prisma/prisma-model-id',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ fields }) => ({
    main: createGeneratorTask({
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
  }),
});
