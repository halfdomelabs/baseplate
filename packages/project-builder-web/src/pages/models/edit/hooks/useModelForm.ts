import {
  ModelConfig,
  modelEntityType,
  modelScalarFieldType,
  modelSchema,
} from '@halfdomelabs/project-builder-lib';
import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useResettableForm } from 'src/hooks/useResettableForm';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import { logger } from 'src/services/logger';

interface UseModelFormOptions {
  // References that are managed by the caller and should not be fixed when submitting the form.
  controlledReferences?: string[];
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
          id: modelScalarFieldType.generateNewId(),
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
  controlledReferences,
  onSubmitSuccess,
}: UseModelFormOptions): {
  form: UseFormReturn<ModelConfig>;
  onFormSubmit: (data: ModelConfig) => void;
  originalModel?: ModelConfig;
  defaultValues: ModelConfig;
} {
  const { uid } = useParams<'uid'>();
  const { parsedProject, setConfigAndFixReferences } = useProjectConfig();
  const toast = useToast();
  const navigate = useNavigate();
  const id = uid ? modelEntityType.fromUid(uid) : undefined;
  const model = id ? parsedProject.getModelById(id) : undefined;

  // memoize it to keep the same UID when resetting
  const newModel = useMemo(() => createNewModel(), []);

  const defaultValues = model ?? newModel;
  const form = useResettableForm<ModelConfig>({
    resolver: zodResolver(modelSchema),
    defaultValues,
  });
  const { reset } = form;

  const lastFixedModel = useRef<ModelConfig | undefined>();

  useEffect(() => {
    lastFixedModel.current = undefined;
  }, [model]);

  const onFormSubmit = useCallback(
    (data: ModelConfig) => {
      try {
        setConfigAndFixReferences(
          (draftConfig) => {
            draftConfig.models = _.sortBy(
              [
                ...(draftConfig.models?.filter((m) => m.id !== data.id) ?? []),
                data,
              ],
              (m) => m.name,
            );
          },
          { ignoredReferences: controlledReferences },
        );
        toast.success('Successfully saved model!');
        if (!id || model?.name !== data.name) {
          navigate(`../edit/${modelEntityType.toUid(data.id)}`);
        }
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
        reset(data);
      } catch (err) {
        logger.error(err);
        if (setError) {
          setError(formatError(err));
        } else {
          toast.error(formatError(err));
        }
      }
    },
    [
      setConfigAndFixReferences,
      controlledReferences,
      toast,
      id,
      model?.name,
      onSubmitSuccess,
      reset,
      navigate,
      setError,
    ],
  );

  return {
    form,
    onFormSubmit,
    originalModel: model,
    defaultValues,
  };
}
