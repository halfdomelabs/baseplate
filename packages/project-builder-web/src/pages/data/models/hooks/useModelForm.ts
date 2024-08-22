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

import { createModelEditLink } from '../utils/url';
import { useDeleteReferenceDialog } from '@src/hooks/useDeleteReferenceDialog';
import { NotFoundError, RefDeleteError } from '@src/utils/error';
import { logAndFormatError } from 'src/services/error-formatter';

interface UseModelFormOptions {
  schema?: z.ZodTypeAny;
  onSubmitSuccess?: () => void;
  isCreate?: boolean;
}

function createNewModel(): ModelConfig {
  return {
    id: modelEntityType.generateNewId(),
    name: '',
    feature: '',
    model: {
      fields: [
        {
          id: modelScalarFieldEntityType.generateNewId(),
          name: 'id',
          type: 'uuid',
          isId: true,
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
          if (!updatedModel.service?.build && updatedModel.service) {
            updatedModel.service = undefined;
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
