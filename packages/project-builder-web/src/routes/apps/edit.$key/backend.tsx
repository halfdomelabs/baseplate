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

import UnlinkSection from '../-components/unlink-section.js';

export const Route = createFileRoute('/apps/edit/$key/backend')({
  component: BackendAppEditPage,
  loader: ({ context: { app }, params: { key } }) => {
    if (!app) throw notFound();
    if (app.type !== 'backend') {
      throw redirect({ to: '/apps/edit/$key', params: { key } });
    }
    return {
      backendDefinition: app,
    };
  },
});

function BackendAppEditPage(): React.JSX.Element {
  const { saveDefinitionWithFeedback } = useProjectDefinition();
  const { backendDefinition } = Route.useLoaderData();

  const backendAppSchema = useDefinitionSchema(createBackendAppSchema);
  const formProps = useResettableForm({
    resolver: zodResolver(backendAppSchema),
    values: backendDefinition,
  });
  const { control, handleSubmit, reset } = formProps;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.apps = draftConfig.apps.map((app) =>
        app.id === backendDefinition.id ? data : app,
      );
    }),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
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
            <InputFieldController label="Name" control={control} name="name" />
          </SectionListSectionContent>
        </SectionListSection>

        <SectionListSection>
          <SectionListSectionHeader>
            <SectionListSectionTitle>Configuration</SectionListSectionTitle>
            <SectionListSectionDescription>
              Enable or disable external services and features for your backend
              application.
            </SectionListSectionDescription>
          </SectionListSectionHeader>
          <SectionListSectionContent>
            <div className="space-y-4">
              <SwitchFieldController
                control={control}
                name="enableStripe"
                label="Stripe"
                description="Enable Stripe for payment processing"
              />
              <SwitchFieldController
                control={control}
                name="enablePostmark"
                label="Postmark"
                description="Enable Postmark for email delivery"
              />
              <SwitchFieldController
                control={control}
                name="enableSubscriptions"
                label="GraphQL Subscriptions"
                description="Enable GraphQL Subscriptions for real-time updates"
              />
              <SwitchFieldController
                control={control}
                name="enableAxios"
                label="Axios"
                description="Enable Axios for HTTP requests"
              />
            </div>
          </SectionListSectionContent>
        </SectionListSection>

        <UnlinkSection
          entityType="app"
          entityId={backendDefinition.id}
          name={backendDefinition.name}
        />
      </SectionList>
      <FormActionBar form={formProps} />
    </form>
  );
}
