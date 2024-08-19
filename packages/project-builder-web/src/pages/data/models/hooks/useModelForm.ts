import {
  FeatureUtils,
  ModelConfig,
  modelEntityType,
  modelScalarFieldEntityType,
  modelSchema,
  zPluginWrapper,
} from '@halfdomelabs/project-builder-lib';
import {
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import { toast } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { useDeleteReferenceDialog } from '@src/hooks/useDeleteReferenceDialog';
import { RefDeleteError } from '@src/utils/error';
import { formatError } from 'src/services/error-formatter';
import { logger } from 'src/services/logger';

interface UseModelFormOptions {
  setError?: (error: string) => void;
  onSubmitSuccess?: () => void;
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
}: UseModelFormOptions): {
  form: UseFormReturn<ModelConfig>;
  onFormSubmit: (data: ModelConfig) => void;
  originalModel?: ModelConfig;
  defaultValues: ModelConfig;
} {
  const { uid } = useParams<'uid'>();
  const { parsedProject, setConfigAndFixReferences, pluginContainer } =
    useProjectDefinition();
  const navigate = useNavigate();
  const urlModelId = uid ? modelEntityType.fromUid(uid) : undefined;
  const model = urlModelId ? parsedProject.getModelById(urlModelId) : undefined;
  const { showRefIssues } = useDeleteReferenceDialog();

  // memoize it to keep the same UID when resetting
  const newModel = useMemo(() => createNewModel(), []);

  const defaultValues = model ?? newModel;

  const modelSchemaWithPlugins = useMemo(
    () => zPluginWrapper(modelSchema, pluginContainer),
    [pluginContainer],
  );

  const form = useResettableForm<ModelConfig>({
    resolver: zodResolver(modelSchemaWithPlugins),
    defaultValues,
  });

  const { reset, formState, getValues } = form;

  const lastFixedModel = useRef<ModelConfig | undefined>();

  useEffect(() => {
    lastFixedModel.current = undefined;
  }, [model]);

  useEffect(() => {
    const { name, id } = getValues();
    if (formState.isSubmitSuccessful) {
      if (!urlModelId || model?.name !== name) {
        navigate(`../edit/${modelEntityType.toUid(id)}`);
      }
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    }
  }, [
    formState.isSubmitSuccessful,
    getValues,
    model?.name,
    navigate,
    onSubmitSuccess,
    urlModelId,
  ]);

  const onFormSubmit = useCallback(
    (data: ModelConfig) => {
      try {
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
        toast.success('Successfully saved model!');
        reset(data);
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
    },
    [setConfigAndFixReferences, showRefIssues, reset, setError],
  );

  return {
    form,
    onFormSubmit,
    originalModel: model,
    defaultValues,
  };
}
