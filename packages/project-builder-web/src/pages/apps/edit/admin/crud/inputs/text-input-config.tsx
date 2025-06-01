import type { AdminCrudTextInputConfig } from '@baseplate-dev/project-builder-lib';
import type { AdminCrudInputWebFormProps } from '@baseplate-dev/project-builder-lib/web';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { createAdminCrudInputWebConfig } from '@baseplate-dev/project-builder-lib/web';
import {
  InputFieldController,
  SelectFieldController,
} from '@baseplate-dev/ui-components';

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
      <SelectFieldController
        label="Field"
        control={controlTyped}
        name={`${prefix}.modelFieldRef`}
        options={fieldOptions}
      />
      <InputFieldController
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
