import { tsCodeFragment } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { adminCrudColumnContainerProvider } from '../_providers/admin-crud-column-container.js';

const descriptorSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  order: z.int().nonnegative(),
  modelField: z.string().min(1),
});

export const adminCrudTextColumnGenerator = createGenerator({
  name: 'admin/admin-crud-text-column',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.id,
  buildTasks: ({ label, order, modelField }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudColumnContainer: adminCrudColumnContainerProvider,
      },
      run({ adminCrudColumnContainer }) {
        adminCrudColumnContainer.addColumn({
          label,
          order,
          content: (itemName) => tsCodeFragment(`{${itemName}.${modelField}}`),
          graphQLFields: [{ name: modelField }],
        });
        return {};
      },
    }),
  }),
});
