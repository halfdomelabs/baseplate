import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { adminCrudDisplayContainerProvider } from '../_providers/admin-crud-display-container.js';

const descriptorSchema = z.object({
  modelField: z.string().min(1),
});

export const adminCrudTextDisplayGenerator = createGenerator({
  name: 'admin/admin-crud-text-display',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.modelField,
  buildTasks: ({ modelField }) => [
    createGeneratorTask({
      name: 'main',
      dependencies: {
        adminCrudDisplayContainer: adminCrudDisplayContainerProvider,
      },
      run({ adminCrudDisplayContainer }) {
        adminCrudDisplayContainer.addDisplay({
          content: (itemName) =>
            TypescriptCodeUtils.createExpression(`{${itemName}.${modelField}}`),
          graphQLFields: [{ name: modelField }],
        });
        return {};
      },
    }),
  ],
});
