import { ModelConfig } from '@baseplate/app-builder-lib';
import classNames from 'classnames';
import { useState } from 'react';
import { FieldArrayWithId, UseFormReturn } from 'react-hook-form';
import { LinkButton, SelectInput, TextInput } from 'src/components';
import { useAppConfig } from 'src/hooks/useAppConfig';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
  idx: number;
  field: FieldArrayWithId<ModelConfig, 'model.relations', 'id'>;
  onRemove: (idx: number) => void;
}

function formatFieldAttributes(
  field: FieldArrayWithId<ModelConfig, 'model.relations', 'id'>
): string {
  const attrStrings: string[] = [];
  if (field.isOptional) attrStrings.push('optional');
  if (field.relationshipName)
    attrStrings.push(`name-${field.relationshipName}`);
  if (field.relationshipType) attrStrings.push(field.relationshipType);
  if (field.onDelete)
    attrStrings.push(`delete-${field.onDelete.toLowerCase()}`);
  if (field.onUpdate)
    attrStrings.push(`update-${field.onUpdate.toLowerCase()}`);
  return attrStrings.join(', ');
}

function ModelRelationForm({
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
  } = formProps;

  const { parsedConfig } = useAppConfig();

  const foreignModelOptions = parsedConfig.getModels().map((type) => ({
    label: type.name,
    value: type.name,
  }));

  const attrString = formatFieldAttributes(field);
  const relationErrors = errors.model?.relations?.[idx];

  return (
    <div className={classNames('space-y-4 w-3/4', className)}>
      {!isOpen ? (
        <div className="flex flex-row space-x-4 items-center">
          <LinkButton onClick={() => setIsOpen(true)}>Edit</LinkButton>
          <div>
            <strong>{field.name}</strong> ({field.modelName})
            {attrString && `: ${attrString}`}
          </div>
          <LinkButton onClick={() => onRemove(idx)}>Remove</LinkButton>
        </div>
      ) : (
        <div className="space-y-4 border border-gray-200 p-4">
          <LinkButton onClick={() => setIsOpen(false)}>Close</LinkButton>
          <TextInput.Labelled
            label="Name"
            className="w-full"
            register={register(`model.relations.${idx}.name`)}
            error={relationErrors?.name?.message}
          />
          <SelectInput.Labelled
            label="Foreign Model"
            options={foreignModelOptions}
            register={register(`model.relations.${idx}.modelName`)}
            error={relationErrors?.modelName?.message}
          />
        </div>
      )}
    </div>
  );
}

export default ModelRelationForm;
