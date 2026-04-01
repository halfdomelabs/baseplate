import type React from 'react';

import { createBackendAppSchema } from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useDefinitionSchema,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  FormActionBar,
  InputFieldController,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

import { AppHeaderBar } from './-components/app-header-bar.js';

export const Route = createFileRoute('/packages/apps/$key/backend')({
  component: BackendAppEditPage,
  loader: ({ context: { app }, params: { key } }) => {
    if (!app) throw notFound();
    if (app.type !== 'backend') {
      throw redirect({ to: '/packages/apps/$key', params: { key } });
    }
    return {
      app,
      backendDefinition: app,
    };
  },
});

function BackendAppEditPage(): React.JSX.Element {
  const { saveDefinitionWithFeedback, definition } = useProjectDefinition();
  const { app, backendDefinition } = Route.useLoaderData();

  const backendAppSchema = useDefinitionSchema(createBackendAppSchema);
  const formProps = useResettableForm({
    resolver: zodResolver(backendAppSchema),
    values: backendDefinition,
  });
  const { control, handleSubmit, reset, setError } = formProps;

  const onSubmit = handleSubmit((data) => {
    // Check for port conflicts
    if (data.devPort) {
      const conflictingApp = definition.apps.find(
        (app) =>
          app.id !== backendDefinition.id && app.devPort === data.devPort,
      );
      if (conflictingApp) {
        setError('devPort', {
          type: 'manual',
          message: `Port ${data.devPort} is already used by app "${conflictingApp.name}"`,
        });
        return;
      }
    }

    return saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.apps = draftConfig.apps.map((app) =>
        app.id === backendDefinition.id ? data : app,
      );
    });
  });

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden">
      <AppHeaderBar app={app} />
      <div
        className="mb-(--action-bar-height) flex flex-1 overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        <form className="w-full max-w-7xl space-y-4 px-4" onSubmit={onSubmit}>
          <SectionList>
            <SectionListSection>
              <SectionListSectionHeader>
                <SectionListSectionTitle>General</SectionListSectionTitle>
                <SectionListSectionDescription>
                  Basic configuration for your backend application.
                </SectionListSectionDescription>
              </SectionListSectionHeader>
              <SectionListSectionContent className="space-y-6">
                <InputFieldController
                  label="Name"
                  control={control}
                  name="name"
                />
                <InputFieldController
                  label="Development Port"
                  control={control}
                  name="devPort"
                  type="number"
                  registerOptions={{ valueAsNumber: true }}
                  description="Port number for the development server (e.g., 5001)"
                />
              </SectionListSectionContent>
            </SectionListSection>

            <SectionListSection>
              <SectionListSectionHeader>
                <SectionListSectionTitle>Configuration</SectionListSectionTitle>
                <SectionListSectionDescription>
                  Enable or disable external services and features for your
                  backend application.
                </SectionListSectionDescription>
              </SectionListSectionHeader>
              <SectionListSectionContent>
                <div className="space-y-4">
                  <SwitchFieldController
                    control={control}
                    name="enableAxios"
                    label="Axios"
                    description="Enable Axios for HTTP requests"
                  />
                </div>
              </SectionListSectionContent>
            </SectionListSection>
          </SectionList>
          <FormActionBar form={formProps} />
        </form>
      </div>
    </div>
  );
}
