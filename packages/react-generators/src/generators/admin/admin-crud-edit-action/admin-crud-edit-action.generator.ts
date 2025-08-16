import { tsCodeFragment } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { adminCrudActionContainerProvider } from '../_providers/admin-crud-action-container.js';

const descriptorSchema = z.object({
  order: z.number().int().nonnegative(),
  position: z.enum(['inline', 'dropdown']).default('inline'),
});

export const adminCrudEditActionGenerator = createGenerator({
  name: 'admin/admin-crud-edit-action',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: () => 'edit',
  buildTasks: ({ order, position }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudActionContainer: adminCrudActionContainerProvider,
      },
      run({ adminCrudActionContainer }) {
        // For now, add a placeholder implementation
        // This will be replaced with actual edit functionality when table template is refactored
        adminCrudActionContainer.addAction({
          type: 'edit',
          position,
          order,
          content: tsCodeFragment(
            `// Edit action placeholder for ${adminCrudActionContainer.getModelName()}`,
          ),
        });
        return {};
      },
    }),
  }),
});
