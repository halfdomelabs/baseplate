import {
  ModelConfig,
  ModelRelationFieldConfig,
  REFERENTIAL_ACTIONS,
} from '@baseplate/project-builder-lib';
import classNames from 'classnames';
import { useState } from 'react';
import { FieldArrayWithId, UseFormReturn } from 'react-hook-form';
import { LinkButton, SelectInput, TextInput } from 'src/components';
import CheckedInput from 'src/components/CheckedInput';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useToast } from 'src/hooks/useToast';
import { setUndefinedIfEmpty } from 'src/utils/form';
import ModelRelationReferencesForm from './ModelRelationReferencesForm';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
  idx: number;
  field: FieldArrayWithId<ModelConfig, 'model.relations', 'id'>;
  onRemove: (idx: number) => void;
  originalModel?: ModelConfig;
}

function formatFieldAttributes(field: ModelRelationFieldConfig): string {
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

const REFERENTIAL_ACTION_OPTIONS = REFERENTIAL_ACTIONS.map((action) => ({
  label: action,
  value: action,
}));

function ModelRelationForm({
  className,
  formProps,
  idx,
  field,
  onRemove,
  originalModel,
}: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState(!field.name);
  const {
    register,
    formState: { errors },
    watch,
    control,
  } = formProps;

  const { parsedProject } = useProjectConfig();
  const watchedField = watch(`model.relations.${idx}`);

  const toast = useToast();
  function handleRemove(): void {
    // check for references
    if (originalModel) {
      const originalRelation = originalModel.model.relations?.find(
        (f) => f.uid === watchedField.uid
      );
      if (originalRelation) {
        const references =
          parsedProject.references.modelForeignField?.[
            `${originalRelation.modelName}.${originalRelation.foreignFieldName}`
          ];
        if (references?.length) {
          toast.error(
            `Unable to remove field ${
              originalRelation.name
            } as it is being used in ${references
              .map((r) => r.path)
              .join(', ')}`
          );
        }
      }
    }

    onRemove(idx);
  }

  // TODO: Self references (requires a bit of patching for model renames)
  const foreignModelOptions = parsedProject.getModels().map((type) => ({
    label: type.name,
    value: type.name,
  }));

  const attrString = formatFieldAttributes(watchedField);
  const relationErrors = errors.model?.relations?.[idx];

  return (
    <div className={classNames('space-y-4 min-w-[400px] w-1/2', className)}>
      {!isOpen ? (
        <div className="flex flex-row space-x-4 items-center">
          <LinkButton onClick={() => setIsOpen(true)}>Edit</LinkButton>
          <div>
            <strong>{watchedField.name}</strong> ({watchedField.modelName})
            {attrString && `: ${attrString}`}
          </div>
          <LinkButton onClick={() => handleRemove()}>Remove</LinkButton>
        </div>
      ) : (
        <div className="space-y-4 border border-gray-200">
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
          <TextInput.Labelled
            label="Foreign Field Name"
            className="w-full"
            register={register(`model.relations.${idx}.foreignFieldName`)}
            error={relationErrors?.name?.message}
          />
          <TextInput.Labelled
            label="Relationship Name"
            className="w-full"
            register={register(`model.relations.${idx}.relationshipName`, {
              setValueAs: setUndefinedIfEmpty,
            })}
            error={relationErrors?.name?.message}
          />
          <CheckedInput.LabelledController
            label="Is Optional?"
            control={control}
            name={`model.relations.${idx}.isOptional`}
          />
          <div className="flex flex-row space-x-4">
            <SelectInput.LabelledController
              className="flex-1"
              label="On Delete?"
              control={control}
              options={REFERENTIAL_ACTION_OPTIONS}
              name={`model.relations.${idx}.onDelete`}
            />
            <SelectInput.LabelledController
              className="flex-1"
              label="On Update?"
              control={control}
              options={REFERENTIAL_ACTION_OPTIONS}
              name={`model.relations.${idx}.onUpdate`}
            />
          </div>
          <ModelRelationReferencesForm
            formProps={formProps}
            relationIdx={idx}
          />
        </div>
      )}
    </div>
  );
}

export default ModelRelationForm;
