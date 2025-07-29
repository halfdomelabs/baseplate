import type { AdminCrudEnumInputConfig } from '@baseplate-dev/project-builder-lib';
import type { AdminCrudInputWebFormProps } from '@baseplate-dev/project-builder-lib/web';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { createAdminCrudInputWebConfig } from '@baseplate-dev/project-builder-lib/web';
import { SelectFieldController } from '@baseplate-dev/ui-components';

function AdminCrudEnumInputForm({
  formProps,
  name,
  model,
}: AdminCrudInputWebFormProps): React.JSX.Element {
  const enumFieldOptions = model.model.fields
    .filter((f) => f.type === 'enum')
    .map((field) => ({
      label: field.name,
      value: field.id,
    }));
  const prefix = name as 'prefix';
  const controlTyped = formProps.control as Control<{
    prefix: AdminCrudEnumInputConfig;
  }>;

  return (
    <SelectFieldController
      label="Enum Field"
      control={controlTyped}
      name={`${prefix}.modelFieldRef`}
      options={enumFieldOptions}
    />
  );
}

export const adminCrudEnumInputWebConfig =
  createAdminCrudInputWebConfig<AdminCrudEnumInputConfig>({
    name: 'enum',
    pluginKey: undefined,
    label: 'Enum',
    getNewInput: () => ({ label: '', type: 'enum', modelFieldRef: '' }),
    Form: AdminCrudEnumInputForm,
  });
