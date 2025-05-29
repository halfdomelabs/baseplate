import type {
  ModelConfig,
  ModelConfigInput,
  ModelRelationFieldConfig,
  ModelRelationFieldConfigInput,
  ProjectDefinition,
} from '@halfdomelabs/project-builder-lib';
import type { Control } from 'react-hook-form';

import {
  ModelFieldUtils,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelRelationFieldSchema,
  ModelUtils,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  ComboboxField,
  ComboboxFieldController,
  DialogClose,
  DialogFooter,
  InputFieldController,
  SelectFieldController,
  toast,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import { camelCase } from 'es-toolkit';
import { pluralize } from 'inflection';
import React, { useId, useMemo } from 'react';
import { useController, useForm } from 'react-hook-form';

import { useEditedModelConfig } from '#src/pages/data/models/_hooks/useEditedModelConfig.js';

interface ModelRelationFormProps {
  className?: string;
  control: Control<ModelConfigInput>;
  onSubmitSuccess?: () => void;
  relationId?: string;
  defaultFieldName?: string;
}

/**
 * Tries to guess the model type from the field name
 */
function guessModelTypeFromFieldName(
  definition: ProjectDefinition,
  editedModel: ModelConfigInput,
  fieldName: string | undefined,
): string | undefined {
  if (!fieldName) return;

  const name = fieldName.replace(/Id$/, '');

  const tryFindModel = (
    condition: (m: ModelConfig) => boolean,
  ): string | undefined =>
    definition.models.find((m) => m.id !== editedModel.id && condition(m))?.id;

  // try to find a model with the exact name first
  const modelWithName = tryFindModel(
    (m) => m.name.toLowerCase() === name.toLowerCase(),
  );
  if (modelWithName) return modelWithName;

  // try to find a model with the same feature and a similar name
  const modelWithFeature = tryFindModel(
    (m) =>
      m.featureRef === m.featureRef &&
      m.name.toLowerCase().includes(name.toLowerCase()),
  );
  if (modelWithFeature) return modelWithFeature;

  // try to find a model with a similar name
  const modelWithSimilarName = tryFindModel((m) =>
    m.name.toLowerCase().includes(name.toLowerCase()),
  );
  return modelWithSimilarName;
}

/**
 * Tries to guess the default values for a relation field based on the model
 */
function getRelationDefaultsFromModel(
  definition: ProjectDefinition,
  editedModel: ModelConfigInput,
  editedRelation: Partial<ModelRelationFieldConfigInput>,
  defaultFieldName?: string,
): Pick<
  ModelRelationFieldConfig,
  'foreignRelationName' | 'name' | 'references'
> {
  // default the name to the local field name if it ends with Id
  const name = (() => {
    if (editedRelation.name) return editedRelation.name;
    if (editedRelation.modelRef) {
      const model = ModelUtils.byIdOrThrow(definition, editedRelation.modelRef);
      return camelCase(model.name);
    }
    return;
  })();

  const references = (() => {
    if (!editedRelation.modelRef) return;
    const {
      model: { fields, primaryKeyFieldRefs },
      name: foreignName,
    } = ModelUtils.byIdOrThrow(definition, editedRelation.modelRef);
    const primaryKeys = fields.filter((f) =>
      primaryKeyFieldRefs.includes(f.id),
    );
    const existingReferences = editedRelation.references ?? [];
    return primaryKeys.map((primaryKey, i) => {
      const bestGuessLocalName = (() => {
        if (i === 0 && defaultFieldName) return defaultFieldName;
        if (primaryKeys.length === 1) return `${camelCase(foreignName)}Id`;
        return primaryKey.name;
      })();
      const bestGuessLocal =
        existingReferences[i]?.localRef ??
        editedModel.model.fields.find((f) => f.name === bestGuessLocalName)?.id;
      return {
        localRef: bestGuessLocal,
        foreignRef: primaryKey.id,
      };
    });
  })();

  const foreignRelationName = (() => {
    if (!references) return;
    if (editedRelation.foreignRelationName) {
      return editedRelation.foreignRelationName;
    }
    const isOneToOne =
      references.every((ref) => ref.localRef) &&
      ModelFieldUtils.areScalarsUnique(
        editedModel,
        references.map((r) => r.localRef),
      );
    return camelCase(
      isOneToOne ? editedModel.name : pluralize(editedModel.name),
    );
  })();

  return {
    name: name ?? '',
    foreignRelationName: foreignRelationName ?? '',
    references: references ?? [],
  };
}

export function ModelRelationForm({
  className,
  control: modelControl,
  onSubmitSuccess,
  relationId,
  defaultFieldName,
}: ModelRelationFormProps): React.JSX.Element {
  const { definition } = useProjectDefinition();
  const editedModel = useEditedModelConfig((model) => model);
  const modelName = editedModel.name;
  const { fields } = editedModel.model;
  const {
    field: { value: modelRelations = [], onChange: onModelRelationsChange },
  } = useController({
    name: `model.relations`,
    control: modelControl,
  });

  const foreignModelOptions = definition.models.map((type) => ({
    label: type.name,
    value: type.id,
  }));

  const modelRelation =
    relationId === undefined
      ? undefined
      : modelRelations.find((item) => item.id === relationId);

  const defaultValues = useMemo((): ModelRelationFieldConfigInput => {
    if (modelRelation) return modelRelation;
    const modelRef = guessModelTypeFromFieldName(
      definition,
      editedModel,
      defaultFieldName,
    );
    return {
      id: modelLocalRelationEntityType.generateNewId(),
      foreignId: modelForeignRelationEntityType.generateNewId(),
      modelRef: modelRef ?? '',
      onDelete: 'Restrict',
      onUpdate: 'Restrict',
      ...getRelationDefaultsFromModel(
        definition,
        editedModel,
        {
          modelRef,
        },
        defaultFieldName,
      ),
    };
  }, [modelRelation, defaultFieldName, definition, editedModel]);

  const { control, handleSubmit, setError, watch, setValue } = useForm({
    resolver: zodResolver(modelRelationFieldSchema),
    defaultValues,
  });

  const relation = watch();

  const foreignModel = relation.modelRef
    ? definition.models.find((m) => m.id === relation.modelRef)
    : undefined;

  const foreignFields = foreignModel?.model.fields;

  const localFieldOptions = fields.map((f) => ({
    label: f.name,
    value: f.id,
  }));

  const foreignFieldOptions =
    foreignFields?.map((f) => ({
      label: f.name,
      value: f.id,
    })) ?? [];

  const isRelationOptional = relation.references.some(
    (ref) => fields.find((f) => f.id === ref.localRef)?.isOptional,
  );

  const onDelete = (): void => {
    onModelRelationsChange(
      modelRelations.filter((relation) => relation.id !== relationId),
    );
    onSubmitSuccess?.();
  };

  const onSubmit = handleSubmit((data): void => {
    const { id } = data;

    if (
      fields.some((field) => field.name === data.name) ||
      modelRelations.some(
        (relation) => relation.name === data.name && relation.id !== data.id,
      )
    ) {
      setError('name', {
        message:
          'The relation name cannot be the same as a field/relation name',
      });
      return;
    }

    // look for duplicate local fields
    const localFields = data.references.map((ref) => ref.localRef);
    if (new Set(localFields).size !== localFields.length) {
      toast.error('Local fields must be unique');
      return;
    }

    const foreignFields = data.references.map((ref) => ref.foreignRef);
    if (new Set(foreignFields).size !== foreignFields.length) {
      toast.error('Foreign fields must be unique');
      return;
    }

    // replace the existing relation with the new one if it exists
    if (modelRelations.some((relation) => relation.id === id)) {
      onModelRelationsChange(
        modelRelations.map((relation) =>
          relation.id === id ? data : relation,
        ),
      );
    } else {
      onModelRelationsChange([...modelRelations, data]);
    }
    onSubmitSuccess?.();
  });

  const formId = useId();

  const hasSelectedForeignModel = !!foreignModel;

  return (
    <form
      className={clsx('space-y-4', className)}
      onSubmit={(e) => {
        e.stopPropagation();
        return onSubmit(e);
      }}
      id={formId}
    >
      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
        <ComboboxField
          options={[{ label: modelName, value: modelName }]}
          value={modelName}
          disabled
          label="Local Model"
        />
        <ComboboxFieldController
          control={control}
          name="modelRef"
          options={foreignModelOptions}
          label="Foreign Model"
          onChange={(value) => {
            if (!value) return;
            const { foreignRelationName, name, references } =
              getRelationDefaultsFromModel(
                definition,
                editedModel,
                {
                  ...relation,
                  modelRef: value,
                },
                defaultFieldName,
              );
            if (foreignRelationName) {
              setValue('foreignRelationName', foreignRelationName);
            }
            if (name) {
              setValue('name', name);
            }
            setValue('references', references);
          }}
        />
      </div>
      <div
        className={clsx(
          'grid grid-cols-2 gap-x-8 gap-y-2',
          !hasSelectedForeignModel && 'pointer-events-none opacity-50',
        )}
      >
        <InputFieldController
          control={control}
          disabled={!hasSelectedForeignModel}
          name="name"
          label="Local Relation Name"
          description={
            <span>
              Name of the relation, e.g. {camelCase(modelName)}.
              <strong>
                {foreignModel?.name ? camelCase(foreignModel.name) : 'user'}
              </strong>
            </span>
          }
        />
        <InputFieldController
          control={control}
          disabled={!hasSelectedForeignModel}
          name="foreignRelationName"
          label="Foreign Relation Name"
          description={
            <span>
              Name of the relation on the foreign model, e.g.{' '}
              {camelCase(foreignModel?.name ?? 'post')}.
              <strong>{defaultValues.foreignRelationName || 'user'}</strong>
            </span>
          }
        />
        <div className="text-sm font-medium">Local Field</div>
        <div className="text-sm font-medium">Foreign Field</div>
        {relation.references.map((_, i) => (
          <React.Fragment key={i}>
            <ComboboxFieldController
              disabled={!hasSelectedForeignModel}
              control={control}
              name={`references.${i}.localRef`}
              options={localFieldOptions}
            />
            <ComboboxFieldController
              control={control}
              name={`references.${i}.foreignRef`}
              options={foreignFieldOptions}
              disabled
            />
          </React.Fragment>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-t pt-4">
        <SelectFieldController
          label="On Delete"
          control={control}
          options={[
            { label: 'Cascade (delete entire local row)', value: 'Cascade' },
            { label: 'Restrict (throw error)', value: 'Restrict' },
            ...(isRelationOptional
              ? [
                  {
                    label: 'Set Null (set local field to null)',
                    value: 'SetNull',
                  },
                ]
              : []),
          ]}
          name="onDelete"
          description="What to do when the foreign row is deleted"
        />
      </div>
      <DialogFooter>
        <div className="flex w-full justify-between">
          {relationId && (
            <Button
              variant="secondary"
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
            >
              Delete
            </Button>
          )}
          <div className="flex gap-4">
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              form={formId}
              disabled={!hasSelectedForeignModel}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogFooter>
    </form>
  );
}
