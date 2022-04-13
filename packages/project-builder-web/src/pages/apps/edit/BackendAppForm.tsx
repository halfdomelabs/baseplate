import {
  BackendAppConfig,
  backendAppSchema,
} from '@baseplate/project-builder-lib';
import { yupResolver } from '@hookform/resolvers/yup';
import classNames from 'classnames';
import { useForm } from 'react-hook-form';
import { Button, TextInput } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useToast } from 'src/hooks/useToast';

interface Props {
  className?: string;
  appConfig: BackendAppConfig;
}

function BackendAppForm({ className, appConfig }: Props): JSX.Element {
  const { setConfigAndFixReferences } = useProjectConfig();

  const formProps = useForm<BackendAppConfig>({
    resolver: yupResolver(backendAppSchema),
    defaultValues: appConfig,
  });
  const { control, handleSubmit } = formProps;
  const toast = useToast();

  function onSubmit(data: BackendAppConfig): void {
    setConfigAndFixReferences((oldConfig) => {
      oldConfig.apps = oldConfig.apps.map((app) =>
        app.uid === appConfig.uid ? data : app
      );
    });
    toast.success('Successfully saved app!');
  }

  return (
    <div className={classNames('', className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextInput.LabelledController
          label="Name"
          control={control}
          name="name"
        />
        <TextInput.LabelledController
          label="Package Location (optional) e.g. packages/backend"
          control={control}
          name="packageLocation"
        />
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}

export default BackendAppForm;
