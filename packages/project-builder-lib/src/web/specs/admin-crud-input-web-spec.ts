import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { AdminCrudInputInput, ModelConfig } from '#src/schema/index.js';

import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

export interface AdminCrudInputWebFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formProps: UseFormReturn<any>;
  name: string;
  model: ModelConfig;
  pluginKey: string | undefined;
  embeddedFormOptions: { label: string; value: string }[];
}

export interface AdminCrudInputWebConfig<
  T extends AdminCrudInputInput = AdminCrudInputInput,
> {
  name: string;
  pluginKey: string | undefined;
  label: string;
  Form?: React.ComponentType<AdminCrudInputWebFormProps>;
  getNewInput: () => T;
}

export function createAdminCrudInputWebConfig<T extends AdminCrudInputInput>(
  config: AdminCrudInputWebConfig<T>,
): AdminCrudInputWebConfig<T> {
  return config;
}

/**
 * Spec for registering admin CRUD input web configs
 */
export const adminCrudInputWebSpec = createFieldMapSpec(
  'core/admin-crud-input-web',
  (t) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inputs: t.namedArray<AdminCrudInputWebConfig<any>>(),
  }),
);
