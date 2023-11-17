import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import {
  Badge,
  Button,
  Dropdown,
  InputField,
  SwitchField,
} from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Control, useWatch } from 'react-hook-form';
import { HiDotsVertical, HiOutlineTrash } from 'react-icons/hi';
import { TbLink } from 'react-icons/tb';

import { ModelFieldDefaultValueInput } from './ModelFieldDefaultValueInput';
import { ModalRelationsModal } from './ModelFieldRelationModal';
import { ModelFieldTypeInput } from './ModelFieldTypeInput';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useToast } from 'src/hooks/useToast';

interface Props {
  className?: string;
  control: Control<ModelConfig>;
  idx: number;
  onRemove: (idx: number) => void;
  originalModel?: ModelConfig;
  fixReferences: () => void;
}

function ModelFieldForm({
  className,
  control,
  idx,
  onRemove,
  originalModel,
  fixReferences,
}: Props): JSX.Element {
  const watchedField = useWatch({
    name: `model.fields.${idx}`,
    control,
  });

  const watchedRelations = useWatch({
    name: `model.relations`,
    control,
  });

  const watchedPrimaryKeys = useWatch({
    name: `model.primaryKeys`,
    control,
  });

  const watchedUniqueConstraints = useWatch({
    name: `model.uniqueConstraints`,
    control,
  });

  const { parsedProject } = useProjectConfig();
  const toast = useToast();

  useEffect(() => {
    fixReferences();
  }, [fixReferences, watchedField.name]);

  function handleRemove(): void {
    // check for references
    if (originalModel) {
      const originalField = originalModel.model.fields.find(
        (f) => f.uid === watchedField.uid,
      );
      if (originalField) {
        const references = parsedProject.references.modelField?.[
          `${originalModel.name}.${originalField.name}`
        ]?.filter(
          (ref) =>
            ref.referenceType !== 'modelPrimaryKey' &&
            ref.referenceType !== 'modelLocalRelation',
        );
        if (references?.length) {
          toast.error(
            `Unable to remove field ${
              originalField.name
            } as it is being used in ${references
              .map((r) => r.path)
              .join(', ')}`,
          );
          return;
        }
      }
    }
    // check local references
    const usedRelations = watchedRelations?.filter((relation) =>
      relation.references.some(
        (r) => watchedField.name && r.local.includes(watchedField.name),
      ),
    );
    if (usedRelations?.length) {
      toast.error(
        `Unable to remove field as it is being used in relations ${usedRelations
          .map((r) => r.name)
          .join(', ')}`,
      );
      return;
    }

    // check primary keys
    if (watchedPrimaryKeys?.includes(watchedField.name)) {
      toast.error(
        `Unable to remove field as it is being used in in the primary key`,
      );
      return;
    }

    // check unique constraints
    if (
      watchedUniqueConstraints?.some(
        (constraint) => constraint.name === watchedField.name,
      )
    ) {
      toast.error(
        `Unable to remove field as it is being used in in a unique constraint`,
      );
      return;
    }

    onRemove(idx);
  }

  const modelFieldRelation = watchedRelations?.find(
    (r) =>
      r.references.length === 1 && r.references[0].local === watchedField.name,
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
            {modelFieldRelation.modelName}
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
