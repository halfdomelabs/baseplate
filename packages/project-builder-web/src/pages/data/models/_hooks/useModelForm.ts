import {
  FeatureUtils,
  ModelConfig,
  ModelUtils,
  modelEntityType,
  modelScalarFieldEntityType,
  modelSchema,
} from '@halfdomelabs/project-builder-lib';
import {
  usePluginEnhancedSchema,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import { toast, useEventCallback } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';
import { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { createModelEditLink } from '../_utils/url';
import { useDeleteReferenceDialog } from '@src/hooks/useDeleteReferenceDialog';
import { NotFoundError, RefDeleteError } from '@src/utils/error';
import { logAndFormatError } from 'src/services/error-formatter';

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
    feature: '',
    model: {
      primaryKeyFieldRefs: [idFieldId],
      fields: [
        {
          id: idFieldId,
          name: 'id',
          type: 'uuid',
          options: {
            genUuid: true,
          },
        },
      ],
    },
  };
}

export function useModelForm<
  TDefinition extends Partial<ModelConfig> = ModelConfig,
>({ onSubmitSuccess, isCreate, schema }: UseModelFormOptions = {}): {
  form: UseFormReturn<TDefinition>;
  onSubmit: () => Promise<void>;
  originalModel?: ModelConfig;
  defaultValues: TDefinition;
} {
  const { uid } = useParams<'uid'>();
  const { definition, setConfigAndFixReferences } = useProjectDefinition();
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

  const { showRefIssues } = useDeleteReferenceDialog();

  // memoize it to keep the same UID when resetting
  const newModel = useMemo(() => createNewModel(), []);

  const modelSchemaWithPlugins = usePluginEnhancedSchema(schema ?? modelSchema);

  const defaultValues = useMemo(() => {
    const modelToUse = model ?? newModel;
    return !schema
      ? modelToUse
      : (modelSchemaWithPlugins.parse(modelToUse) as ModelConfig);
  }, [model, newModel, schema, modelSchemaWithPlugins]);

  const form = useResettableForm<ModelConfig>({
    resolver: zodResolver(modelSchemaWithPlugins),
    defaultValues,
  });

  const { reset, handleSubmit, setError } = form;

  const handleSubmitSuccess = useEventCallback(onSubmitSuccess);

  const onSubmit = useMemo(
    () =>
      handleSubmit((data) => {
        try {
          const updatedModel = {
            ...model,
            ...data,
            // generate new ID if new
            id: model?.id ?? modelEntityType.generateNewId(),
          };
          if (!updatedModel.model?.fields?.length) {
            toast.error('Model must have at least one field.');
            return;
          }
          if (!updatedModel.model?.primaryKeyFieldRefs?.length) {
            toast.error('Model must have at least one primary key field.');
            return;
          }
          // check for models with the same name
          const existingModel = definition.models.find(
            (m) =>
              m.id !== data.id &&
              m.name.toLowerCase() === newModel.name.toLowerCase(),
          );
          if (existingModel) {
            setError('name', {
              message: `Model with name ${updatedModel.name} already exists.`,
            });
            return;
          }

          // clear out any service methods that are disabled
          const { service } = updatedModel;
          if (service) {
            if (!service.create?.enabled) {
              service.create = undefined;
            } else {
              if (
                !service.create?.fields?.length &&
                !service.create?.transformerNames?.length
              ) {
                toast.error(
                  'Create method must have at least one field or transformer.',
                );
                return;
              }
            }
            if (!service.update?.enabled) {
              service.update = undefined;
            } else {
              if (
                !service.update?.fields?.length &&
                !service.update?.transformerNames?.length
              ) {
                toast.error(
                  'Update method must have at least one field or transformer.',
                );
                return;
              }
            }
            if (!service.delete?.enabled) {
              service.delete = undefined;
            }
            if (!service.create && !service.update && !service.delete) {
              updatedModel.service = undefined;
            }
          }

          setConfigAndFixReferences((draftConfig) => {
            // create feature if a new feature exists
            updatedModel.feature = FeatureUtils.ensureFeatureByNameRecursively(
              draftConfig,
              updatedModel.feature,
            );
            draftConfig.models = _.sortBy(
              [
                ...(draftConfig.models?.filter(
                  (m) => m.id !== updatedModel.id,
                ) ?? []),
                updatedModel,
              ],
              (m) => m.name,
            );
          });
          if (isCreate) {
            navigate(createModelEditLink(updatedModel.id));
            reset(newModel);
            toast.success('Successfully created model!');
          } else {
            reset(data);
            toast.success('Successfully saved model!');
          }
          handleSubmitSuccess?.();
        } catch (err) {
          if (err instanceof RefDeleteError) {
            showRefIssues({ issues: err.issues });
            return;
          }
          toast.error(logAndFormatError(err));
        }
      }),
    [
      setConfigAndFixReferences,
      showRefIssues,
      reset,
      setError,
      handleSubmit,
      isCreate,
      navigate,
      handleSubmitSuccess,
      definition,
      newModel,
      model,
    ],
  );

  return {
    form: form as unknown as UseFormReturn<TDefinition>,
    onSubmit,
    originalModel: model,
    defaultValues: defaultValues as TDefinition,
  };
}
