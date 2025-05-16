import type { ModelConfigInput } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import { modelUniqueConstraintEntityType } from '@halfdomelabs/project-builder-lib';
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
} from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useState } from 'react';
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
  const watchedField = useEditedModelConfig((model) => model.model.fields[idx]);

  const watchedRelations = useEditedModelConfig(
    (model) => model.model.relations,
  );

  const model = useEditedModelConfig((model) => model.model);
  const isPartOfPrimaryKey = model.primaryKeyFieldRefs.includes(
    watchedField.id,
  );
  const hasCompositePrimaryKey = model.primaryKeyFieldRefs.length > 1;
  const uniqueConstraints = model.uniqueConstraints ?? [];

  const ownUniqueConstraints = uniqueConstraints.filter((uc) =>
    uc.fields.some((f) => f.fieldRef === watchedField.id),
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
      model.uniqueConstraints?.some((constraint) =>
        constraint.fields.some((f) => f.fieldRef === watchedField.id),
      )
    ) {
      return `Unable to remove field as it is being used in in a unique constraint`;
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

  const [isRelationDialogOpen, setIsRelationDialogOpen] = useState(false);
  const [relationId, setRelationId] = useState<string | undefined>();

  return (
    <div className={clsx('items-start', className)}>
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
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <HiDotsVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                {usedRelations.length === 0 && (
                  <DropdownMenuItem
                    onSelect={() => {
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
                      onSelect={() => {
                        setIsRelationDialogOpen(true);
                        setRelationId(relation.id);
                      }}
                    >
                      Edit Relation {usedRelations.length > 1 && relation.name}
                    </DropdownMenuItem>
                  ))}
                {!hasCompositePrimaryKey && !isPartOfPrimaryKey && (
                  <DropdownMenuItem
                    onSelect={() => {
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
                    onSelect={() => {
                      setIsPrimaryKeyDialogOpen(true);
                    }}
                  >
                    Edit Primary Key
                  </DropdownMenuItem>
                )}
                {ownUniqueConstraints.length === 0 &&
                  (hasCompositePrimaryKey || !isPartOfPrimaryKey) && (
                    <DropdownMenuItem
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
                    </DropdownMenuItem>
                  )}
                {ownUniqueConstraints.length > 0 &&
                  ownUniqueConstraints.map((uc, idx) => (
                    <DropdownMenuItem
                      key={uc.id}
                      onSelect={() => {
                        setUniqueConstraintId(uc.id);
                        setIsUniqueConstraintDialogOpen(true);
                      }}
                    >
                      Edit Unique Constraint{' '}
                      {ownUniqueConstraints.length > 1 && idx + 1}
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
