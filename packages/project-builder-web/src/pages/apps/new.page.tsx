import {
  AppConfig,
  baseAppSchema,
  randomUid,
} from '@halfdomelabs/project-builder-lib';
import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, SelectInput, TextInput } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useStatus } from 'src/hooks/useStatus';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';

function NewAppPage(): JSX.Element {
  const { setConfigAndFixReferences } = useProjectConfig();
  const { status, setError } = useStatus();
  const navigate = useNavigate();
  const formProps = useForm<AppConfig>({
    resolver: zodResolver(baseAppSchema),
    defaultValues: {
      uid: randomUid(),
      name: '',
      type: 'backend',
    },
  });
  const { control, handleSubmit } = formProps;

  const appTypeOptions = [
    { label: 'Backend App', value: 'backend' },
    { label: 'Web App', value: 'web' },
    { label: 'Admin App', value: 'admin' },
  ];
  const toast = useToast();

  const onSubmit = (data: AppConfig): void => {
    try {
      setConfigAndFixReferences((draftConfig) => {
        const newApps = [...draftConfig.apps, data];
        draftConfig.apps = _.sortBy(newApps, 'name');
      });
      navigate(`../edit/${data.uid}`);
      toast.success('Sucessfully created app!');
    } catch (err) {
      setError(formatError(err));
    }
  };

  return (
    <div className="space-y-4">
      <h1>Create App</h1>
      <Alert.WithStatus status={status} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextInput.LabelledController
          label="Name"
          control={control}
          name="name"
        />
        <SelectInput.LabelledController
          label="Type"
          control={control}
          name="type"
          options={appTypeOptions}
        />
        <Button type="submit">Create</Button>
      </form>
    </div>
  );
}

export default NewAppPage;
