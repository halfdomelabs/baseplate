import type { PluginSpecImplementation } from '#src/plugins/spec/types.js';

import { createPluginSpec } from '#src/plugins/spec/types.js';

import type {
  AdminCrudInputSchemaCreator,
  AdminCrudInputType,
} from './types.js';

import { BUILT_IN_ADMIN_CRUD_INPUTS } from './built-in-input.js';

/**
 * Spec for registering additional model input types
 */
export interface AdminCrudInputSpec extends PluginSpecImplementation {
  registerAdminCrudInput: <T extends AdminCrudInputSchemaCreator>(
    input: AdminCrudInputType<T>,
  ) => void;
  getAdminCrudInputs: () => Map<string, AdminCrudInputType>;
  getAdminCrudInput: (name: string) => AdminCrudInputType;
}

export function createAdminCrudInputImplementation(): AdminCrudInputSpec {
  const adminCrudInputs = new Map<string, AdminCrudInputType>(
    BUILT_IN_ADMIN_CRUD_INPUTS.map((input) => [input.name, input]),
  );

  return {
    registerAdminCrudInput(input) {
      if (adminCrudInputs.has(input.name)) {
        throw new Error(
          `Admin CRUD input with name ${input.name} is already registered`,
        );
      }
      adminCrudInputs.set(input.name, input as unknown as AdminCrudInputType);
    },
    getAdminCrudInputs() {
      return adminCrudInputs;
    },
    getAdminCrudInput(name) {
      const input = adminCrudInputs.get(name);
      if (!input) {
        throw new Error(`Unable to find input with name ${name}`);
      }
      return input;
    },
  };
}

/**
 * Spec for adding admin crud input
 */
export const adminCrudInputSpec = createPluginSpec('core/admin-crud-input', {
  defaultInitializer: createAdminCrudInputImplementation,
});
