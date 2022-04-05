import { yupResolver } from '@hookform/resolvers/yup';
import _ from 'lodash';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { Alert, Button, TextInput } from 'src/components';
import { useAppConfig } from 'src/hooks/useAppConfig';
import { useStatus } from 'src/hooks/useStatus';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';

const validationSchema = yup.object({
  name: yup.string().required(),
  version: yup.string().required(),
  portBase: yup.number().required(),
});

type FormData = yup.InferType<typeof validationSchema>;

function GeneralPage(): JSX.Element {
  const { config, setConfig } = useAppConfig();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: _.pick(config, ['name', 'version', 'portBase']),
  });
  const { status, setError } = useStatus();
  const toast = useToast();

  const onSubmit = (data: FormData): void => {
    try {
      setConfig((oldConfig) => {
        oldConfig.name = data.name;
        oldConfig.version = data.version;
        oldConfig.portBase = data.portBase;
      });
      toast.success('Successfully saved configuration!');
    } catch (err) {
      setError(formatError(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h1>General Settings</h1>
      <Alert.WithStatus status={status} />
      <TextInput.Labelled
        label="Name (e.g. my-app)"
        register={register('name')}
        error={errors.name?.message}
      />
      <TextInput.Labelled
        label="Version"
        register={register('version')}
        error={errors.version?.message}
      />
      <TextInput.Labelled
        label="Port Base (e.g. 4000)"
        register={register('portBase')}
        error={errors.portBase?.message}
      />
      <Button type="submit">Save</Button>
    </form>
  );
}

export default GeneralPage;
