import { AdminCrudEnumInputConfig } from '@halfdomelabs/project-builder-lib';
import {
  AdminCrudInputWebFormProps,
  createAdminCrudInputWebConfig,
} from '@halfdomelabs/project-builder-lib/web';
import { SelectField } from '@halfdomelabs/ui-components';
import { Control } from 'react-hook-form';

function AdminCrudEnumInputForm({
  formProps,
  name,
  model,
}: AdminCrudInputWebFormProps): JSX.Element {
  const enumFieldOptions =
    model?.model.fields
      .filter((f) => f.type === 'enum')
      .map((field) => ({
        label: field.name,
        value: field.id,
      })) ?? [];
  const prefix = name as 'prefix';
  const controlTyped = formProps.control as Control<{
    prefix: AdminCrudEnumInputConfig;
  }>;

  return (
    <SelectField.Controller
      label="Enum Field"
      control={controlTyped}
      name={`${prefix}.modelField`}
      options={enumFieldOptions}
    />
  );
}

export const adminCrudEnumInputWebConfig =
  createAdminCrudInputWebConfig<AdminCrudEnumInputConfig>({
    name: 'enum',
    pluginId: undefined,
    label: 'Enum',
    getNewInput: () => ({ label: '', type: 'enum', modelField: '' }),
    Form: AdminCrudEnumInputForm,
  });
