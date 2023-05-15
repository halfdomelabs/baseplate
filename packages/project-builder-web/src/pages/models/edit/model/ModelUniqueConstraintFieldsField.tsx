import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import classNames from 'classnames';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { Button, LinkButton } from 'src/components';
import ReactSelectInput from 'src/components/ReactSelectInput';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
  constraintIdx: number;
}

function ModelUniqueConstraintFieldsField({
  className,
  formProps,
  constraintIdx,
}: Props): JSX.Element {
  const { control, watch } = formProps;
  const { fields, remove, append } = useFieldArray({
    control,
    name: `model.uniqueConstraints.${constraintIdx}.fields`,
  });

  const localFields = watch(`model.fields`);

  const localFieldOptions = localFields.map((f) => ({
    label: f.name,
    value: f.name,
  }));

  return (
    <div className={classNames('space-y-4', className)}>
      {fields.map((field, idx) => (
        <div key={field.id} className="flex flex-row justify-between space-x-4">
          <ReactSelectInput.LabelledController
            className="w-full"
            control={control}
            name={`model.uniqueConstraints.${constraintIdx}.fields.${idx}.name`}
            options={localFieldOptions}
            label="Field"
          />
          <LinkButton onClick={() => remove(idx)}>Remove</LinkButton>
        </div>
      ))}
      <Button onClick={() => append({})}>Add Field</Button>
    </div>
  );
}

export default ModelUniqueConstraintFieldsField;
