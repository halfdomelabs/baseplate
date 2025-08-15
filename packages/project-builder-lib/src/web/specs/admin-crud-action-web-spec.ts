import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { PluginSpecImplementation } from '#src/plugins/spec/types.js';
import type {
  AdminCrudActionInput,
  ModelConfig,
  ProjectDefinition,
} from '#src/schema/index.js';

import { createPluginSpec } from '#src/plugins/spec/types.js';

export interface AdminCrudActionWebFormProps<T extends AdminCrudActionInput> {
  formProps: UseFormReturn<T>;
  model: ModelConfig;
  pluginKey: string | undefined;
}

export interface AdminCrudActionWebConfig<
  T extends AdminCrudActionInput = AdminCrudActionInput,
> {
  name: string;
  pluginKey: string | undefined;
  label: string;
  isAvailableForModel: (
    definition: ProjectDefinition,
    modelId: string,
  ) => boolean;
  Form?: React.ComponentType<AdminCrudActionWebFormProps<T>>;
  getNewAction: () => T;
}

export function createAdminCrudActionWebConfig<T extends AdminCrudActionInput>(
  config: AdminCrudActionWebConfig<T>,
): AdminCrudActionWebConfig<T> {
  return config;
}

/**
 * Spec for registering action compilers
 */
export interface AdminCrudActionWebSpec extends PluginSpecImplementation {
  registerActionWebConfig: <T extends AdminCrudActionInput>(
    action: AdminCrudActionWebConfig<T>,
  ) => void;
  getActionWebConfig: (
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builtInActions?: AdminCrudActionWebConfig<any>[],
  ) => AdminCrudActionWebConfig;
  getActionWebConfigs: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builtInActions?: AdminCrudActionWebConfig<any>[],
  ) => AdminCrudActionWebConfig[];
}

export function createAdminCrudActionWebImplementation(): AdminCrudActionWebSpec {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actions = new Map<string, AdminCrudActionWebConfig<any>>();

  return {
    registerActionWebConfig(action) {
      if (actions.has(action.name)) {
        throw new Error(
          `Admin CRUD action with name ${action.name} is already registered`,
        );
      }
      actions.set(action.name, action);
    },
    getActionWebConfig(name, builtInActions = []) {
      const builtInAction = builtInActions.find((b) => b.name === name);
      if (builtInAction) {
        return builtInAction as AdminCrudActionWebConfig;
      }
      const action = actions.get(name);
      if (!action) {
        throw new Error(`Unable to find action with name ${name}`);
      }
      return action as AdminCrudActionWebConfig;
    },
    getActionWebConfigs(builtInActions = []) {
      return [...builtInActions, ...actions.values()];
    },
  };
}

/**
 * Spec for adding config component for plugin
 */
export const adminCrudActionWebSpec = createPluginSpec(
  'core/admin-crud-action-web',
  { defaultInitializer: createAdminCrudActionWebImplementation },
);
