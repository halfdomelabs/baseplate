import { featureScope } from '@halfdomelabs/core-generators';
import { createGenerator } from '@halfdomelabs/sync';
import { z } from 'zod';

import { createAppModuleTask } from '../root-module/root-module.generator.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
});

export const appModuleGenerator = createGenerator({
  name: 'core/app-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [featureScope],
  getInstanceName: (descriptor) => descriptor.name,
  buildTasks: (descriptor) => ({
    main: createAppModuleTask(descriptor.name),
  }),
});
