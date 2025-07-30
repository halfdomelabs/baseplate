import type React from 'react';

import {
  appEntityType,
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
import { createFileRoute, Link } from '@tanstack/react-router';
import { MdSettings } from 'react-icons/md';

import { useDefinitionSchema } from '#src/hooks/use-definition-schema.js';

export const Route = createFileRoute('/apps/edit/$key/web/admin')({
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
    .getPluginSpecOptional(authConfigSpec)
    ?.getAuthRoles(definition)
    .map((role) => ({
      label: role.name,
      value: role.id,
    }));

  const adminEnabled = watch('adminApp.enabled');
  const sections = watch('adminApp.sections') ?? [];

  // Get the app key for navigation
  const appKey = appEntityType.keyFromId(webDefinition.id);

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

        {adminEnabled && (
          <SectionListSection>
            <SectionListSectionHeader>
              <SectionListSectionTitle>Admin Sections</SectionListSectionTitle>
              <SectionListSectionDescription>
                Manage CRUD interfaces for your data models.
                {sections.length > 0 && (
                  <span className="ml-2 text-sm">
                    ({sections.length} section{sections.length === 1 ? '' : 's'}{' '}
                    configured)
                  </span>
                )}
              </SectionListSectionDescription>
            </SectionListSectionHeader>
            <SectionListSectionContent>
              <Button variant="secondary" asChild>
                <Link to="/admin-sections/$appKey" params={{ appKey }}>
                  <MdSettings />
                  Manage Admin Sections
                </Link>
              </Button>
            </SectionListSectionContent>
          </SectionListSection>
        )}
      </SectionList>
      <FormActionBar form={formProps} />
    </form>
  );
}
