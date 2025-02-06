import type { BackendAppConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import { backendAppSchema } from '@halfdomelabs/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { Button, TextInput } from 'src/components';
import CheckedInput from 'src/components/CheckedInput';

interface Props {
  className?: string;
  appConfig: BackendAppConfig;
}

function BackendAppForm({ className, appConfig }: Props): React.JSX.Element {
  const { saveDefinitionWithFeedback, isSavingDefinition } =
    useProjectDefinition();

  const formProps = useResettableForm<BackendAppConfig>({
    resolver: zodResolver(backendAppSchema),
    values: appConfig,
  });
  const { control, handleSubmit, formState, reset } = formProps;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.apps = draftConfig.apps.map((app) =>
        app.id === appConfig.id ? data : app,
      );
    }),
  );

  useBlockUnsavedChangesNavigate(formState, { reset, onSubmit });

  return (
    <div className={clsx('', className)}>
      <form onSubmit={onSubmit} className="space-y-4">
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
        <Button type="submit" disabled={isSavingDefinition}>
          Save
        </Button>
      </form>
    </div>
  );
}

export default BackendAppForm;
