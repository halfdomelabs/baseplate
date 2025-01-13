import type { ModelConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import { modelUniqueConstraintEntityType } from '@halfdomelabs/project-builder-lib';
import {
  Button,
  Dropdown,
  InputField,
  SwitchField,
  toast,
} from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { HiDotsVertical } from 'react-icons/hi';
import { MdOutlineDelete } from 'react-icons/md';

import { useEditedModelConfig } from '../../../../_hooks/useEditedModelConfig';
import { ModelFieldBadges } from './badges/ModelFieldBadges';
import { ModelFieldDefaultValueInput } from './ModelFieldDefaultValueInput';
import { ModelFieldTypeInput } from './ModelFieldTypeInput';
import { ModelPrimaryKeyDialog } from './primary-key/ModelPrimaryKeyDialog';
import { ModelRelationDialog } from './relations/ModelRelationDialog';
import { ModelUniqueConstraintDialog } from './unique-constraints/ModelUniqueConstraintDialog';

interface Props {
  className?: string;
  control: Control<ModelConfig>;
  setValue: UseFormSetValue<ModelConfig>;
  idx: number;
  onRemove: (idx: number) => void;
}

function ModelFieldForm({
  className,
  control,
  idx,
  setValue,
  onRemove,
}: Props): React.JSX.Element {
  const watchedField = useWatch({
    name: `model.fields.${idx}`,
    control,
  });

  const watchedRelations = useWatch({
    name: `model.relations`,
    control,
  });

  const { isPartOfPrimaryKey, hasCompositePrimaryKey, uniqueConstraints } =
    useEditedModelConfig((model) => {
      const { primaryKeyFieldRefs, uniqueConstraints } = model.model;
      return {
        isPartOfPrimaryKey: primaryKeyFieldRefs.includes(watchedField.id),
        hasCompositePrimaryKey: primaryKeyFieldRefs.length > 1,
        uniqueConstraints: uniqueConstraints ?? [],
      };
    });

  const ownUniqueConstraints = uniqueConstraints.filter((uc) =>
    uc.fields.some((f) => f.fieldRef === watchedField.id),
  );
  const usedRelations =
    watchedRelations?.filter((relation) =>
      relation.references.some((r) => r.localRef === watchedField.id),
    ) ?? [];

  const removeError = useEditedModelConfig((model) => {
    // check local references
    if (usedRelations.length > 0) {
      return `Unable to remove field as it is being used in relations ${usedRelations
        .map((r) => r.name)
        .join(', ')}`;
    }
    // check primary keys
    if (isPartOfPrimaryKey && hasCompositePrimaryKey) {
      return `Unable to remove field as it is being used in in the primary key`;
    }
    // check unique constraints
    if (
      model.model.uniqueConstraints?.some((constraint) =>
        constraint.fields.some((f) => f.fieldRef === watchedField.id),
      )
    ) {
      return `Unable to remove field as it is being used in in a unique constraint`;
    }
    return;
  });

  function handleRemove(): void {
    if (removeError) {
      toast.error(removeError);
      return;
    }

    onRemove(idx);

    if (isPartOfPrimaryKey && !hasCompositePrimaryKey) {
      setValue('model.primaryKeyFieldRefs', [], { shouldDirty: true });
    }
  }

  const [isPrimaryKeyDialogOpen, setIsPrimaryKeyDialogOpen] = useState(false);

  const [isUniqueConstraintDialogOpen, setIsUniqueConstraintDialogOpen] =
    useState(false);
  const [uniqueConstriantId, setUniqueConstraintId] = useState<
    string | undefined
  >();

  const [isRelationDialogOpen, setIsRelationDialogOpen] = useState(false);
  const [relationId, setRelationId] = useState<string | undefined>();

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
      <div>
        <SwitchField.Controller
          control={control}
          name={`model.fields.${idx}.isOptional`}
        />
      </div>
      <div className="mr-4">
        <ModelFieldDefaultValueInput
          control={control}
          idx={idx}
          setValue={setValue}
        />
      </div>
      <div>
        <ModelFieldBadges control={control} idx={idx} />
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
                {usedRelations.length === 0 && (
                  <Dropdown.Item
                    onSelect={() => {
                      setIsRelationDialogOpen(true);
                      setRelationId(undefined);
                    }}
                  >
                    Add Relation
                  </Dropdown.Item>
                )}
                {usedRelations.length > 0 &&
                  usedRelations.map((relation) => (
                    <Dropdown.Item
                      key={relation.id}
                      onSelect={() => {
                        setIsRelationDialogOpen(true);
                        setRelationId(relation.id);
                      }}
                    >
                      Edit Relation {usedRelations.length > 1 && relation.name}
                    </Dropdown.Item>
                  ))}
                {!hasCompositePrimaryKey && !isPartOfPrimaryKey && (
                  <Dropdown.Item
                    onSelect={() => {
                      setValue('model.primaryKeyFieldRefs', [watchedField.id], {
                        shouldDirty: true,
                      });
                    }}
                  >
                    Set as Primary Key
                  </Dropdown.Item>
                )}
                {isPartOfPrimaryKey && (
                  <Dropdown.Item
                    onSelect={() => {
                      setIsPrimaryKeyDialogOpen(true);
                    }}
                  >
                    Edit Primary Key
                  </Dropdown.Item>
                )}
                {ownUniqueConstraints.length === 0 &&
                  (hasCompositePrimaryKey || !isPartOfPrimaryKey) && (
                    <Dropdown.Item
                      onSelect={() => {
                        setValue(
                          'model.uniqueConstraints',
                          [
                            ...uniqueConstraints,
                            {
                              id: modelUniqueConstraintEntityType.generateNewId(),
                              fields: [{ fieldRef: watchedField.id }],
                            },
                          ],
                          { shouldDirty: true },
                        );
                      }}
                    >
                      Make Unique
                    </Dropdown.Item>
                  )}
                {ownUniqueConstraints.length > 0 &&
                  ownUniqueConstraints.map((uc, idx) => (
                    <Dropdown.Item
                      key={uc.id}
                      onSelect={() => {
                        setUniqueConstraintId(uc.id);
                        setIsUniqueConstraintDialogOpen(true);
                      }}
                    >
                      Edit Unique Constraint{' '}
                      {ownUniqueConstraints.length > 1 && idx + 1}
                    </Dropdown.Item>
                  ))}
              </Dropdown.Group>
            </Dropdown.Content>
          </Dropdown>
          <ModelPrimaryKeyDialog
            control={control}
            open={isPrimaryKeyDialogOpen}
            onOpenChange={setIsPrimaryKeyDialogOpen}
          />
          <ModelUniqueConstraintDialog
            control={control}
            open={isUniqueConstraintDialogOpen}
            onOpenChange={setIsUniqueConstraintDialogOpen}
            constraintId={uniqueConstriantId}
          />
          <ModelRelationDialog
            control={control}
            open={isRelationDialogOpen}
            onOpenChange={setIsRelationDialogOpen}
            relationId={relationId}
            defaultFieldName={watchedField.name}
          />
          <Button
            variant="ghost"
            onClick={() => {
              handleRemove();
            }}
            size="icon"
          >
            <Button.Icon icon={MdOutlineDelete} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ModelFieldForm;
