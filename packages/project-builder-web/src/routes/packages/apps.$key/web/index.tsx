import type React from 'react';

import { createWebAppSchema } from '@baseplate-dev/project-builder-lib';
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
import { createFileRoute } from '@tanstack/react-router';

import { UnlinkSection } from '../../-components/unlink-section.js';

export const Route = createFileRoute('/packages/apps/$key/web/')({
  component: WebAppGeneralForm,
});

function WebAppGeneralForm(): React.JSX.Element {
  const { saveDefinitionWithFeedback, definition } = useProjectDefinition();
  const { webDefinition } = Route.useRouteContext();

  const webAppSchema = useDefinitionSchema(createWebAppSchema);
  const formProps = useResettableForm({
    resolver: zodResolver(webAppSchema),
    values: webDefinition,
  });
  const { control, handleSubmit, reset, setError } = formProps;

  const onSubmit = handleSubmit((data) => {
    // Check for port conflicts
    if (data.devPort) {
      const conflictingApp = definition.apps.find(
        (app) => app.id !== webDefinition.id && app.devPort === data.devPort,
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
        app.id === webDefinition.id ? data : app,
      );
    });
  });

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

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
              label="Page Title"
              control={control}
              name="title"
            />
            <InputFieldController
              label="Description Meta Tag"
              control={control}
              name="description"
            />
            <InputFieldController
              label="Development Port"
              control={control}
              name="devPort"
              type="number"
              registerOptions={{ valueAsNumber: true }}
              description="Port number for the development server (e.g., 5030)"
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
          </SectionListSectionContent>
        </SectionListSection>

        <UnlinkSection
          entityType="app"
          entityId={webDefinition.id}
          name={webDefinition.name}
        />
      </SectionList>
      <FormActionBar form={formProps} />
    </form>
  );
}
