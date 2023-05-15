import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import classNames from 'classnames';
import { UseFormReturn } from 'react-hook-form';
import SelectArrayInput from 'src/components/SelectArrayInput';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
}

function ModelPrimaryKeyForm({ className, formProps }: Props): JSX.Element {
  const { control, watch } = formProps;

  const localFields = watch(`model.fields`);

  const localFieldOptions =
    localFields?.map((f) => ({
      label: f.name,
      value: f.name,
    })) || [];

  return (
    <div className={classNames('w-1/2 min-w-[400px] space-y-4', className)}>
      <h2>Primary Keys</h2>
      <SelectArrayInput.LabelledController
        name="model.primaryKeys"
        control={control}
        options={localFieldOptions}
        uniqueValues
      />
    </div>
  );
}

export default ModelPrimaryKeyForm;
