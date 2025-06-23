import type { BackendAppConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import { createBackendAppSchema } from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  CheckboxFieldController,
  InputFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';

import { useDefinitionSchema } from '#src/hooks/use-definition-schema.js';

interface Props {
  className?: string;
  appConfig: BackendAppConfig;
}

function BackendAppForm({ className, appConfig }: Props): React.JSX.Element {
  const { saveDefinitionWithFeedback, isSavingDefinition } =
    useProjectDefinition();

  const backendAppSchema = useDefinitionSchema(createBackendAppSchema);
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
