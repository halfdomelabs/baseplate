import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import clsx from 'clsx';
import { Control, useFieldArray, useWatch } from 'react-hook-form';

import { Button, LinkButton } from 'src/components';
import ReactSelectInput from 'src/components/ReactSelectInput';

interface Props {
  className?: string;
  control: Control<ModelConfig>;
  constraintIdx: number;
}

function ModelUniqueConstraintFieldsField({
  className,
  control,
  constraintIdx,
}: Props): JSX.Element {
  const { fields, remove, append } = useFieldArray({
    control,
    name: `model.uniqueConstraints.${constraintIdx}.fields`,
  });

  const localFields = useWatch({ control, name: `model.fields` });

  const localFieldOptions = localFields.map((f) => ({
    label: f.name,
    value: f.id,
  }));

  return (
    <div className={clsx('space-y-4', className)}>
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
      <Button onClick={() => append({ name: '' })}>Add Field</Button>
    </div>
  );
}

export default ModelUniqueConstraintFieldsField;
