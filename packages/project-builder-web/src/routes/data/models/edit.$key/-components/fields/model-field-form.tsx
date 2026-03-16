import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import {
  modelIndexEntityType,
  modelUniqueConstraintEntityType,
} from '@baseplate-dev/project-builder-lib';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InputFieldController,
  SwitchFieldController,
  toast,
} from '@baseplate-dev/ui-components';
import clsx from 'clsx';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { HiDotsVertical } from 'react-icons/hi';
import { MdOutlineDelete } from 'react-icons/md';

import { ModelFieldBadges } from './badges/model-field-badges.js';
import { ModelIndexDialog } from './indexes/model-index-dialog.js';
import { ModelFieldDefaultValueInput } from './model-field-default-value-input.js';
import { ModelFieldTypeInput } from './model-field-type-input.js';
import { ModelPrimaryKeyDialog } from './primary-key/model-primary-key-dialog.js';
import { ModelRelationDialog } from './relations/model-relation-dialog.js';
import { ModelUniqueConstraintDialog } from './unique-constraints/model-unique-constraint-dialog.js';

interface Props {
  className?: string;
  control: Control<ModelConfigInput>;
  setValue: UseFormSetValue<ModelConfigInput>;
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
  const watchedField = useWatch({ control, name: `model.fields.${idx}` });

  const watchedRelations = useWatch({ control, name: 'model.relations' });

  const primaryKeyFieldRefs = useWatch({
    control,
    name: 'model.primaryKeyFieldRefs',
  });
  const uniqueConstraints =
    useWatch({ control, name: 'model.uniqueConstraints' }) ?? [];
  const indexes = useWatch({ control, name: 'model.indexes' }) ?? [];
  const isPartOfPrimaryKey = primaryKeyFieldRefs.includes(watchedField.id);
  const hasCompositePrimaryKey = primaryKeyFieldRefs.length > 1;

  const ownUniqueConstraints = uniqueConstraints.filter((uc) =>
    uc.fields.some((f) => f.fieldRef === watchedField.id),
  );
  const ownIndexes = indexes.filter((idx) =>
    idx.fields.some((f) => f.fieldRef === watchedField.id),
  );
  const usedRelations =
    watchedRelations?.filter((relation) =>
      relation.references.some((r) => r.localRef === watchedField.id),
    ) ?? [];

  const removeError = (() => {
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
      uniqueConstraints.some((constraint) =>
        constraint.fields.some((f) => f.fieldRef === watchedField.id),
      )
    ) {
      return `Unable to remove field as it is being used in in a unique constraint`;
    }
    // check indexes
    if (
      indexes.some((idx) =>
        idx.fields.some((f) => f.fieldRef === watchedField.id),
      )
    ) {
      return `Unable to remove field as it is being used in an index`;
    }
    return;
  })();

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

  const [isIndexDialogOpen, setIsIndexDialogOpen] = useState(false);
  const [indexId, setIndexId] = useState<string | undefined>();

  const [isRelationDialogOpen, setIsRelationDialogOpen] = useState(false);
  const [relationId, setRelationId] = useState<string | undefined>();

  return (
    <div className={clsx('items-center', className)}>
      <div>
        <InputFieldController
          control={control}
          name={`model.fields.${idx}.name`}
        />
      </div>
      <div>
        <ModelFieldTypeInput control={control} idx={idx} />
      </div>
      <div>
        <SwitchFieldController
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
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" />}
            >
              <HiDotsVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                {usedRelations.length === 0 && (
                  <DropdownMenuItem
                    onClick={() => {
                      setIsRelationDialogOpen(true);
                      setRelationId(undefined);
                    }}
                  >
                    Add Relation
                  </DropdownMenuItem>
                )}
                {usedRelations.length > 0 &&
                  usedRelations.map((relation) => (
                    <DropdownMenuItem
                      key={relation.id}
                      onClick={() => {
                        setIsRelationDialogOpen(true);
                        setRelationId(relation.id);
                      }}
                    >
                      Edit Relation {usedRelations.length > 1 && relation.name}
                    </DropdownMenuItem>
                  ))}
                {!hasCompositePrimaryKey && !isPartOfPrimaryKey && (
                  <DropdownMenuItem
                    onClick={() => {
                      setValue('model.primaryKeyFieldRefs', [watchedField.id], {
                        shouldDirty: true,
                      });
                    }}
                  >
                    Set as Primary Key
                  </DropdownMenuItem>
                )}
                {isPartOfPrimaryKey && (
                  <DropdownMenuItem
                    onClick={() => {
                      setIsPrimaryKeyDialogOpen(true);
                    }}
                  >
                    Edit Primary Key
                  </DropdownMenuItem>
                )}
                {ownUniqueConstraints.length === 0 &&
                  (hasCompositePrimaryKey || !isPartOfPrimaryKey) && (
                    <DropdownMenuItem
                      onClick={() => {
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
                    </DropdownMenuItem>
                  )}
                {ownUniqueConstraints.length > 0 &&
                  ownUniqueConstraints.map((uc, ucIdx) => (
                    <DropdownMenuItem
                      key={uc.id}
                      onClick={() => {
                        setUniqueConstraintId(uc.id);
                        setIsUniqueConstraintDialogOpen(true);
                      }}
                    >
                      Edit Unique Constraint{' '}
                      {ownUniqueConstraints.length > 1 && ucIdx + 1}
                    </DropdownMenuItem>
                  ))}
                {ownIndexes.length === 0 && (
                  <DropdownMenuItem
                    onClick={() => {
                      setValue(
                        'model.indexes',
                        [
                          ...indexes,
                          {
                            id: modelIndexEntityType.generateNewId(),
                            fields: [{ fieldRef: watchedField.id }],
                          },
                        ],
                        { shouldDirty: true },
                      );
                    }}
                  >
                    Add Index
                  </DropdownMenuItem>
                )}
                {ownIndexes.length > 0 &&
                  ownIndexes.map((ownIdx, idxNum) => (
                    <DropdownMenuItem
                      key={ownIdx.id}
                      onClick={() => {
                        setIndexId(ownIdx.id);
                        setIsIndexDialogOpen(true);
                      }}
                    >
                      Edit Index {ownIndexes.length > 1 && idxNum + 1}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <ModelIndexDialog
            control={control}
            open={isIndexDialogOpen}
            onOpenChange={setIsIndexDialogOpen}
            indexId={indexId}
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
            <MdOutlineDelete />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ModelFieldForm;
