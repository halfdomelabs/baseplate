import type React from 'react';

import {
  authConfigSpec,
  createWebAppSchema,
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
import { createFileRoute, redirect } from '@tanstack/react-router';

import { useDefinitionSchema } from '#src/hooks/use-definition-schema.js';

export const Route = createFileRoute('/apps/edit/$key/web')({
  component: WebAppForm,
  beforeLoad: ({ context: { app }, params: { key } }) => {
    if (app.type !== 'web') {
      throw redirect({ to: '/apps/edit/$key', params: { key } });
    }
    return {
      appConfig: app,
    };
  },
});

function WebAppForm(): React.JSX.Element {
  const { saveDefinitionWithFeedback, isSavingDefinition } =
    useProjectDefinition();
  const { appConfig } = Route.useRouteContext();

  const webAppSchema = useDefinitionSchema(createWebAppSchema);
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
    <div className="p-4">
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
