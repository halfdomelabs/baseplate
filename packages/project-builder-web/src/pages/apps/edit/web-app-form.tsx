import type { WebAppConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  authConfigSpec,
  webAppSchema,
} from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  CheckboxFieldController,
  InputFieldController,
  MultiComboboxFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';

interface Props {
  className?: string;
  appConfig: WebAppConfig;
}

function WebAppForm({ className, appConfig }: Props): React.JSX.Element {
  const { saveDefinitionWithFeedback, isSavingDefinition } =
    useProjectDefinition();

  const formProps = useResettableForm({
    resolver: zodResolver(webAppSchema),
    values: appConfig,
  });
  const { control, handleSubmit, reset } = formProps;

  const { definition, pluginContainer } = useProjectDefinition();

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.apps = draftConfig.apps.map((app) =>
        app.id === appConfig.id ? data : app,
      );
    }),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  const roleOptions = pluginContainer
    .getPluginSpecOptional(authConfigSpec)
    ?.getAuthRoles(definition)
    .map((role) => ({
      label: role.name,
      value: role.id,
    }));

  return (
    <div className={clsx('', className)}>
      <form onSubmit={onSubmit} className="space-y-4">
        <InputFieldController label="Name" control={control} name="name" />
        <InputFieldController
          label="Package Location (optional) e.g. packages/web"
          control={control}
          name="packageLocation"
        />
        <InputFieldController
          label="Page Title"
          control={control}
          name="title"
        />
        <InputFieldController
          label="Description Meta Tag"
          control={control}
          name="description"
        />
        <CheckboxFieldController
          label="Include Auth?"
          control={control}
          name="includeAuth"
        />
        <CheckboxFieldController
          label="Include Upload Components?"
          control={control}
          name="includeUploadComponents"
        />
        <CheckboxFieldController
          label="Enable Subscriptions?"
          control={control}
          name="enableSubscriptions"
        />
        {roleOptions && (
          <MultiComboboxFieldController
            label="Allowed Roles?"
            control={control}
            options={roleOptions}
            name="allowedRoles"
          />
        )}
        <Button type="submit" disabled={isSavingDefinition}>
          Save
        </Button>
      </form>
    </div>
  );
}

export default WebAppForm;
