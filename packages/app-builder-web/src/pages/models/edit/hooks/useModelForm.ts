import { ModelConfig, modelSchema } from '@baseplate/app-builder-lib';
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
  setError: (error: string) => void;
}

export function useModelForm({ setError }: UseModelFormOptions): {
  form: UseFormReturn<ModelConfig>;
  onFormSubmit: (data: ModelConfig) => void;
} {
  const { id } = useParams<'id'>();
  const { parsedConfig, setConfig } = useAppConfig();
  const toast = useToast();
  const navigate = useNavigate();
  const model = parsedConfig.getModels().find((m) => m.name === id);

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
        setConfig((oldConfig) => {
          oldConfig.models = _.sortBy(
            [...(oldConfig.models?.filter((m) => m.name !== id) || []), data],
            (m) => m.name
          );
        });
        toast.success('Successfully saved model!');
        if (!id || model?.name !== data.name) {
          navigate(`../edit/${data.name}`);
        }
      } catch (err) {
        setError(formatError(err));
      }
    },
    [id, toast, navigate, model, setError, setConfig]
  );

  return { form, onFormSubmit };
}
