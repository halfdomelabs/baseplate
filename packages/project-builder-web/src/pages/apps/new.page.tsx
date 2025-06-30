import type { AppConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  appEntityType,
  baseAppSchema,
} from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  Card,
  CardContent,
  InputFieldController,
  SelectFieldController,
  toast,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { sortBy } from 'es-toolkit';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

function NewAppPage(): React.JSX.Element {
  const { saveDefinitionWithFeedback, isSavingDefinition } =
    useProjectDefinition();
  const navigate = useNavigate();
  const formProps = useForm({
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

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        const newApps = [...draftConfig.apps, data];
        draftConfig.apps = sortBy(newApps, [(app) => app.name]) as AppConfig[];
      },
      {
        onSuccess: () => {
          navigate(`../edit/${appEntityType.keyFromId(data.id)}`);
          toast.success(`Sucessfully created ${data.name}!`);
        },
      },
    ),
  );

  return (
    <div className="space-y-4 p-4">
      <h1>New App</h1>
      <Card>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <InputFieldController
              label="Name"
              control={control}
              name="name"
              description="The name of the app, such as 'backend' or 'web'"
            />
            <SelectFieldController
              label="Type"
              control={control}
              name="type"
              options={appTypeOptions}
            />
            <Button type="submit" disabled={isSavingDefinition}>
              Create
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default NewAppPage;
