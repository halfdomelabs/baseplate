import { createGeneratorWithTasks } from '@halfdomelabs/sync';
import { z } from 'zod';

import { prismaModelProvider } from '../prisma-model/index.js';

const descriptorSchema = z.object({
  fields: z.array(
    z.object({
      name: z.string().min(1),
    }),
  ),
});

const PrismaModelUniqueGenerator = createGeneratorWithTasks({
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
          name: '@@unique',
          args: [fields.map(({ name }) => name)],
        });
        return {};
      },
    });
  },
});

export default PrismaModelUniqueGenerator;
