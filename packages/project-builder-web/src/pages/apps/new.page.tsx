import {
  AppConfig,
  appEntityType,
  baseAppSchema,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  Card,
  InputField,
  SelectField,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';

function NewAppPage(): JSX.Element {
  const { setConfigAndFixReferences } = useProjectDefinition();
  const navigate = useNavigate();
  const formProps = useForm<AppConfig>({
    resolver: zodResolver(baseAppSchema),
    defaultValues: {
      id: appEntityType.generateNewId(),
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
      navigate(`../edit/${appEntityType.toUid(data.id)}`);
      toast.success(`Sucessfully created ${data.name}!`);
    } catch (err) {
      toast.error(formatError(err));
    }
  };

  return (
    <div className="space-y-4">
      <h1>New App</h1>
      <Card>
        <Card.Content>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField.Controller
              label="Name"
              control={control}
              name="name"
              description="The name of the app, such as 'backend' or 'web'"
            />
            <SelectField.Controller
              label="Type"
              control={control}
              name="type"
              options={appTypeOptions}
            />
            <Button type="submit">Create</Button>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}

export default NewAppPage;
