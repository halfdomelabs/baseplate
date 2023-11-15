import { createGeneratorWithTasks } from '@halfdomelabs/sync';
import { z } from 'zod';

import { createNexusTypesFileTask } from '../nexus-types-file/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  modelName: z.string().min(1),
  crudServiceRef: z.string().min(1),
});

const NexusPrismaCrudFileGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: (descriptor) => {
    const sharedValues = {
      generator: '@halfdomelabs/fastify/nexus/nexus-prisma-crud-mutation',
      modelName: descriptor.modelName,
      crudServiceRef: descriptor.crudServiceRef,
    };
    return {
      create: {
        defaultDescriptor: {
          ...sharedValues,
          type: 'create',
        },
      },
      update: {
        defaultDescriptor: {
          ...sharedValues,
          type: 'update',
        },
      },
      delete: {
        defaultDescriptor: {
          ...sharedValues,
          type: 'delete',
        },
      },
    };
  },
  buildTasks(taskBuilder, { name }) {
    taskBuilder.addTask(
      createNexusTypesFileTask({
        name,
      }),
    );
  },
});

export default NexusPrismaCrudFileGenerator;
