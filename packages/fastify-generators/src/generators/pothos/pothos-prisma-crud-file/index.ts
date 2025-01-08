import type { GeneratorDescriptor } from '@halfdomelabs/sync';

import { fileScope } from '@halfdomelabs/core-generators';
import { createGeneratorWithTasks } from '@halfdomelabs/sync';
import { z } from 'zod';

import { createPothosTypesFileTask } from '../pothos-types-file/index.js';

const descriptorSchema = z.object({
  fileName: z.string().min(1),
  modelName: z.string().min(1),
  crudServiceRef: z.string().min(1),
});

export type PothosPrismaCrudFileDescriptor = GeneratorDescriptor<
  typeof descriptorSchema
>;

const PothosPrismaCrudFileGenerator = createGeneratorWithTasks({
  descriptorSchema,
  scopes: [fileScope],
  getDefaultChildGenerators: (descriptor) => {
    const sharedValues = {
      generator: '@halfdomelabs/fastify/pothos/pothos-prisma-crud-mutation',
      modelName: descriptor.modelName,
      crudServiceRef: descriptor.crudServiceRef,
    };
    return {
      create: {
        defaultToNullIfEmpty: true,
        defaultDescriptor: {
          ...sharedValues,
          type: 'create',
        },
      },
      update: {
        defaultToNullIfEmpty: true,
        defaultDescriptor: {
          ...sharedValues,
          type: 'update',
        },
      },
      delete: {
        defaultToNullIfEmpty: true,
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
      }),
    );
  },
});

export default PothosPrismaCrudFileGenerator;
