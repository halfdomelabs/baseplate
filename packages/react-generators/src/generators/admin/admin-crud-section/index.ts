import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import { z } from 'zod';

const descriptorSchema = z.object({
  modelName: z.string(),
  disableCreate: z.boolean().optional(),
});

export type AdminCrudSectionProvider = unknown;

export const adminCrudSectionProvider =
  createProviderType<AdminCrudSectionProvider>('admin-crud-section');

const AdminCrudSectionGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: ({ modelName, disableCreate }) => ({
    edit: {
      defaultDescriptor: {
        generator: '@baseplate/react/admin/admin-crud-edit',
        modelName,
        disableCreate,
      },
    },
    list: {
      defaultDescriptor: {
        generator: '@baseplate/react/admin/admin-crud-list',
        modelName,
        disableCreate,
      },
    },
    queries: {
      defaultDescriptor: {
        generator: '@baseplate/react/admin/admin-crud-queries',
        modelName,
        peerProvider: true,
      },
    },
  }),
  dependencies: {},
  exports: {
    adminCrudSection: adminCrudSectionProvider,
  },
  createGenerator() {
    return {
      getProviders: () => ({
        adminCrudSection: {},
      }),
      build: async () => {},
    };
  },
});

export default AdminCrudSectionGenerator;
