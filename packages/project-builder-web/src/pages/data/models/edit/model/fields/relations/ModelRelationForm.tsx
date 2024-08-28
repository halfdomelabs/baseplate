import {
  ModelConfig,
  ModelFieldUtils,
  ModelRelationFieldConfig,
  ModelUtils,
  ProjectDefinition,
  modelRelationFieldSchema,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  ComboboxField,
  Dialog,
  InputField,
  SelectField,
  toast,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import { camelCase } from 'es-toolkit';
import { pluralize } from 'inflection';
import React, { useId, useMemo } from 'react';
import { Control, useController, useForm } from 'react-hook-form';

import { useEditedModelConfig } from '@src/pages/data/models/hooks/useEditedModelConfig';

interface ModelRelationFormProps {
  className?: string;
  control: Control<ModelConfig>;
  onSubmitSuccess?: () => void;
  relationId?: string;
  defaultFieldName?: string;
}

/**
 * Tries to guess the model type from the field name
 */
function guessModelTypeFromFieldName(
  definition: ProjectDefinition,
  editedModel: ModelConfig,
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
      m.feature === m.feature &&
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
  editedModel: ModelConfig,
  editedRelation: Partial<ModelRelationFieldConfig>,
  defaultFieldName?: string,
): Pick<
  Partial<ModelRelationFieldConfig>,
  'foreignRelationName' | 'name' | 'references'
> {
  // default the name to the local field name if it ends with Id
  const name = (() => {
    if (editedRelation.name) return editedRelation.name;
    if (editedRelation.modelName) {
      const model = ModelUtils.byIdOrThrow(
        definition,
        editedRelation.modelName,
      );
      return camelCase(model.name);
    }
    return undefined;
  })();

  const references = (() => {
    if (!editedRelation.modelName) return undefined;
    const {
      model: { fields, primaryKeyFieldRefs },
      name: foreignName,
    } = ModelUtils.byIdOrThrow(definition, editedRelation.modelName);
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
        existingReferences[i]?.local ??
        editedModel.model.fields.find((f) => f.name === bestGuessLocalName)?.id;
      return {
        local: bestGuessLocal,
        foreign: primaryKey.id,
      };
    });
  })();

  const foreignRelationName = (() => {
    if (!references) return;
    if (editedRelation.foreignRelationName) {
      return editedRelation.foreignRelationName;
    }
    const isOneToOne = references?.every((ref) =>
      ModelFieldUtils.isScalarUnique(editedModel, ref.local),
    );
    return camelCase(
      isOneToOne ? editedModel.name : pluralize(editedModel.name),
    );
  })();

  return {
    name,
    foreignRelationName,
    references,
  };
}

export function ModelRelationForm({
  className,
  control: modelControl,
  onSubmitSuccess,
  relationId,
  defaultFieldName,
}: ModelRelationFormProps): JSX.Element {
  const { definition } = useProjectDefinition();
  const editedModel = useEditedModelConfig((model) => model);
  const modelName = editedModel.name;
  const fields = editedModel.model.fields;
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

  const defaultValues = useMemo((): Partial<ModelRelationFieldConfig> => {
    if (modelRelation) return modelRelation;
    const modelRef = guessModelTypeFromFieldName(
      definition,
      editedModel,
      defaultFieldName,
    );
    return {
      modelName: modelRef ?? '',
      references: [],
      onDelete: 'Restrict',
      onUpdate: 'Restrict',
      ...getRelationDefaultsFromModel(
        definition,
        editedModel,
        {
          modelName: modelRef,
        },
        defaultFieldName,
      ),
    };
  }, [modelRelation, defaultFieldName, definition, editedModel]);

  const { control, handleSubmit, setError, watch, setValue } =
    useForm<ModelRelationFieldConfig>({
      resolver: zodResolver(modelRelationFieldSchema),
      defaultValues,
    });

  const relation = watch();

  const foreignModel = relation.modelName
    ? definition.models.find((m) => m.id === relation.modelName)
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

  const isRelationOptional = relation.references?.some(
    (ref) => fields.find((f) => f.id === ref.local)?.isOptional,
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
    const localFields = data.references.map((ref) => ref.local);
    if (new Set(localFields).size !== localFields.length) {
      toast.error('Local fields must be unique');
      return;
    }

    const foreignFields = data.references.map((ref) => ref.foreign);
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
        <ComboboxField.Controller
          control={control}
          name="modelName"
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
                  modelName: value,
                },
                defaultFieldName,
              );
            if (foreignRelationName) {
              setValue('foreignRelationName', foreignRelationName);
            }
            if (name) {
              setValue('name', name);
            }
            if (references) {
              setValue('references', references);
            }
          }}
        />
      </div>
      <div
        className={clsx(
          'grid grid-cols-2 gap-x-8 gap-y-2',
          !hasSelectedForeignModel && 'pointer-events-none opacity-50',
        )}
      >
        <InputField.Controller
          control={control}
          disabled={!hasSelectedForeignModel}
          name="name"
          label="Local Relation Name"
          description={
            <span>
              Name of the relation, e.g. {camelCase(modelName)}.
              <strong>
                {foreignModel?.name ? camelCase(foreignModel?.name) : 'user'}
              </strong>
            </span>
          }
        />
        <InputField.Controller
          control={control}
          disabled={!hasSelectedForeignModel}
          name="foreignRelationName"
          label="Foreign Relation Name"
          description={
            <span>
              Name of the relation on the foreign model, e.g.{' '}
              {camelCase(foreignModel?.name ?? 'post')}.
              <strong>{defaultValues.foreignRelationName ?? 'user'}</strong>
            </span>
          }
        />
        <div className="text-sm font-medium">Local Field</div>
        <div className="text-sm font-medium">Foreign Field</div>
        {relation.references?.map((_, i) => (
          <React.Fragment key={i}>
            <ComboboxField.Controller
              disabled={!hasSelectedForeignModel}
              control={control}
              name={`references.${i}.local`}
              options={localFieldOptions}
            />
            <ComboboxField.Controller
              control={control}
              name={`references.${i}.foreign`}
              options={foreignFieldOptions}
              disabled
            />
          </React.Fragment>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-t pt-4">
        <SelectField.Controller
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
      <Dialog.Footer>
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
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Button
              type="submit"
              form={formId}
              disabled={!hasSelectedForeignModel}
            >
              Save
            </Button>
          </div>
        </div>
      </Dialog.Footer>
    </form>
  );
}
