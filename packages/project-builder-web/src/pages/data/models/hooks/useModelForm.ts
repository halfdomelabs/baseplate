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

import { createModelEditLink } from '../utils/url';
import { useDeleteReferenceDialog } from '@src/hooks/useDeleteReferenceDialog';
import { NotFoundError, RefDeleteError } from '@src/utils/error';
import { formatError } from 'src/services/error-formatter';
import { logger } from 'src/services/logger';

interface UseModelFormOptions {
  setError?: (error: string) => void;
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

export function useModelForm({
  setError,
  onSubmitSuccess,
  isCreate,
}: UseModelFormOptions = {}): {
  form: UseFormReturn<ModelConfig>;
  onFormSubmit: () => Promise<void>;
  originalModel?: ModelConfig;
  defaultValues: ModelConfig;
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

  const defaultValues = model ?? newModel;

  const modelSchemaWithPlugins = usePluginEnhancedSchema(modelSchema);

  const form = useResettableForm<ModelConfig>({
    resolver: zodResolver(modelSchemaWithPlugins),
    defaultValues,
  });

  const { reset, handleSubmit, setError: setFormError } = form;

  const handleSubmitSuccess = useEventCallback(onSubmitSuccess);

  const onFormSubmit = useMemo(
    () =>
      handleSubmit((data: ModelConfig) => {
        try {
          if (!data.service?.build) {
            data.service = undefined;
          }
          // check for models with the same name
          const existingModel = definition.models.find(
            (m) => m.id !== data.id && m.name === data.name,
          );
          if (existingModel) {
            setFormError('name', {
              message: `Model with name ${data.name} already exists.`,
            });
            return;
          }
          setConfigAndFixReferences((draftConfig) => {
            // create feature if a new feature exists
            data.feature = FeatureUtils.ensureFeatureByNameRecursively(
              draftConfig,
              data.feature,
            );
            draftConfig.models = _.sortBy(
              [
                ...(draftConfig.models?.filter((m) => m.id !== data.id) ?? []),
                data,
              ],
              (m) => m.name,
            );
          });
          if (isCreate) {
            navigate(createModelEditLink(data.id));
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
          logger.error(err);
          if (setError) {
            setError(formatError(err));
          } else {
            toast.error(formatError(err));
          }
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
      setFormError,
      definition,
      newModel,
    ],
  );

  return {
    form,
    onFormSubmit,
    originalModel: model,
    defaultValues,
  };
}
