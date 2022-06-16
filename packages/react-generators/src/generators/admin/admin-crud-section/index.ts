import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import { z } from 'zod';

const descriptorSchema = z.object({
  modelName: z.string(),
});

export type AdminCrudSectionProvider = unknown;

export const adminCrudSectionProvider =
  createProviderType<AdminCrudSectionProvider>('admin-crud-section');

const AdminCrudSectionGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: ({ modelName }) => ({
    edit: {
      defaultDescriptor: {
        generator: '@baseplate/react/admin/admin-crud-edit',
        modelName,
      },
    },
    list: {
      defaultDescriptor: {
        generator: '@baseplate/react/admin/admin-crud-list',
        modelName,
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
  createGenerator(descriptor, dependencies) {
    return {
      getProviders: () => ({
        adminCrudSection: {},
      }),
      build: async (builder) => {},
    };
  },
});

export default AdminCrudSectionGenerator;
