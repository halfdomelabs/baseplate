import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGeneratorWithTasks } from '@halfdomelabs/sync';
import { z } from 'zod';

import { adminCrudDisplayContainerProvider } from '../_providers/admin-crud-display-container.js';

const descriptorSchema = z.object({
  modelField: z.string().min(1),
});

const AdminCrudTextDisplayGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, { modelField }) {
    taskBuilder.addTask({
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
    });
  },
});

export default AdminCrudTextDisplayGenerator;
