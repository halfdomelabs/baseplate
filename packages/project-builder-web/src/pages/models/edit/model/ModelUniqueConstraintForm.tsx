import { ModelConfig, ModelUtils } from '@halfdomelabs/project-builder-lib';
import classNames from 'classnames';
import { useState } from 'react';
import { Control, FieldArrayWithId } from 'react-hook-form';

import ModelUniqueConstraintFieldsField from './ModelUniqueConstraintFieldsField';
import { useEditedModelConfig } from '../hooks/useEditedModelConfig';
import { LinkButton, TextInput } from 'src/components';

interface Props {
  className?: string;
  idx: number;
  field: FieldArrayWithId<ModelConfig, 'model.uniqueConstraints', 'id'>;
  onRemove: (idx: number) => void;
  control: Control<ModelConfig>;
}

function ModelUniqueConstraintForm({
  className,
  control,
  idx,
  field,
  onRemove,
}: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState(!field.name);

  const constraintFields = useEditedModelConfig((model) => {
    const fields = model.model.uniqueConstraints?.[idx]?.fields
      .filter((f) => f.name)
      .map((f) => ModelUtils.getScalarFieldById(model, f.name).name);
    return fields?.length ? fields.join(', ') : 'No Fields';
  });

  function handleRemove(): void {
    onRemove(idx);
  }

  return (
    <div className={classNames('w-1/2 min-w-[400px] space-y-4', className)}>
      {!isOpen ? (
        <div className="flex flex-row items-center space-x-4">
          <LinkButton onClick={() => setIsOpen(true)}>Edit</LinkButton>
          <div>
            <strong>{constraintFields}</strong>
          </div>
          <LinkButton onClick={() => handleRemove()}>Remove</LinkButton>
        </div>
      ) : (
        <div className="space-y-4 border border-gray-200">
          <div className="flex flex-row space-x-4">
            <LinkButton onClick={() => setIsOpen(false)}>Close</LinkButton>
            <LinkButton onClick={() => handleRemove()}>Remove</LinkButton>
          </div>
          <TextInput.LabelledController
            label="Name"
            className="w-full"
            control={control}
            name={`model.uniqueConstraints.${idx}.name`}
          />
          <ModelUniqueConstraintFieldsField
            control={control}
            constraintIdx={idx}
          />
        </div>
      )}
    </div>
  );
}

export default ModelUniqueConstraintForm;
