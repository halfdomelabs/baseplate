import { createGeneratorWithTasks } from '@baseplate/sync';
import { z } from 'zod';
import { createPothosTypesFileTask } from '../pothos-types-file';

const descriptorSchema = z.object({
  name: z.string().min(1),
  modelName: z.string().min(1),
});

const PothosPrismaQueryFileGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: (descriptor) => {
    const sharedValues = {
      modelName: descriptor.modelName,
    };
    return {
      findQuery: {
        defaultDescriptor: {
          ...sharedValues,
          generator: '@baseplate/fastify/pothos/pothos-prisma-find-query',
        },
        defaultToNullIfEmpty: true,
      },
      listQuery: {
        defaultDescriptor: {
          ...sharedValues,
          generator: '@baseplate/fastify/pothos/pothos-prisma-list-query',
        },
        defaultToNullIfEmpty: true,
      },
    };
  },
  buildTasks(taskBuilder, { name }) {
    taskBuilder.addTask(
      createPothosTypesFileTask({
        name,
        categoryOrder: ['find-query', 'list-query'],
      })
    );
  },
});

export default PothosPrismaQueryFileGenerator;
