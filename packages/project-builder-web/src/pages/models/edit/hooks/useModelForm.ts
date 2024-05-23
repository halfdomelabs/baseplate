import {
  ModelConfig,
  modelEntityType,
  modelScalarFieldEntityType,
  modelSchema,
} from '@halfdomelabs/project-builder-lib';
import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { useDeleteReferenceDialog } from '@src/hooks/useDeleteReferenceDialog';
import { RefDeleteError } from '@src/utils/error';
import { useProjectDefinition } from 'src/hooks/useProjectDefinition';
import { useResettableForm } from 'src/hooks/useResettableForm';
import { useToast } from 'src/hooks/useToast';
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
  const { parsedProject, setConfigAndFixReferences } = useProjectDefinition();
  const toast = useToast();
  const navigate = useNavigate();
  const id = uid ? modelEntityType.fromUid(uid) : undefined;
  const model = id ? parsedProject.getModelById(id) : undefined;
  const { showRefIssues } = useDeleteReferenceDialog();

  // memoize it to keep the same UID when resetting
  const newModel = useMemo(() => createNewModel(), []);

  const defaultValues = model ?? newModel;
  const form = useResettableForm<ModelConfig>({
    resolver: zodResolver(modelSchema),
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
      if (!id || model?.name !== name) {
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
  ]);

  const onFormSubmit = useCallback(
    (data: ModelConfig) => {
      try {
        setConfigAndFixReferences((draftConfig) => {
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
    [setConfigAndFixReferences, showRefIssues, toast, reset, setError],
  );

  return {
    form,
    onFormSubmit,
    originalModel: model,
    defaultValues,
  };
}
