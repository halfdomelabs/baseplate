import {
  createGeneratorWithChildren,
  createProviderExportScope,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({
  modelName: z.string(),
  disableCreate: z.boolean().optional(),
});

export type AdminCrudSectionProvider = unknown;

export const adminCrudSectionProvider =
  createProviderType<AdminCrudSectionProvider>('admin-crud-section');

export const adminCrudSectionScope = createProviderExportScope(
  'react/admin-crud-section',
  'Scope for admin crud section',
);

const AdminCrudSectionGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: ({ modelName, disableCreate }) => ({
    edit: {
      defaultDescriptor: {
        generator: '@halfdomelabs/react/admin/admin-crud-edit',
        modelName,
        disableCreate,
      },
    },
    list: {
      defaultDescriptor: {
        generator: '@halfdomelabs/react/admin/admin-crud-list',
        modelName,
        disableCreate,
      },
    },
    queries: {
      defaultDescriptor: {
        generator: '@halfdomelabs/react/admin/admin-crud-queries',
        modelName,
      },
    },
  }),
  dependencies: {},
  scopes: [adminCrudSectionScope],
  exports: {
    adminCrudSection: adminCrudSectionProvider.export(adminCrudSectionScope),
  },
  createGenerator() {
    return {
      getProviders: () => ({
        adminCrudSection: {},
      }),
    };
  },
});

export default AdminCrudSectionGenerator;
