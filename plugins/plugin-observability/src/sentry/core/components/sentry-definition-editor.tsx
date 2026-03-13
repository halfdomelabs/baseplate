import type { WebConfigProps } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import { PluginUtils } from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useDefinitionSchema,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  FormActionBar,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';

import type { SentryPluginDefinitionInput } from '../schema/plugin-definition.js';

import { createSentryPluginDefinitionSchema } from '../schema/plugin-definition.js';

import '#src/styles.css';

export function SentryDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const sentryPluginDefinitionSchema = useDefinitionSchema(
    createSentryPluginDefinitionSchema,
  );

  const defaultValues = useMemo(
    () =>
      (pluginMetadata?.config as SentryPluginDefinitionInput | undefined) ?? {
        sentryOptions: {},
      },
    [pluginMetadata?.config],
  );

  const form = useResettableForm({
    resolver: zodResolver(sentryPluginDefinitionSchema),
    defaultValues,
  });
  const { control, reset, handleSubmit } = form;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        PluginUtils.setPluginConfig(
          draftConfig,
          metadata,
          data,
          definitionContainer,
        );
      },
      {
        successMessage: 'Successfully saved Sentry configuration!',
        onSuccess: () => {
          onSave();
        },
      },
    ),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <div className="sentry:relative sentry:flex sentry:h-full sentry:flex-1 sentry:flex-col sentry:gap-4 sentry:overflow-hidden">
      <div
        className="sentry:mb-[--action-bar-height] sentry:flex sentry:flex-1 sentry:overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        <form onSubmit={onSubmit} className="sentry:max-w-6xl sentry:flex-1">
          <div className="sentry:pb-16">
            <SectionList>
              <SectionListSection>
                <SectionListSectionHeader>
                  <SectionListSectionTitle>
                    Sentry Configuration
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    Sentry provides error monitoring and performance tracking
                    for both your backend and frontend applications. Once
                    enabled, configure the <code>SENTRY_DSN</code> and{' '}
                    <code>VITE_SENTRY_DSN</code> environment variables in your
                    project to activate error reporting.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent>
                  <p className="sentry:text-sm sentry:text-muted-foreground">
                    No additional configuration is required. Save to enable
                    Sentry integration in your project.
                  </p>
                </SectionListSectionContent>
              </SectionListSection>
            </SectionList>
          </div>

          <FormActionBar form={form} allowSaveWithoutDirty={!pluginMetadata} />
        </form>
      </div>
    </div>
  );
}
