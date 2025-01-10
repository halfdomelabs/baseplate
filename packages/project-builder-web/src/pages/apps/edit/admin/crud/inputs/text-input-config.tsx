import type { AdminCrudTextInputConfig } from '@halfdomelabs/project-builder-lib';
import type { AdminCrudInputWebFormProps } from '@halfdomelabs/project-builder-lib/web';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { createAdminCrudInputWebConfig } from '@halfdomelabs/project-builder-lib/web';
import { InputField, SelectField } from '@halfdomelabs/ui-components';

function AdminCrudTextInputForm({
  formProps,
  name,
  model,
}: AdminCrudInputWebFormProps): React.JSX.Element {
  const fieldOptions = model.model.fields.map((field) => ({
    label: field.name,
    value: field.id,
  }));
  const prefix = name as 'prefix';
  const controlTyped = formProps.control as Control<{
    prefix: AdminCrudTextInputConfig;
  }>;

  return (
    <>
      <SelectField.Controller
        label="Field"
        control={controlTyped}
        name={`${prefix}.modelFieldRef`}
        options={fieldOptions}
      />
      <InputField.Controller
        label="Validation (zod), e.g. z.string().min(1) (optional)"
        control={controlTyped}
        name={`${prefix}.validation`}
      />
    </>
  );
}

export const adminCrudTextInputWebConfig =
  createAdminCrudInputWebConfig<AdminCrudTextInputConfig>({
    name: 'text',
    pluginId: undefined,
    label: 'Text',
    getNewInput: () => ({ label: '', type: 'text', modelFieldRef: '' }),
    Form: AdminCrudTextInputForm,
  });
