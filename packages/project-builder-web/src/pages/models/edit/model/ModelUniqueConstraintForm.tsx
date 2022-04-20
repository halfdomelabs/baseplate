import { ModelConfig } from '@baseplate/project-builder-lib';
import classNames from 'classnames';
import { useState } from 'react';
import { FieldArrayWithId, UseFormReturn } from 'react-hook-form';
import { LinkButton, TextInput } from 'src/components';
import ModelUniqueConstraintFieldsField from './ModelUniqueConstraintFieldsField';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
  idx: number;
  field: FieldArrayWithId<ModelConfig, 'model.uniqueConstraints', 'id'>;
  onRemove: (idx: number) => void;
}

function ModelUniqueConstraintForm({
  className,
  formProps,
  idx,
  field,
  onRemove,
}: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState(!field.name);
  const {
    register,
    formState: { errors },
    watch,
  } = formProps;

  const watchedField = watch(`model.uniqueConstraints.${idx}`);

  function handleRemove(): void {
    onRemove(idx);
  }

  const relationErrors = errors.model?.uniqueConstraints?.[idx];

  return (
    <div className={classNames('space-y-4 min-w-[400px] w-1/2', className)}>
      {!isOpen ? (
        <div className="flex flex-row space-x-4 items-center">
          <LinkButton onClick={() => setIsOpen(true)}>Edit</LinkButton>
          <div>
            <strong>
              {watchedField.fields.length
                ? watchedField.fields.map((f) => f.name).join(', ')
                : 'No Fields'}
            </strong>
          </div>
          <LinkButton onClick={() => handleRemove()}>Remove</LinkButton>
        </div>
      ) : (
        <div className="space-y-4 border border-gray-200">
          <div className="space-x-4 flex flex-row">
            <LinkButton onClick={() => setIsOpen(false)}>Close</LinkButton>
            <LinkButton onClick={() => handleRemove()}>Remove</LinkButton>
          </div>
          <TextInput.Labelled
            label="Name"
            className="w-full"
            register={register(`model.uniqueConstraints.${idx}.name`)}
            error={relationErrors?.name?.message}
          />
          <ModelUniqueConstraintFieldsField
            formProps={formProps}
            constraintIdx={idx}
          />
        </div>
      )}
    </div>
  );
}

export default ModelUniqueConstraintForm;
