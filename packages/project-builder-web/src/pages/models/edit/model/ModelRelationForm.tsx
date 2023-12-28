import {
  ModelConfig,
  ModelRelationFieldConfig,
  REFERENTIAL_ACTIONS,
} from '@halfdomelabs/project-builder-lib';
import classNames from 'classnames';
import { useState } from 'react';
import { Control, useWatch } from 'react-hook-form';

import ModelRelationReferencesForm from './ModelRelationReferencesForm';
import { LinkButton, SelectInput, TextInput } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useToast } from 'src/hooks/useToast';

interface Props {
  className?: string;
  idx: number;
  field: ModelRelationFieldConfig;
  onRemove: (idx: number) => void;
  originalModel?: ModelConfig;
  control: Control<ModelConfig>;
}

function formatFieldAttributes(field: ModelRelationFieldConfig): string {
  const attrStrings: string[] = [];
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
  idx,
  field,
  onRemove,
  originalModel,
  control,
}: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState(!field.name);

  const { parsedProject, definitionContainer } = useProjectConfig();
  const watchedField = useWatch({ name: `model.relations.${idx}`, control });

  const toast = useToast();
  function handleRemove(): void {
    // check for references
    if (originalModel) {
      const originalRelation = originalModel.model.relations?.find(
        (f) => f.uid === watchedField.uid,
      );
      if (originalRelation) {
        const references =
          parsedProject.references.modelForeignRelation?.[
            `${originalRelation.modelName}.${originalRelation.foreignRelationName}`
          ];
        if (references?.length) {
          toast.error(
            `Unable to remove field ${
              originalRelation.name
            } as it is being used in ${references
              .map((r) => r.path)
              .join(', ')}`,
          );
        }
      }
    }

    onRemove(idx);
  }

  // TODO: Self references (requires a bit of patching for model renames)
  const foreignModelOptions = parsedProject.getModels().map((type) => ({
    label: type.name,
    value: type.id,
  }));

  if (!watchedField) {
    return <div />;
  }

  const attrString = formatFieldAttributes(watchedField);

  return (
    <div className={classNames('w-1/2 min-w-[400px] space-y-4', className)}>
      {!isOpen ? (
        <div className="flex flex-row items-center space-x-4">
          <LinkButton onClick={() => setIsOpen(true)}>Edit</LinkButton>
          <div>
            <strong>{watchedField.name}</strong> (
            {definitionContainer.nameFromId(watchedField.modelName)})
            {attrString && `: ${attrString}`}
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
            control={control}
            label="Name"
            className="w-full"
            name={`model.relations.${idx}.name`}
          />
          <SelectInput.LabelledController
            label="Foreign Model"
            options={foreignModelOptions}
            control={control}
            name={`model.relations.${idx}.modelName`}
          />
          <TextInput.LabelledController
            label="Foreign Field Name"
            className="w-full"
            control={control}
            name={`model.relations.${idx}.foreignRelationName`}
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
          <ModelRelationReferencesForm control={control} relationIdx={idx} />
        </div>
      )}
    </div>
  );
}

export default ModelRelationForm;
