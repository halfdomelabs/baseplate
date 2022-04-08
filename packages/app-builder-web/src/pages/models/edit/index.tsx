import {
  ModelConfig,
  modelSchema,
} from '@baseplate/app-builder-lib/lib/schema/models';
import { yupResolver } from '@hookform/resolvers/yup';
import _ from 'lodash';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Tabs, TextInput } from 'src/components';
import ReactSelectInput from 'src/components/ReactSelectInput';
import { useAppConfig } from 'src/hooks/useAppConfig';
import { useStatus } from 'src/hooks/useStatus';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import ModelForm from './ModelForm';

const validationSchema = modelSchema;

type FormData = ModelConfig;

function ModelEditPage(): JSX.Element {
  const { id } = useParams<'id'>();
  const { parsedConfig, setConfig } = useAppConfig();
  const { status, setError } = useStatus();
  const toast = useToast();
  const navigate = useNavigate();

  const isNew = !id;

  const model = parsedConfig.getModels().find((m) => m.name === id);

  const form = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: model || {
      name: '',
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = form;

  useEffect(() => {
    reset(
      model || {
        name: '',
      }
    );
  }, [model, reset]);

  const onSubmit = (data: FormData): void => {
    try {
      setConfig((oldConfig) => {
        oldConfig.models = _.sortBy(
          [...(oldConfig.models?.filter((m) => m.name !== id) || []), data],
          (m) => m.name
        );
      });
      toast.success('Successfully saved model!');
      if (isNew || model?.name !== data.name) {
        navigate(`../edit/${data.name}`);
      }
    } catch (err) {
      console.error(err);
      setError(formatError(err));
    }
  };

  const handleDelete = (): void => {
    if (window.confirm(`Are you sure you want to delete ${id || 'model'}?`)) {
      setConfig((oldConfig) => {
        oldConfig.models = oldConfig.models?.filter((m) => m.name !== id);
      });
      navigate('..');
    }
  };

  const featureOptions = (parsedConfig.appConfig.features || []).map((f) => ({
    label: f.name,
    value: f.name,
  }));

  if (!model && id) {
    return <Alert type="error">Unable to find model {id}</Alert>;
  }

  return (
    <div className="space-y-4">
      <h1>{id || 'New Model'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Alert.WithStatus status={status} />
        <TextInput.Labelled
          label="Name (e.g. User)"
          register={register('name')}
          error={errors.name?.message}
        />
        <ReactSelectInput.Controller
          label="Feature"
          control={control}
          name="feature"
          options={featureOptions}
        />
        <Tabs>
          <Tabs.List>
            <Tabs.Tab>Model</Tabs.Tab>
            <Tabs.Tab>Service</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panels>
            <Tabs.Panel>
              <ModelForm formProps={form} />
            </Tabs.Panel>
            <Tabs.Panel>Here be dragons</Tabs.Panel>
          </Tabs.Panels>
        </Tabs>
        <div className="flex flex-row space-x-4">
          {!isNew && (
            <Button secondary onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
}

export default ModelEditPage;
