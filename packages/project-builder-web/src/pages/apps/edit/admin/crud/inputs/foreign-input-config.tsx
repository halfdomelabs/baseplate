import { AdminCrudForeignInputConfig } from '@halfdomelabs/project-builder-lib';
import {
  AdminCrudInputWebFormProps,
  createAdminCrudInputWebConfig,
} from '@halfdomelabs/project-builder-lib/web';
import { InputField, SelectField } from '@halfdomelabs/ui-components';
import { Control } from 'react-hook-form';

function AdminCrudForeignInputForm({
  formProps,
  name,
  model,
}: AdminCrudInputWebFormProps): JSX.Element {
  const localRelationOptions =
    model?.model.relations?.map((relation) => ({
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
