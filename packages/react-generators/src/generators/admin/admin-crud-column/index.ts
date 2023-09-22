import {
  createGeneratorWithTasks,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { adminCrudColumnContainerProvider } from '../_providers/admin-crud-column-container.js';
import { adminCrudDisplayContainerProvider } from '../_providers/admin-crud-display-container.js';
import { AdminCrudDisplay } from '../_utils/data-display.js';

const descriptorSchema = z.object({
  label: z.string().min(1),
});

type Descriptor = z.infer<typeof descriptorSchema>;

const createMainTask = createTaskConfigBuilder(({ label }: Descriptor) => ({
  name: 'main',
  dependencies: {
    adminCrudColumnContainer: adminCrudColumnContainerProvider,
  },
  exports: {
    adminCrudDisplayContainer: adminCrudDisplayContainerProvider,
  },
  run({ adminCrudColumnContainer }) {
    let display: AdminCrudDisplay | null = null;
    return {
      getProviders: () => ({
        adminCrudDisplayContainer: {
          addDisplay(input) {
            if (display) {
              throw new Error(
                'Cannot add more than one display to the same crud display container',
              );
            }
            display = input;
          },
          getModelName: () => adminCrudColumnContainer.getModelName(),
        },
      }),
      build: () => {
        if (!display) {
          throw new Error(
            'Cannot build crud display container without a display',
          );
        }
        adminCrudColumnContainer.addColumn({
          label,
          display,
        });
      },
    };
  },
}));

const AdminCrudColumnGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    display: {},
  }),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default AdminCrudColumnGenerator;
