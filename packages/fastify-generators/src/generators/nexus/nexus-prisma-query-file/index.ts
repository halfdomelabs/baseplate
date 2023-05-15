import { createGeneratorWithTasks } from '@halfdomelabs/sync';
import { z } from 'zod';
import { createNexusTypesFileTask } from '../nexus-types-file';

const descriptorSchema = z.object({
  name: z.string().min(1),
  modelName: z.string().min(1),
});

const NexusPrismaQueryFileGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: (descriptor) => {
    const sharedValues = {
      modelName: descriptor.modelName,
    };
    return {
      objectType: {
        defaultDescriptor: {
          ...sharedValues,
          generator: '@halfdomelabs/fastify/nexus/nexus-prisma-object',
        },
        defaultToNullIfEmpty: true,
      },
      findQuery: {
        defaultDescriptor: {
          ...sharedValues,
          generator: '@halfdomelabs/fastify/nexus/nexus-prisma-find-query',
        },
        defaultToNullIfEmpty: true,
      },
      listQuery: {
        defaultDescriptor: {
          ...sharedValues,
          generator: '@halfdomelabs/fastify/nexus/nexus-prisma-list-query',
        },
        defaultToNullIfEmpty: true,
      },
    };
  },
  buildTasks(taskBuilder, { name }) {
    taskBuilder.addTask(
      createNexusTypesFileTask({
        name,
        categoryOrder: ['object-type', 'find-query', 'list-query'],
      })
    );
  },
});

export default NexusPrismaQueryFileGenerator;
