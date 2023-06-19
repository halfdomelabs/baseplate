import { createGeneratorWithTasks } from '@halfdomelabs/sync';
import { z } from 'zod';
import { createPothosTypesFileTask } from '../pothos-types-file/index.js';

const descriptorSchema = z.object({
  fileName: z.string().min(1),
  modelName: z.string().min(1),
  objectTypeRef: z.string().min(1),
  crudServiceRef: z.string().min(1),
});

const PothosPrismaCrudFileGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: (descriptor) => {
    const sharedValues = {
      generator: '@halfdomelabs/fastify/pothos/pothos-prisma-crud-mutation',
      modelName: descriptor.modelName,
      objectTypeRef: descriptor.objectTypeRef,
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
  buildTasks(taskBuilder, { fileName }) {
    taskBuilder.addTask(
      createPothosTypesFileTask({
        fileName,
      })
    );
  },
});

export default PothosPrismaCrudFileGenerator;
