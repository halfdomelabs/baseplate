import { createGenerator } from '@halfdomelabs/sync';
import { z } from 'zod';

import type { AdminCrudDisplay } from '../_utils/data-display.js';

import { adminCrudColumnContainerProvider } from '../_providers/admin-crud-column-container.js';
import { adminCrudDisplayContainerProvider } from '../_providers/admin-crud-display-container.js';

const descriptorSchema = z.object({
  label: z.string().min(1),
});

export const adminCrudColumnGenerator = createGenerator({
  name: 'admin/admin-crud-column',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, { label }) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        adminCrudColumnContainer: adminCrudColumnContainerProvider,
      },
      exports: {
        adminCrudDisplayContainer: adminCrudDisplayContainerProvider.export(),
      },
      run({ adminCrudColumnContainer }) {
        let display: AdminCrudDisplay | null = null;
        return {
          providers: {
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
          },
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
    });
  },
});
