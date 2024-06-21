import {
  BackendAppConfig,
  backendAppSchema,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';

import { useBlockDirtyFormNavigate } from '@src/hooks/useBlockDirtyFormNavigate';
import { Button, TextInput } from 'src/components';
import CheckedInput from 'src/components/CheckedInput';
import { useResettableForm } from 'src/hooks/useResettableForm';
import { useToast } from 'src/hooks/useToast';

interface Props {
  className?: string;
  appConfig: BackendAppConfig;
}

function BackendAppForm({ className, appConfig }: Props): JSX.Element {
  const { setConfigAndFixReferences } = useProjectDefinition();

  const formProps = useResettableForm<BackendAppConfig>({
    resolver: zodResolver(backendAppSchema),
    defaultValues: appConfig,
  });
  const { control, handleSubmit, formState } = formProps;
  const toast = useToast();

  useBlockDirtyFormNavigate(formState);

  function onSubmit(data: BackendAppConfig): void {
    setConfigAndFixReferences((draftConfig) => {
      draftConfig.apps = draftConfig.apps.map((app) =>
        app.id === appConfig.id ? data : app,
      );
    });
    toast.success('Successfully saved app!');
  }

  return (
    <div className={clsx('', className)}>
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
        <CheckedInput.LabelledController
          label="Enable Stripe?"
          control={control}
          name="enableStripe"
        />
        <CheckedInput.LabelledController
          label="Enable Postmark?"
          control={control}
          name="enablePostmark"
        />
        <CheckedInput.LabelledController
          label="Enable Sendgrid?"
          control={control}
          name="enableSendgrid"
        />
        <CheckedInput.LabelledController
          label="Enable Redis?"
          control={control}
          name="enableRedis"
        />
        <CheckedInput.LabelledController
          label="Enable Bull Queue?"
          control={control}
          name="enableBullQueue"
        />
        <CheckedInput.LabelledController
          label="Enable GraphQL Subscriptions?"
          control={control}
          name="enableSubscriptions"
        />
        <CheckedInput.LabelledController
          label="Enable Axios?"
          control={control}
          name="enableAxios"
        />
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}

export default BackendAppForm;
