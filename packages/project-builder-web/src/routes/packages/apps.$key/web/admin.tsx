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

export const Route = createFileRoute('/packages/apps/$key/web/admin')({
  component: WebAdminPage,
});

function WebAdminPage(): React.JSX.Element {
  const { webDefinition } = Route.useRouteContext();
  const { definition, saveDefinitionWithFeedback, pluginContainer } =
    useProjectDefinition();
  const webAppSchema = useDefinitionSchema(createWebAppSchema);

  const formProps = useResettableForm({
    resolver: zodResolver(webAppSchema),
    values: webDefinition,
  });
  const { control, handleSubmit, reset, watch } = formProps;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.apps = draftConfig.apps.map((app) =>
        app.id === webDefinition.id ? data : app,
      );
    }),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  const roleOptions = pluginContainer
    .use(authConfigSpec)
    .getAuthConfig(definition)
    ?.roles.filter((role) => role.name !== 'system')
    .map((role) => ({
      label: role.name,
      value: role.id,
    }));

  const adminEnabled = watch('adminApp.enabled');

  return (
    <form className="w-full max-w-7xl space-y-4 p-4" onSubmit={onSubmit}>
      <SectionList>
        <SectionListSection>
          <SectionListSectionHeader>
            <SectionListSectionTitle>
              Admin Configuration
            </SectionListSectionTitle>
            <SectionListSectionDescription>
              Configure administrative features for your web application.
            </SectionListSectionDescription>
          </SectionListSectionHeader>
          <SectionListSectionContent className="space-y-6">
            <SwitchFieldController
              label="Enable Admin Panel"
              description="Add administrative interface to your web application"
              control={control}
              name="adminApp.enabled"
            />

            {adminEnabled && (
              <>
                <InputFieldController
                  label="Admin Path Prefix"
                  placeholder="/admin"
                  description="URL prefix for admin routes (e.g. /admin)"
                  control={control}
                  name="adminApp.pathPrefix"
                />

                {roleOptions && (
                  <MultiComboboxFieldController
                    label="Admin Access Roles"
                    description="Which roles can access the admin panel"
                    control={control}
                    options={roleOptions}
                    name="adminApp.allowedRoles"
                  />
                )}
              </>
            )}
          </SectionListSectionContent>
        </SectionListSection>
      </SectionList>
      <FormActionBar form={formProps} />
    </form>
  );
}
