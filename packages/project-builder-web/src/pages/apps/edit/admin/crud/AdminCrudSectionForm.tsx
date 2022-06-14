import { AdminCrudSectionConfig } from '@baseplate/project-builder-lib';
import classNames from 'classnames';
import { Control } from 'react-hook-form';
import { SelectInput } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import CrudFormFieldsForm from './CrudFormFieldsForm';
import CrudTableColumnsForm from './CrudTableColumnsForm';

interface Props {
  className?: string;
  control: Control<AdminCrudSectionConfig>;
}

function AdminCrudSectionForm({ className, control }: Props): JSX.Element {
  const { parsedProject } = useProjectConfig();

  const modelOptions = parsedProject.getModels().map((model) => ({
    label: model.name,
    value: model.name,
  }));

  return (
    <div className={classNames('space-y-4', className)}>
      <SelectInput.LabelledController
        label="Model"
        control={control}
        options={modelOptions}
        name="modelName"
      />
      <h2>Table</h2>
      <CrudTableColumnsForm control={control} />
      <h2>Form</h2>
      <CrudFormFieldsForm control={control} />
    </div>
  );
}

export default AdminCrudSectionForm;
