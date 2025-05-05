import {
  createGenerator,
  createGeneratorTask,
  createProviderExportScope,
} from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

export const adminCrudSectionScope = createProviderExportScope(
  'react/admin-crud-section',
  'Scope for admin crud section',
);

export const adminCrudSectionGenerator = createGenerator({
  name: 'admin/admin-crud-section',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [adminCrudSectionScope],
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {},
      exports: {},
      run() {
        return {
          providers: {
            adminCrudSection: {},
          },
        };
      },
    }),
  }),
});
