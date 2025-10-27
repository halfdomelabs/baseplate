import type React from 'react';

import { infrastructureSettingsSchema } from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  FormActionBar,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/infrastructure')({
  component: InfrastructureSettingsPage,
  beforeLoad: () => ({
    getTitle: () => 'Infrastructure Settings',
  }),
});

/**
 * Settings page for infrastructure configuration
 *
 * Allows users to configure optional infrastructure services.
 */
function InfrastructureSettingsPage(): React.JSX.Element {
  const { definition, saveDefinitionWithFeedback } = useProjectDefinition();
  const defaultValues = definition.settings.infrastructure ?? {
    redis: {
      enabled: false,
    },
  };

  const form = useResettableForm({
    resolver: zodResolver(infrastructureSettingsSchema),
    defaultValues,
  });

  const { handleSubmit, control, reset } = form;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.settings.infrastructure = data;
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
          <h1>Infrastructure Configuration</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure optional infrastructure services for your project. These
            services are shared across all backend applications. PostgreSQL is
            always enabled and requires no configuration.
          </p>
        </div>
        <SectionList>
          <SectionListSection>
            <SectionListSectionHeader>
              <SectionListSectionTitle>Redis Cache</SectionListSectionTitle>
            </SectionListSectionHeader>
            <SectionListSectionContent className="flex max-w-md flex-col gap-4">
              <SwitchFieldController
                name="redis.enabled"
                label="Enable Redis"
                description="Redis is used for caching, sessions, and queue management. Port is calculated as portOffset + 379 (e.g., 3000 → 3379). Required for Bull Queue. Password uses sensible defaults."
                control={control}
              />
            </SectionListSectionContent>
          </SectionListSection>
        </SectionList>
      </div>
      <FormActionBar form={form} />
    </form>
  );
}
