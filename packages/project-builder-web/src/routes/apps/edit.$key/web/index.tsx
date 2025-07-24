import type React from 'react';

import {
  authConfigSpec,
  createWebAppSchema,
} from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useDefinitionSchema,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  FormActionBar,
  InputFieldController,
  MultiComboboxFieldController,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/apps/edit/$key/web/')({
  component: WebAppGeneralForm,
});

function WebAppGeneralForm(): React.JSX.Element {
  const { saveDefinitionWithFeedback } = useProjectDefinition();
  const { webDefinition } = Route.useRouteContext();

  const webAppSchema = useDefinitionSchema(createWebAppSchema);
  const formProps = useResettableForm({
    resolver: zodResolver(webAppSchema),
    values: webDefinition,
  });
  const { control, handleSubmit, reset } = formProps;

  const { definition, pluginContainer } = useProjectDefinition();

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.apps = draftConfig.apps.map((app) =>
        app.id === webDefinition.id ? data : app,
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
    <form onSubmit={onSubmit} className="w-full max-w-7xl space-y-4 p-4">
      <SectionList>
        <SectionListSection>
          <SectionListSectionHeader>
            <SectionListSectionTitle>General</SectionListSectionTitle>
            <SectionListSectionDescription>
              Basic configuration for your web application.
            </SectionListSectionDescription>
          </SectionListSectionHeader>
          <SectionListSectionContent className="space-y-6">
            <InputFieldController label="Name" control={control} name="name" />
            <InputFieldController
              label="Package Location (optional)"
              placeholder="e.g. packages/web"
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
          </SectionListSectionContent>
        </SectionListSection>

        <SectionListSection>
          <SectionListSectionHeader>
            <SectionListSectionTitle>Features</SectionListSectionTitle>
            <SectionListSectionDescription>
              Configure optional features for your web application.
            </SectionListSectionDescription>
          </SectionListSectionHeader>
          <SectionListSectionContent className="space-y-6">
            <SwitchFieldController
              label="Include Auth?"
              control={control}
              name="includeAuth"
            />
            <SwitchFieldController
              label="Include Upload Components?"
              control={control}
              name="includeUploadComponents"
            />
            <SwitchFieldController
              label="Enable Subscriptions?"
              control={control}
              name="enableSubscriptions"
            />
            {roleOptions && (
              <MultiComboboxFieldController
                label="Allowed Roles"
                description="Which roles can access the web application"
                control={control}
                options={roleOptions}
                name="allowedRoles"
              />
            )}
          </SectionListSectionContent>
        </SectionListSection>
      </SectionList>
      <FormActionBar form={formProps} />
    </form>
  );
}
