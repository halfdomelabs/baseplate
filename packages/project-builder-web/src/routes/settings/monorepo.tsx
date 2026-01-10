import type React from 'react';

import { monorepoSettingsSchema } from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  FormActionBar,
  InputFieldController,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionHeader,
  SectionListSectionTitle,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/monorepo')({
  component: MonorepoSettingsPage,
  beforeLoad: () => ({
    getTitle: () => 'Monorepo Settings',
  }),
});

/**
 * Settings page for monorepo configuration
 *
 * Allows users to configure the folder structure for monorepo packages.
 */
function MonorepoSettingsPage(): React.JSX.Element {
  const { definition, saveDefinitionWithFeedback } = useProjectDefinition();
  const defaultValues = definition.settings.monorepo ?? {
    appsFolder: 'apps',
    librariesFolder: 'libs',
  };

  const form = useResettableForm({
    resolver: zodResolver(monorepoSettingsSchema),
    defaultValues,
  });

  const { handleSubmit, control, reset } = form;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.settings.monorepo = data;
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
          <h1>Monorepo Configuration</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure the folder structure for your monorepo packages.
          </p>
        </div>
        <SectionList>
          <SectionListSection>
            <SectionListSectionHeader>
              <SectionListSectionTitle>
                Folder Configuration
              </SectionListSectionTitle>
            </SectionListSectionHeader>
            <SectionListSectionContent className="flex max-w-md flex-col gap-4">
              <InputFieldController
                name="appsFolder"
                label="Apps Folder"
                description='Folder where apps are located. Apps will be placed in {appsFolder}/{app-name}, e.g. "apps" results in apps/backend, apps/web'
                control={control}
                placeholder="e.g. apps"
              />
              <InputFieldController
                name="librariesFolder"
                label="Libraries Folder"
                description='Folder where libraries are located. Libraries will be placed in {librariesFolder}/{library-name}, e.g. "libs" results in libs/my-lib'
                control={control}
                placeholder="e.g. libs"
              />
            </SectionListSectionContent>
          </SectionListSection>
        </SectionList>
      </div>
      <FormActionBar form={form} />
    </form>
  );
}
