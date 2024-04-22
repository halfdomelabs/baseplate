import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import {
  Badge,
  Button,
  Dropdown,
  InputField,
  SwitchField,
} from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useState } from 'react';
import { Control, useWatch } from 'react-hook-form';
import { HiDotsVertical, HiOutlineTrash } from 'react-icons/hi';
import { TbLink } from 'react-icons/tb';


import { ModelFieldDefaultValueInput } from './ModelFieldDefaultValueInput';
import { ModalRelationsModal } from './ModelFieldRelationModal';
import { ModelFieldTypeInput } from './ModelFieldTypeInput';
import { useEditedModelConfig } from '../../hooks/useEditedModelConfig';
import { useProjectDefinition } from 'src/hooks/useProjectDefinition';
import { useToast } from 'src/hooks/useToast';

interface Props {
  className?: string;
  control: Control<ModelConfig>;
  idx: number;
  onRemove: (idx: number) => void;
}

function ModelFieldForm({
  className,
  control,
  idx,
  onRemove,
}: Props): JSX.Element {
  const watchedField = useWatch({
    name: `model.fields.${idx}`,
    control,
  });

  const watchedRelations = useWatch({
    name: `model.relations`,
    control,
  });

  const { definitionContainer } = useProjectDefinition();
  const toast = useToast();

  const removeError = useEditedModelConfig((model) => {
    const field = model.model.fields[idx];
    // check local references
    const usedRelations = model.model.relations?.filter((relation) =>
      relation.references.some((r) => r.local === field.id),
    );
    if (usedRelations?.length) {
      return `Unable to remove field as it is being used in relations ${usedRelations
        .map((r) => r.name)
        .join(', ')}`;
    }
    // check primary keys
    if (model.model.primaryKeys?.includes(field.id)) {
      return `Unable to remove field as it is being used in in the primary key`;
    }
    // check unique constraints
    if (
      model.model.uniqueConstraints?.some((constraint) =>
        constraint.fields.some((f) => f.name === watchedField.id),
      )
    ) {
      return `Unable to remove field as it is being used in in a unique constraint`;
    }
    return undefined;
  });

  function handleRemove(): void {
    if (removeError) {
      toast.error(removeError);
      return;
    }

    onRemove(idx);
  }

  const modelFieldRelation = watchedRelations?.find(
    (r) =>
      r.references.length === 1 && r.references[0].local === watchedField.id,
  );

  const [isRelationFormOpen, setIsRelationFormOpen] = useState(false);

  return (
    <div className={clsx('items-center', className)}>
      <div>
        <InputField.Controller
          control={control}
          name={`model.fields.${idx}.name`}
        />
      </div>
      <div>
        <ModelFieldTypeInput control={control} idx={idx} />
      </div>
      <div className="mr-4">
        <ModelFieldDefaultValueInput control={control} idx={idx} />
      </div>
      <div>
        <SwitchField.Controller
          control={control}
          name={`model.fields.${idx}.isId`}
        />
      </div>
      <div>
        <SwitchField.Controller
          control={control}
          name={`model.fields.${idx}.isOptional`}
        />
      </div>
      <div>
        <SwitchField.Controller
          control={control}
          name={`model.fields.${idx}.isUnique`}
        />
      </div>
      <div>
        {modelFieldRelation && (
          <Badge.WithIcon
            className="max-w-[100px]"
            variant="secondary"
            icon={TbLink}
            onClick={() => setIsRelationFormOpen(true)}
          >
            {definitionContainer.nameFromId(modelFieldRelation.modelName)}
          </Badge.WithIcon>
        )}
        <ModalRelationsModal
          isOpen={isRelationFormOpen}
          onClose={() => setIsRelationFormOpen(false)}
          fieldIdx={idx}
          control={control}
        />
      </div>
      <div>
        <div className="space-x-4">
          <Dropdown>
            <Dropdown.Trigger asChild>
              <Button variant="ghost" size="icon">
                <Button.Icon icon={HiDotsVertical} />
              </Button>
            </Dropdown.Trigger>
            <Dropdown.Content>
              <Dropdown.Group>
                <Dropdown.Item onSelect={() => setIsRelationFormOpen(true)}>
                  {modelFieldRelation ? 'Edit' : 'Add'} Relation
                </Dropdown.Item>
              </Dropdown.Group>
            </Dropdown.Content>
          </Dropdown>
          <Button variant="ghost" onClick={() => handleRemove()} size="icon">
            <Button.Icon icon={HiOutlineTrash} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ModelFieldForm;
