import {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ModelUtils,
  ProjectDefinition,
  REFERENTIAL_ACTIONS,
  VALIDATORS,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
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
import { pluralize } from 'inflection';
import { camelCase } from 'lodash';
import { useId, useMemo } from 'react';
import {
  Control,
  UseFormSetValue,
  useController,
  useFieldArray,
  useForm,
} from 'react-hook-form';

import { useEditedModelConfig } from '../../../hooks/useEditedModelConfig';

interface ModelFieldRelationFormProps {
  control: Control<ModelConfig>;
  setValue: UseFormSetValue<ModelConfig>;
  /**
   * For new fields, the default local field to use
   */
  defaultFieldIdx?: number;
  relationIdx?: number;
  onSubmitSuccess?: () => void;
}

function getRelationDefaults(
  definition: ProjectDefinition,
  editedModel: ModelConfig,
  editedRelation: Partial<ModelRelationFieldConfig>,
): Partial<ModelRelationFieldConfig> {
  const localFieldId =
    editedRelation.references?.length === 1
      ? editedRelation.references?.[0].local
      : undefined;
  const localFieldName = !localFieldId
    ? undefined
    : editedModel.model.fields.find((f) => f.id === localFieldId)?.name;

  // default the name to the local field name if it ends with Id
  const name = (() => {
    if (editedRelation.name) return editedRelation.name;
    if (localFieldName?.endsWith('Id')) {
      return localFieldName.replace(/Id$/, '');
    }
    if (editedRelation.modelName) {
      return camelCase(editedRelation.modelName);
    }
    return undefined;
  })();

  // default the foreign model to the most similar sounding model
  const modelName = (() => {
    if (editedRelation.modelName) return editedRelation.modelName;
    if (name) {
      const similarModel = definition.models.find(
        (m) =>
          m.id !== editedModel.id &&
          m.name.toLowerCase().includes(name.toLowerCase()),
      );
      return similarModel?.name;
    }
    return undefined;
  })();

  const references = (() => {
    if (
      editedRelation.references?.length === 1 &&
      !editedRelation.references[0].foreign &&
      modelName
    ) {
      return [
        {
          ...editedRelation.references[0],
          foreign:
            ModelUtils.byIdOrThrow(definition, modelName).model.fields.find(
              (f) => f.isId,
            )?.id ?? '',
        },
      ];
    }
    return editedRelation.references;
  })();

  return {
    name,
    modelName,
    references,
  };
}

export function ModelFieldRelationForm({
  control: modelControl,
  setValue: modelSetValue,
  defaultFieldIdx,
  relationIdx,
  onSubmitSuccess,
}: ModelFieldRelationFormProps): JSX.Element {
  const { definition } = useProjectDefinition();
  const modelName = useEditedModelConfig((model) => model.name);
  const existingRelation = useEditedModelConfig(({ model }) => {
    if (!relationIdx) return undefined;
    return model.relations?.[relationIdx];
  });
  const defaultField = useEditedModelConfig(({ model }) => {
    if (!defaultFieldIdx) return undefined;
    return model.fields[defaultFieldIdx];
  });

  if (relationIdx && existingRelation) {
    throw new Error(`Could not found relation at index ${relationIdx}`);
  }

  const { fields, append, update, remove } = useFieldArray({
    control: modelControl,
    name: 'model.relations',
  });

  const defaultValues = useEditedModelConfig((model) => {
    const defaults = getRelationDefaults(definition, model, {
      ...existingRelation,
      references: existingRelation?.references ?? [
        {
          local: defaultField?.id ?? '',
          foreign: '',
        },
      ],
    });
    return {
      id: '',
      onDelete: 'Cascade' as const,
      onUpdate: 'Restrict' as const,
      ...existingRelation,
      ...defaults,
    };
  });

  const { handleSubmit, control, watch, setValue, setError } =
    useForm<ModelRelationFieldConfig>({
      resolver: zodResolver(modelRelationFieldSchema),
      defaultValues,
    });

  const localFields = useEditedModelConfig((model) => {
    return model.model.fields;
  });

  const relation = watch();

  const foreignModelOptions = definition.models.map((type) => ({
    label: type.name,
    value: type.id,
  }));

  const foreignModel = relation.modelName
    ? definition.models.find((m) => m.id === relation.modelName)
    : undefined;

  const foreignFields = foreignModel?.model.fields;

  const foreignFieldOptions =
    foreignFields.map((f) => ({
      label: f.name,
      value: f.id,
    })) ?? [];

  const modelScalarFieldsWithInvalidTypes = (() => {
    const { modelName, references = [] } = relation;
    if (!modelName) {
      return [];
    }
    // pull relation mappings
    return references.map((ref) => {
      const localField = localFields.find((f) => f.id === ref.local);
      const foreignField = foreignFields?.find((f) => f.id === ref.foreign);
      if (
        localField &&
        foreignField &&
        localField?.type !== foreignField?.type
      ) {
        return {
          field: localField,
          newType: foreignField.type,
        };
      }
      return undefined;
    });
  })();

  const onSubmit = handleSubmit((relation) => {
    if (fields.some((field) => field.name === relation.name)) {
      setError('name', {
        message: 'The relation name cannot be the same as a field name',
      });
      return;
    }

    const newRelation: ModelRelationFieldConfig = {
      ...relation,
      id: existingRelation?.id ?? modelLocalRelationEntityType.generateNewId(),
      foreignId:
        existingRelation?.foreignId ??
        modelForeignRelationEntityType.generateNewId(),
    };

    if (relationIdx) {
      update(relationIdx, newRelation);
    } else {
      append(newRelation);
    }
    onSubmitSuccess?.();
  });

  const handleDelete = (): void => {
    if (relationIdx) {
      remove(relationIdx);
    }
  };

  const formId = useId();

  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        return onSubmit(e);
      }}
      id={formId}
      className="space-y-4"
    >
      <Dialog.Header>
        <Dialog.Title>
          {existingRelation
            ? `Edit Relation ${existingRelation.name}`
            : 'Add Relation'}
        </Dialog.Title>
      </Dialog.Header>
      <div className="grid grid-cols-2 gap-4">
        <h3>{modelName}</h3>
        <ComboboxField.Controller
          control={control}
          name="modelName"
          options={foreignModelOptions}
          label="Foreign Model"
          description="The model to link the relation to"
        />
        <InputField.Controller
          control={control}
          name="name"
          label="Local Relation Name"
          description={
            <span>
              The name of the relation from current model, e.g. post.
              <strong>user</strong>
            </span>
          }
        />
        <InputField.Controller
          control={control}
          name="foreignRelationName"
          label="Foreign Relation Name"
          description={
            <span>
              The name of the relation from foreign model, e.g. user.
              <strong>posts</strong>
            </span>
          }
        />
        <ComboboxField.Controller
          control={control}
          name="references.0.local"
          options={foreignFieldOptions}
          label="Local Field"
        />
        <ComboboxField.Controller
          control={control}
          name="references.1.foreign"
          options={foreignFieldOptions}
          label="Foreign Field"
        />
        <h3>Delete Behavior</h3>
        <SelectField.Controller
          label="On Delete"
          control={control}
          options={[
            { label: 'Cascade (delete entire local row)', value: 'Cascade' },
            { label: 'Restrict (throw error)', value: 'Restrict' },
            ...(localScalarField.isOptional
              ? [
                  {
                    label: 'Set Null (set local field to null)',
                    value: 'SetNull',
                  },
                ]
              : []),
          ]}
          name="onDelete"
          description="The action to take when the corresponding row in the foreign model is deleted"
        />
      </div>
      <Dialog.Footer className="w-full justify-between">
        {existingRelation ? (
          <Button variant="secondary" onClick={handleDelete}>
            Delete Relation
          </Button>
        ) : (
          <div />
        )}
        <div className="flex space-x-4">
          <Dialog.Close asChild>
            <Button variant="secondary">Close</Button>
          </Dialog.Close>
          <Button form={formId} type="submit">
            Save
          </Button>
        </div>
      </Dialog.Footer>
    </form>
  );
}
