import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { PluginSpecImplementation } from '#src/plugins/spec/types.js';
import type {
  AdminCrudInputDefinition,
  ModelConfig,
} from '#src/schema/index.js';

import { createPluginSpec } from '#src/plugins/spec/types.js';

export interface AdminCrudInputWebFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formProps: UseFormReturn<any>;
  name: string;
  model: ModelConfig;
  pluginId: string | undefined;
  embeddedFormOptions: { label: string; value: string }[];
}

export interface AdminCrudInputWebConfig<
  T extends AdminCrudInputDefinition = AdminCrudInputDefinition,
> {
  name: string;
  pluginId: string | undefined;
  label: string;
  Form?: React.ComponentType<AdminCrudInputWebFormProps>;
  getNewInput: () => T;
}

export function createAdminCrudInputWebConfig<
  T extends AdminCrudInputDefinition,
>(config: AdminCrudInputWebConfig<T>): AdminCrudInputWebConfig<T> {
  return config;
}

/**
 * Spec for registering input compilers
 */
export interface AdminCrudInputWebSpec extends PluginSpecImplementation {
  registerInputWebConfig: <T extends AdminCrudInputDefinition>(
    input: AdminCrudInputWebConfig<T>,
  ) => void;
  getInputWebConfig: (
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builtInInputs?: AdminCrudInputWebConfig<any>[],
  ) => AdminCrudInputWebConfig;
  getInputWebConfigs: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builtInInputs?: AdminCrudInputWebConfig<any>[],
  ) => AdminCrudInputWebConfig[];
}

export function createAdminCrudInputWebImplementation(): AdminCrudInputWebSpec {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputs = new Map<string, AdminCrudInputWebConfig<any>>();

  return {
    registerInputWebConfig(input) {
      if (inputs.has(input.name)) {
        throw new Error(
          `Admin CRUD input with name ${input.name} is already registered`,
        );
      }
      inputs.set(input.name, input);
    },
    getInputWebConfig(name, builtInInputs = []) {
      const builtInInput = builtInInputs.find((b) => b.name === name);
      if (builtInInput) {
        return builtInInput as AdminCrudInputWebConfig;
      }
      const input = inputs.get(name);
      if (!input) {
        throw new Error(`Unable to find input with name ${name}`);
      }
      return input as AdminCrudInputWebConfig;
    },
    getInputWebConfigs(builtInInputs = []) {
      return [...builtInInputs, ...inputs.values()];
    },
  };
}

/**
 * Spec for adding config component for plugin
 */
export const adminCrudInputWebSpec = createPluginSpec(
  'core/admin-crud-input-web',
  { defaultInitializer: createAdminCrudInputWebImplementation },
);
