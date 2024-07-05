import { AdminCrudSectionConfig } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import clsx from 'clsx';
import { Control, UseFormReturn, useWatch } from 'react-hook-form';

import AdminCrudEmbeddedForm, {
  AdminCrudEmbeddedTable,
} from './AdminCrudEmbeddedForm';
import CrudFormFieldsForm, { AdminCrudFormConfig } from './CrudFormFieldsForm';
import CrudTableColumnsForm, {
  AdminCrudTableConfig,
} from './CrudTableColumnsForm';
import { SelectInput } from 'src/components';
import CheckedInput from 'src/components/CheckedInput';
import EmbeddedListInput from 'src/components/EmbeddedListInput';

interface Props {
  className?: string;
  formProps: UseFormReturn<AdminCrudSectionConfig>;
}

function AdminCrudSectionForm({ className, formProps }: Props): JSX.Element {
  const { control } = formProps;
  const { parsedProject } = useProjectDefinition();

  const modelOptions = parsedProject.getModels().map((model) => ({
    label: model.name,
    value: model.id,
  }));

  // TODO: struggles with https://github.com/react-hook-form/react-hook-form/discussions/7354

  const embeddedFormOptions =
    useWatch({
      control,
      name: 'embeddedForms',
    })?.map((form) => ({
      label: form.name,
      value: form.id,
    })) ?? [];

  // TODO: Update embedded form names when form is added/removed

  return (
    <div className={clsx('space-y-4', className)}>
      <SelectInput.LabelledController
        label="Model"
        control={control}
        options={modelOptions}
        name="modelName"
      />
      <CheckedInput.LabelledController
        label="Disable Create?"
        control={control}
        name="disableCreate"
      />
      <h2>Table</h2>
      <CrudTableColumnsForm
        control={control as unknown as Control<AdminCrudTableConfig>}
      />
      <h2>Form</h2>
      <CrudFormFieldsForm
        formProps={formProps as unknown as UseFormReturn<AdminCrudFormConfig>}
        embeddedFormOptions={embeddedFormOptions}
      />
      <h2>Embedded Forms</h2>
      <EmbeddedListInput.LabelledController
        control={control}
        name="embeddedForms"
        renderForm={(formProps) => (
          <AdminCrudEmbeddedForm
            {...formProps}
            embeddedFormOptions={embeddedFormOptions}
          />
        )}
        renderTable={(tableProps) => <AdminCrudEmbeddedTable {...tableProps} />}
        defaultValue={{ type: 'object' }}
      />
    </div>
  );
}

export default AdminCrudSectionForm;
