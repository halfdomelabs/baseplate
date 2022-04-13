import {
  ModelConfig,
  modelSchema,
  randomUid,
} from '@baseplate/project-builder-lib';
import { yupResolver } from '@hookform/resolvers/yup';
import _ from 'lodash';
import { useCallback, useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppConfig } from 'src/hooks/useAppConfig';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';

const NEW_MODEL = {
  name: '',
};

interface UseModelFormOptions {
  ignoredReferences?: string[];
  setError: (error: string) => void;
}

export function useModelForm({
  setError,
  ignoredReferences,
}: UseModelFormOptions): {
  form: UseFormReturn<ModelConfig>;
  onFormSubmit: (data: ModelConfig) => void;
  originalModel?: ModelConfig;
} {
  const { id } = useParams<'id'>();
  const { parsedApp, setConfigAndFixReferences } = useAppConfig();
  const toast = useToast();
  const navigate = useNavigate();
  const model = parsedApp.getModels().find((m) => m.uid === id);

  const form = useForm<ModelConfig>({
    resolver: yupResolver(modelSchema),
    defaultValues: model || NEW_MODEL,
  });
  const { reset } = form;

  useEffect(() => {
    reset(model || NEW_MODEL);
  }, [model, reset]);

  const onFormSubmit = useCallback(
    (data: ModelConfig) => {
      try {
        const newUid = data.uid || randomUid();
        setConfigAndFixReferences(
          (oldConfig) => {
            oldConfig.models = _.sortBy(
              [
                ...(oldConfig.models?.filter((m) => m.uid !== id) || []),
                {
                  ...data,
                  uid: newUid,
                },
              ],
              (m) => m.name
            );
          },
          { ignoredReferences }
        );
        toast.success('Successfully saved model!');
        if (!id || model?.name !== data.name) {
          navigate(`../edit/${newUid}`);
        }
      } catch (err) {
        setError(formatError(err));
      }
    },
    [
      id,
      toast,
      navigate,
      model,
      setError,
      setConfigAndFixReferences,
      ignoredReferences,
    ]
  );

  return { form, onFormSubmit, originalModel: model };
}
