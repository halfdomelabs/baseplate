import type React from 'react';

import {
  createUrlsSettingsSchema,
  getAppUrls,
} from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useDefinitionSchema,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  FormActionBar,
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SelectFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/urls')({
  component: UrlSettingsPage,
  beforeLoad: () => ({
    getTitle: () => 'URL Settings',
  }),
});

/**
 * Settings page for URL configuration
 *
 * Each app's own origin is edited on that app's page. This page only picks the
 * web app the backend links to when no client is in scope.
 */
function UrlSettingsPage(): React.JSX.Element {
  const { definition, saveDefinitionWithFeedback } = useProjectDefinition();

  const urlsSettingsSchema = useDefinitionSchema(createUrlsSettingsSchema);
  const form = useResettableForm({
    resolver: zodResolver(urlsSettingsSchema),
    defaultValues: definition.settings.urls ?? {},
  });

  const { handleSubmit, control, reset } = form;

  const { webApps } = getAppUrls(definition);
  const webAppOptions = definition.apps
    .filter((app) => app.type === 'web')
    .map((app) => ({
      label: `${app.name} (${
        webApps.find((webApp) => webApp.name === app.name)?.url ?? ''
      })`,
      value: app.id,
    }));

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.settings.urls = data;
    }),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <form
      className="relative h-full max-h-full pb-(--action-bar-height)"
      onSubmit={onSubmit}
    >
      <div className="flex h-full max-h-full flex-1 flex-col overflow-y-auto px-6">
        <div className="sticky top-0 border-b bg-background py-6">
          <PageHeader>
            <PageHeaderTitle>URL Configuration</PageHeaderTitle>
            <PageHeaderDescription>
              Each app&apos;s public URL is set on that app&apos;s own page, and
              defaults to its development server. Every web app&apos;s origin is
              trusted for CORS and CSRF checks.
            </PageHeaderDescription>
          </PageHeader>
        </div>
        <SectionList>
          <SectionListSection>
            <SectionListSectionHeader>
              <SectionListSectionTitle>Primary client</SectionListSectionTitle>
              <SectionListSectionDescription>
                The web app features link to when they have to pick one and have
                no basis for choosing — authentication emails, for example,
                which serve every client equally.
              </SectionListSectionDescription>
            </SectionListSectionHeader>
            <SectionListSectionContent className="flex max-w-md flex-col gap-4">
              <SelectFieldController
                label="Primary web app"
                control={control}
                name="defaultWebAppRef"
                options={webAppOptions}
                description="Leave unset to use the first web app that is not the admin console."
              />
            </SectionListSectionContent>
          </SectionListSection>
        </SectionList>
      </div>
      <FormActionBar form={form} />
    </form>
  );
}
