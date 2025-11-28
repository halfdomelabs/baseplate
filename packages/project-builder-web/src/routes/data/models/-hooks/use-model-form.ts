import type {
  ModelConfig,
  ModelConfigInput,
} from '@baseplate-dev/project-builder-lib';
import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';

import {
  createModelBaseSchema,
  FeatureUtils,
  modelEntityType,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  useDefinitionSchema,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import { toast, useEventCallback } from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { sortBy } from 'es-toolkit';
import { useMemo, useRef } from 'react';

interface UseModelFormOptions {
  schema?: z.ZodType;
  omit?: string[];
  onSubmitSuccess?: () => void;
  modelKey: string;
}

/**
 * Unifies logic for editing an existing model and updating it.
 */
export function useModelForm({
  onSubmitSuccess,
  omit,
  modelKey,
}: UseModelFormOptions): {
  form: UseFormReturn<ModelConfigInput>;
  onSubmit: () => Promise<void>;
  originalModel: ModelConfig;
  defaultValues: ModelConfigInput;
} {
  const { definition, saveDefinitionWithFeedback } = useProjectDefinition();

  const urlModelId = modelEntityType.idFromKey(modelKey);
  const model = ModelUtils.byIdOrThrow(definition, urlModelId);

  const baseModelSchema = useDefinitionSchema(createModelBaseSchema);

  // These should remain constant throughout the form's lifecycle
  const fieldsToOmit = useRef(omit);

  const finalSchema = useMemo(() => {
    if (fieldsToOmit.current) {
      return baseModelSchema.omit(
        Object.fromEntries(
          fieldsToOmit.current.map((field) => [field, true]),
        ) as Record<string | number, never>,
      ) as typeof baseModelSchema;
    }

    return baseModelSchema;
  }, [baseModelSchema]);

  // Make sure strip out unused fields
  const defaultValues = useMemo(
    () =>
      fieldsToOmit.current
        ? (finalSchema.parse(model) as ModelConfigInput)
        : model,
    [model, finalSchema],
  );

  const form = useResettableForm<ModelConfigInput, unknown, ModelConfig>({
    resolver: zodResolver(finalSchema),
    defaultValues,
  });

  const { reset, handleSubmit, setError } = form;

  const handleSubmitSuccess = useEventCallback(onSubmitSuccess);

  const onSubmit = useMemo(
    () =>
      handleSubmit((data) => {
        const updatedModel = {
          ...model,
          ...data,
        };
        if (updatedModel.model.fields.length === 0) {
          toast.error('Model must have at least one field.');
          return;
        }
        if (updatedModel.model.primaryKeyFieldRefs.length === 0) {
          toast.error('Model must have at least one primary key field.');
          return;
        }
        // check for models with the same name
        const existingModel = definition.models.find(
          (m) =>
            m.id !== data.id &&
            m.name.toLowerCase() === updatedModel.name.toLowerCase(),
        );
        if (existingModel) {
          setError('name', {
            message: `Model with name ${updatedModel.name} already exists.`,
          });
          return;
        }

        // clear out any service methods that are disabled
        const { service } = updatedModel;
        if (service.create.enabled) {
          if (
            !service.create.fields?.length &&
            !service.create.transformerNames?.length
          ) {
            toast.error(
              'Create method must have at least one field or transformer.',
            );
            return;
          }
        } else {
          service.create = {
            enabled: false,
          };
        }
        if (service.update.enabled) {
          if (
            !service.update.fields?.length &&
            !service.update.transformerNames?.length
          ) {
            toast.error(
              'Update method must have at least one field or transformer.',
            );
            return;
          }
        } else {
          service.update = {
            enabled: false,
          };
        }
        if (!service.delete.enabled) {
          service.delete = {
            enabled: false,
          };
        }
        if (
          !service.create.enabled &&
          !service.update.enabled &&
          !service.delete.enabled &&
          service.transformers.length === 0
        ) {
          updatedModel.service = {
            create: { enabled: false },
            update: { enabled: false },
            delete: { enabled: false },
            transformers: [],
          };
        }

        return saveDefinitionWithFeedback(
          (draftConfig) => {
            // create feature if a new feature exists
            updatedModel.featureRef =
              FeatureUtils.ensureFeatureByNameRecursively(
                draftConfig,
                updatedModel.featureRef,
              );
            draftConfig.models = sortBy(
              [
                ...draftConfig.models.filter((m) => m.id !== updatedModel.id),
                updatedModel,
              ],
              [(m) => m.name],
            );
          },
          {
            successMessage: 'Successfully saved model!',
            onSuccess: () => {
              reset(data);
              handleSubmitSuccess?.();
            },
          },
        );
      }),
    [
      reset,
      setError,
      handleSubmit,
      saveDefinitionWithFeedback,
      handleSubmitSuccess,
      definition,
      model,
    ],
  );

  return {
    form,
    onSubmit,
    originalModel: model,
    defaultValues,
  };
}
