import { createGeneratorWithTasks } from '@halfdomelabs/sync';
import { z } from 'zod';
import { createPothosTypesFileTask } from '../pothos-types-file';

const descriptorSchema = z.object({
  fileName: z.string().min(1),
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
          generator: '@halfdomelabs/fastify/pothos/pothos-prisma-find-query',
        },
        defaultToNullIfEmpty: true,
      },
      listQuery: {
        defaultDescriptor: {
          ...sharedValues,
          generator: '@halfdomelabs/fastify/pothos/pothos-prisma-list-query',
        },
        defaultToNullIfEmpty: true,
      },
    };
  },
  buildTasks(taskBuilder, { fileName }) {
    taskBuilder.addTask(
      createPothosTypesFileTask({
        fileName,
        categoryOrder: ['find-query', 'list-query'],
      })
    );
  },
});

export default PothosPrismaQueryFileGenerator;
