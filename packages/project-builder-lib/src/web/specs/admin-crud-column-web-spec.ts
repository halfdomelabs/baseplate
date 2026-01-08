import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { AdminCrudColumnInput } from '#src/schema/apps/web/admin/sections/crud-columns/types.js';
import type { ModelConfig, ProjectDefinition } from '#src/schema/index.js';

import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

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
 * Spec for registering admin CRUD column web configs
 */
export const adminCrudColumnWebSpec = createFieldMapSpec(
  'core/admin-crud-column-web',
  (t) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: t.namedArrayToMap<AdminCrudColumnWebConfig<any>>(),
  }),
);
