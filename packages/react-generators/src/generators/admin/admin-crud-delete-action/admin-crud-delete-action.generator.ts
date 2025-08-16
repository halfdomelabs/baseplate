import { tsCodeFragment } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { adminCrudActionContainerProvider } from '../_providers/admin-crud-action-container.js';

const descriptorSchema = z.object({
  order: z.number().int().nonnegative(),
  position: z.enum(['inline', 'dropdown']).default('dropdown'),
});

export const adminCrudDeleteActionGenerator = createGenerator({
  name: 'admin/admin-crud-delete-action',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: () => 'delete',
  buildTasks: ({ order, position }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudActionContainer: adminCrudActionContainerProvider,
      },
      run({ adminCrudActionContainer }) {
        // For now, add a placeholder implementation
        // This will be replaced with actual delete functionality when table template is refactored
        adminCrudActionContainer.addAction({
          type: 'delete',
          position,
          order,
          content: tsCodeFragment(
            `// Delete action placeholder for ${adminCrudActionContainer.getModelName()}`,
          ),
        });
        return {};
      },
    }),
  }),
});
