import { WebAppConfig, webAppSchema } from '@baseplate/project-builder-lib';
import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';
import { Button, TextInput } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';
import CheckedInput from 'src/components/CheckedInput';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useResettableForm } from 'src/hooks/useResettableForm';
import { useToast } from 'src/hooks/useToast';

interface Props {
  className?: string;
  appConfig: WebAppConfig;
}

function WebAppForm({ className, appConfig }: Props): JSX.Element {
  const { setConfigAndFixReferences } = useProjectConfig();

  const formProps = useResettableForm<WebAppConfig>({
    resolver: zodResolver(webAppSchema),
    defaultValues: appConfig,
  });
  const { control, handleSubmit } = formProps;
  const toast = useToast();
  const { parsedProject } = useProjectConfig();

  function onSubmit(data: WebAppConfig): void {
    setConfigAndFixReferences((oldConfig) => {
      oldConfig.apps = oldConfig.apps.map((app) =>
        app.uid === appConfig.uid ? data : app
      );
    });
    toast.success('Successfully saved app!');
  }

  const roleOptions = parsedProject.projectConfig.auth?.roles.map((role) => ({
    label: role.name,
    value: role.name,
  }));

  return (
    <div className={classNames('', className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextInput.LabelledController
          label="Name"
          control={control}
          name="name"
        />
        <TextInput.LabelledController
          label="Package Location (optional) e.g. packages/web"
          control={control}
          name="packageLocation"
        />
        <TextInput.LabelledController
          label="Page Title"
          control={control}
          name="title"
        />
        <TextInput.LabelledController
          label="Description Meta Tag"
          control={control}
          name="description"
        />
        <CheckedInput.LabelledController
          label="Include Auth?"
          control={control}
          name="includeAuth"
        />
        <CheckedInput.LabelledController
          label="Include Upload Components?"
          control={control}
          name="includeUploadComponents"
        />
        <CheckedInput.LabelledController
          label="Enable Subscriptions?"
          control={control}
          name="enableSubscriptions"
        />
        <CheckedInput.LabelledController
          label="Enable Datadog Logging?"
          control={control}
          name="enableDatadog"
        />
        {roleOptions && (
          <CheckedArrayInput.LabelledController
            label="Allowed Roles?"
            control={control}
            options={roleOptions}
            name="allowedRoles"
          />
        )}
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}

export default WebAppForm;
