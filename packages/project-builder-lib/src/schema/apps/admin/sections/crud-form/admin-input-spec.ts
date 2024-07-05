import { z } from 'zod';

import { BUILT_IN_ADMIN_CRUD_INPUTS } from './built-in-crud-admin-inputs.js';
import { AdminCrudInputType } from './types.js';
import {
  PluginSpecImplementation,
  createPluginSpec,
} from '@src/plugins/spec/types.js';
import { ZodRef } from '@src/references/ref-builder.js';

/**
 * Spec for registering additional model input types
 */
export interface AdminCrudInputSpec extends PluginSpecImplementation {
  registerAdminCrudInput: <T extends z.ZodTypeAny>(
    input: AdminCrudInputType<T>,
  ) => void;
  getAdminCrudInputs: () => Record<string, AdminCrudInputType>;
  getAdminCrudInput: (name: string) => AdminCrudInputType;
}

export function createAdminCrudInputImplementation(): AdminCrudInputSpec {
  const adminCrudInputs = BUILT_IN_ADMIN_CRUD_INPUTS.reduce(
    (acc, input) => {
      acc[input.name] = input as unknown as AdminCrudInputType;
      return acc;
    },
    {} as Record<string, AdminCrudInputType>,
  );

  return {
    registerAdminCrudInput(input) {
      if (adminCrudInputs[input.name]) {
        throw new Error(
          `Admin CRUD input with name ${input.name} is already registered`,
        );
      }
      // check schema is a zEnt
      if (!(input.schema instanceof ZodRef)) {
        throw new Error(
          `Admin CRUD input schema for ${input.name} is not a zEnt`,
        );
      }
      adminCrudInputs[input.name] = input as unknown as AdminCrudInputType;
    },
    getAdminCrudInputs() {
      return adminCrudInputs;
    },
    getAdminCrudInput(name) {
      const input = adminCrudInputs[name];
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
