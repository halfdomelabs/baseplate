import { SelectFieldController } from '@halfdomelabs/ui-components';
import type { AdminCrudEnumInputConfig } from '@halfdomelabs/project-builder-lib';
import type { AdminCrudInputWebFormProps } from '@halfdomelabs/project-builder-lib/web';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { createAdminCrudInputWebConfig } from '@halfdomelabs/project-builder-lib/web';

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
    pluginId: undefined,
    label: 'Enum',
    getNewInput: () => ({ label: '', type: 'enum', modelFieldRef: '' }),
    Form: AdminCrudEnumInputForm,
  });
