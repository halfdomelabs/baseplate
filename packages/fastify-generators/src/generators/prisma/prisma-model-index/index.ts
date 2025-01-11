import { createGeneratorWithTasks } from '@halfdomelabs/sync';
import { z } from 'zod';

import { prismaModelProvider } from '../prisma-model/index.js';

const descriptorSchema = z.object({
  fields: z.array(z.string().min(1)),
});

const PrismaModelIndexGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, { fields }) {
    taskBuilder.addTask({
      name: 'main',
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
    });
  },
});

export default PrismaModelIndexGenerator;
