import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type {
  AdminCrudActionInput,
  ModelConfig,
  ProjectDefinition,
} from '#src/schema/index.js';

import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

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
 * Spec for registering admin CRUD action web configs
 */
export const adminCrudActionWebSpec = createFieldMapSpec(
  'core/admin-crud-action-web',
  (t) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actions: t.map<string, AdminCrudActionWebConfig<any>>(),
  }),
);
