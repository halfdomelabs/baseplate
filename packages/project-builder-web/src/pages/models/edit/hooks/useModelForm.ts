import {
  fixReferenceRenames,
  getProjectConfigReferences,
  ModelConfig,
  modelScalarFieldType,
  modelSchema,
  randomUid,
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

function createNewModel(): Partial<ModelConfig> {
  return {
    name: '',
    model: {
      fields: [
        {
          id: modelScalarFieldType.generateNewId(),
          uid: randomUid(),
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
  fixControlledReferences: () => void;
} {
  const { id } = useParams<'id'>();
  const { parsedProject, setConfigAndFixReferences } = useProjectConfig();
  const toast = useToast();
  const navigate = useNavigate();
  const model = parsedProject.getModels().find((m) => m.uid === id);

  // memoize it to keep the same UID when resetting
  const newModel = useMemo(() => createNewModel(), []);

  const form = useResettableForm<ModelConfig>({
    resolver: zodResolver(modelSchema),
    defaultValues: model ?? newModel,
  });
  const { getValues, setValue } = form;

  const lastFixedModel = useRef<ModelConfig | undefined>();

  useEffect(() => {
    lastFixedModel.current = undefined;
  }, [model]);

  const onFormSubmit = useCallback(
    (data: ModelConfig) => {
      try {
        const newUid = data.uid || randomUid();
        setConfigAndFixReferences(
          (draftConfig) => {
            draftConfig.models = _.sortBy(
              [
                ...(draftConfig.models?.filter((m) => m.uid !== id) ?? []),
                {
                  ...data,
                  uid: newUid,
                },
              ],
              (m) => m.name,
            );
          },
          { ignoredReferences: controlledReferences },
        );
        toast.success('Successfully saved model!');
        if (!id || model?.name !== data.name) {
          navigate(`../edit/${newUid}`);
        }
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
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
      id,
      toast,
      navigate,
      model,
      setError,
      setConfigAndFixReferences,
      onSubmitSuccess,
      controlledReferences,
    ],
  );

  const fixControlledReferences = useCallback(() => {
    // add latest model to config
    const updatedModel = getValues();

    if (_.isEqual(updatedModel, lastFixedModel.current)) {
      return;
    }

    // skip if model is invalid
    if (!modelSchema.safeParse(updatedModel).success) {
      return;
    }

    const config = parsedProject.projectConfig;
    const lastFixedConfig = {
      ...config,
      models: lastFixedModel.current
        ? [...config.models.filter((m) => m.uid !== id), lastFixedModel.current]
        : config.models,
    };
    const updatedConfig = {
      ...config,
      models: [...config.models.filter((m) => m.uid !== id), updatedModel],
    };
    const fixedConfig = fixReferenceRenames(
      lastFixedConfig,
      updatedConfig,
      getProjectConfigReferences,
      {
        whitelistReferences: controlledReferences,
      },
    );
    const fixedModel = fixedConfig.models?.find((m) => m.uid === id);
    if (!fixedModel) {
      return;
    }
    Object.keys(fixedModel).forEach((key) => {
      const modelKey = key as keyof ModelConfig;
      if (_.isEqual(fixedModel[modelKey], updatedModel[modelKey])) {
        return;
      }
      setValue(modelKey, fixedModel[modelKey]);
    });
    lastFixedModel.current = fixedModel;
  }, [parsedProject, getValues, setValue, controlledReferences, id]);

  return { form, onFormSubmit, originalModel: model, fixControlledReferences };
}
