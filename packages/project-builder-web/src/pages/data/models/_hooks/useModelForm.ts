import type {
  ModelConfig,
  ModelConfigInput,
} from '@baseplate-dev/project-builder-lib';
import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';

import {
  FeatureUtils,
  modelEntityType,
  modelScalarFieldEntityType,
  modelSchema,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  usePluginEnhancedSchema,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import { toast, useEventCallback } from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { sortBy } from 'es-toolkit';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { NotFoundError } from '#src/utils/error.js';

import { createModelEditLink } from '../_utils/url.js';

interface UseModelFormOptions {
  schema?: z.ZodTypeAny;
  onSubmitSuccess?: () => void;
  isCreate?: boolean;
}

function createNewModel(): ModelConfig {
  const idFieldId = modelScalarFieldEntityType.generateNewId();
  return {
    id: modelEntityType.generateNewId(),
    name: '',
    featureRef: '',
    service: {
      create: { enabled: false },
      update: { enabled: false },
      delete: { enabled: false },
      transformers: [],
    },
    model: {
      primaryKeyFieldRefs: [idFieldId],
      fields: [
        {
          id: idFieldId,
          name: 'id',
          type: 'uuid',
          isOptional: false,
          options: {
            default: '',
            genUuid: true,
          },
        },
      ],
    },
  };
}

export function useModelForm({
  onSubmitSuccess,
  isCreate,
  schema,
}: UseModelFormOptions = {}): {
  form: UseFormReturn<ModelConfigInput>;
  onSubmit: () => Promise<void>;
  originalModel?: ModelConfig;
  defaultValues: ModelConfigInput;
} {
  const { uid } = useParams<'uid'>();
  const { definition, saveDefinitionWithFeedback } = useProjectDefinition();
  const navigate = useNavigate();

  const urlModelId = isCreate ? undefined : modelEntityType.fromUid(uid);
  const model = urlModelId
    ? ModelUtils.byIdOrThrow(definition, urlModelId)
    : undefined;

  if (!isCreate && !model) {
    throw new NotFoundError(
      'The model you were looking for could not be found.',
    );
  }

  // memoize it to keep the same UID when resetting
  const newModel = useMemo(() => createNewModel(), []);

  const modelSchemaWithPlugins = usePluginEnhancedSchema(schema ?? modelSchema);

  const defaultValues = useMemo(() => {
    const modelToUse = model ?? newModel;
    return schema
      ? (modelSchemaWithPlugins.parse(modelToUse) as ModelConfigInput)
      : modelToUse;
  }, [model, newModel, schema, modelSchemaWithPlugins]);

  const form = useResettableForm<ModelConfigInput, unknown, ModelConfig>({
    resolver: zodResolver(modelSchemaWithPlugins),
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
          // generate new ID if new
          id: model?.id ?? modelEntityType.generateNewId(),
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
          !service.delete.enabled
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
            successMessage: isCreate
              ? 'Successfully created model!'
              : 'Successfully saved model!',
            onSuccess: () => {
              if (isCreate) {
                navigate(createModelEditLink(updatedModel.id));
                reset(newModel);
              } else {
                reset(data);
              }
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
      isCreate,
      navigate,
      handleSubmitSuccess,
      definition,
      newModel,
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
