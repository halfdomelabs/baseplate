import { AdminCrudTextInputConfig } from '@halfdomelabs/project-builder-lib';
import {
  AdminCrudInputWebFormProps,
  createAdminCrudInputWebConfig,
} from '@halfdomelabs/project-builder-lib/web';
import { InputField, SelectField } from '@halfdomelabs/ui-components';
import { Control } from 'react-hook-form';

function AdminCrudTextInputForm({
  formProps,
  name,
  model,
}: AdminCrudInputWebFormProps): JSX.Element {
  const fieldOptions =
    model?.model.fields.map((field) => ({
      label: field.name,
      value: field.id,
    })) ?? [];
  const prefix = name as 'prefix';
  const controlTyped = formProps.control as Control<{
    prefix: AdminCrudTextInputConfig;
  }>;

  return (
    <>
      <SelectField.Controller
        label="Field"
        control={controlTyped}
        name={`${prefix}.modelField`}
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
    getNewInput: () => ({ label: '', type: 'text', modelField: '' }),
    Form: AdminCrudTextInputForm,
  });
