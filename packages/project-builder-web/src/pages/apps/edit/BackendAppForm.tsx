import type { BackendAppConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import { backendAppSchema } from '@halfdomelabs/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  CheckboxFieldController,
  InputFieldController,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';

interface Props {
  className?: string;
  appConfig: BackendAppConfig;
}

function BackendAppForm({ className, appConfig }: Props): React.JSX.Element {
  const { saveDefinitionWithFeedback, isSavingDefinition } =
    useProjectDefinition();

  const formProps = useResettableForm({
    resolver: zodResolver(backendAppSchema),
    values: appConfig,
  });
  const { control, handleSubmit, reset } = formProps;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.apps = draftConfig.apps.map((app) =>
        app.id === appConfig.id ? data : app,
      );
    }),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <div className={clsx('', className)}>
      <form onSubmit={onSubmit} className="space-y-4">
        <InputFieldController label="Name" control={control} name="name" />
        <InputFieldController
          label="Package Location (optional) e.g. packages/backend"
          control={control}
          name="packageLocation"
        />
        <CheckboxFieldController
          label="Enable Stripe?"
          control={control}
          name="enableStripe"
        />
        <CheckboxFieldController
          label="Enable Postmark?"
          control={control}
          name="enablePostmark"
        />
        <CheckboxFieldController
          label="Enable Redis?"
          control={control}
          name="enableRedis"
        />
        <CheckboxFieldController
          label="Enable Bull Queue?"
          control={control}
          name="enableBullQueue"
        />
        <CheckboxFieldController
          label="Enable GraphQL Subscriptions?"
          control={control}
          name="enableSubscriptions"
        />
        <CheckboxFieldController
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
