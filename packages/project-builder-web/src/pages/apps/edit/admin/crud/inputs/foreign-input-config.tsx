import type { AdminCrudForeignInputConfig } from '@halfdomelabs/project-builder-lib';
import type { AdminCrudInputWebFormProps } from '@halfdomelabs/project-builder-lib/web';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { createAdminCrudInputWebConfig } from '@halfdomelabs/project-builder-lib/web';
import { InputField, SelectField } from '@halfdomelabs/ui-components';

function AdminCrudForeignInputForm({
  formProps,
  name,
  model,
}: AdminCrudInputWebFormProps): React.JSX.Element {
  const localRelationOptions =
    model.model.relations?.map((relation) => ({
      label: `${relation.name} (${relation.modelName})`,
      value: relation.id,
    })) ?? [];
  const prefix = name as 'prefix';
  const controlTyped = formProps.control as Control<{
    prefix: AdminCrudForeignInputConfig;
  }>;

  return (
    <>
      <SelectField.Controller
        label="Local Relation Name"
        control={controlTyped}
        name={`${prefix}.localRelationName`}
        options={localRelationOptions}
      />
      <InputField.Controller
        label="Label Expression (e.g. name)"
        control={controlTyped}
        name={`${prefix}.labelExpression`}
      />
      <InputField.Controller
        label="Value Expression (e.g. id)"
        control={controlTyped}
        name={`${prefix}.valueExpression`}
      />
      <InputField.Controller
        label="Default Label (optional)"
        control={controlTyped}
        name={`${prefix}.defaultLabel`}
      />
      <InputField.Controller
        label="Empty Label (optional) - only if field is nullable"
        control={controlTyped}
        name={`${prefix}.nullLabel`}
      />
    </>
  );
}

export const adminCrudForeignInputWebConfig =
  createAdminCrudInputWebConfig<AdminCrudForeignInputConfig>({
    name: 'foreign',
    pluginId: undefined,
    label: 'Foreign',
    getNewInput: () => ({
      label: '',
      type: 'foreign',
      localRelationName: '',
      labelExpression: '',
      valueExpression: '',
      defaultLabel: '',
      nullLabel: '',
    }),
    Form: AdminCrudForeignInputForm,
  });
