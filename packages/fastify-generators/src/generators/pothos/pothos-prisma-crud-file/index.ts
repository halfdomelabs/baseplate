import type { GeneratorDescriptor } from '@halfdomelabs/sync';

import { createGenerator } from '@halfdomelabs/sync';
import { z } from 'zod';

import { createPothosTypesFileTask } from '../pothos-types-file/index.js';

const descriptorSchema = z.object({
  fileName: z.string().min(1),
});

export type PothosPrismaCrudFileDescriptor = GeneratorDescriptor<
  typeof descriptorSchema
>;

export const pothosPrismaCrudFileGenerator = createGenerator({
  name: 'pothos/pothos-prisma-crud-file',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, { fileName }) {
    taskBuilder.addTask(
      createPothosTypesFileTask({
        fileName,
      }),
    );
  },
});
