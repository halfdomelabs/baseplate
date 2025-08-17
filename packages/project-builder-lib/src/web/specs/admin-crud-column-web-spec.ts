import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { PluginSpecImplementation } from '#src/plugins/spec/types.js';
import type { AdminCrudColumnInput } from '#src/schema/apps/web/admin/sections/crud-columns/types.js';
import type { ModelConfig, ProjectDefinition } from '#src/schema/index.js';

import { createPluginSpec } from '#src/plugins/spec/types.js';

export interface AdminCrudColumnWebFormProps<T extends AdminCrudColumnInput> {
  formProps: UseFormReturn<T>;
  model: ModelConfig;
  pluginKey: string | undefined;
}

export interface AdminCrudColumnWebConfig<
  T extends AdminCrudColumnInput = AdminCrudColumnInput,
> {
  name: string;
  pluginKey: string | undefined;
  label: string;
  isAvailableForModel: (
    definition: ProjectDefinition,
    modelId: string,
  ) => boolean;
  Form?: React.ComponentType<AdminCrudColumnWebFormProps<T>>;
  getNewColumn: () => T;
}

export function createAdminCrudColumnWebConfig<T extends AdminCrudColumnInput>(
  config: AdminCrudColumnWebConfig<T>,
): AdminCrudColumnWebConfig<T> {
  return config;
}

/**
 * Spec for registering column web configs
 */
export interface AdminCrudColumnWebSpec extends PluginSpecImplementation {
  registerColumnWebConfig: <T extends AdminCrudColumnInput>(
    column: AdminCrudColumnWebConfig<T>,
  ) => void;
  getColumnWebConfig: (
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builtInColumns?: AdminCrudColumnWebConfig<any>[],
  ) => AdminCrudColumnWebConfig;
  getColumnWebConfigs: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builtInColumns?: AdminCrudColumnWebConfig<any>[],
  ) => AdminCrudColumnWebConfig[];
}

export function createAdminCrudColumnWebImplementation(): AdminCrudColumnWebSpec {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = new Map<string, AdminCrudColumnWebConfig<any>>();

  return {
    registerColumnWebConfig(column) {
      if (columns.has(column.name)) {
        throw new Error(
          `Admin CRUD column with name ${column.name} is already registered`,
        );
      }
      columns.set(column.name, column);
    },
    getColumnWebConfig(name, builtInColumns = []) {
      const builtInColumn = builtInColumns.find((b) => b.name === name);
      if (builtInColumn) {
        return builtInColumn as AdminCrudColumnWebConfig;
      }
      const column = columns.get(name);
      if (!column) {
        throw new Error(`Unable to find column with name ${name}`);
      }
      return column as AdminCrudColumnWebConfig;
    },
    getColumnWebConfigs(builtInColumns = []) {
      return [...builtInColumns, ...columns.values()];
    },
  };
}

/**
 * Spec for adding config component for plugin
 */
export const adminCrudColumnWebSpec = createPluginSpec(
  'core/admin-crud-column-web',
  { defaultInitializer: createAdminCrudColumnWebImplementation },
);
