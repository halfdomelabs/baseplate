import {
  createGenerator,
  createGeneratorTask,
  createProviderExportScope,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

export type AdminCrudSectionProvider = unknown;

export const adminCrudSectionProvider =
  createProviderType<AdminCrudSectionProvider>('admin-crud-section');

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
      exports: {
        adminCrudSection: adminCrudSectionProvider.export(
          adminCrudSectionScope,
        ),
      },
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
