import type { WebConfigProps } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  getManagedPluginsForPlugin,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useDefinitionSchema,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  FormActionBar,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SelectFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';

import { QueueConfigTabs } from '#src/common/index.js';

import type { QueuePluginDefinitionInput } from '../schema/plugin-definition.js';

import { createQueuePluginDefinitionSchema } from '../schema/plugin-definition.js';

import '#src/styles.css';

export function QueueDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const {
    definitionContainer,
    schemaParserContext,
    saveDefinitionWithFeedback,
  } = useProjectDefinition();

  const queuePluginDefinitionSchema = useDefinitionSchema(
    createQueuePluginDefinitionSchema,
  );

  const availableImplementations = getManagedPluginsForPlugin(
    schemaParserContext.pluginStore,
    metadata.key,
  );

  // Use pg-boss by default
  const pgBossImplementation = availableImplementations.find(
    (i) => i.fullyQualifiedName === '@baseplate-dev/plugin-queue:pg-boss',
  );

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as QueuePluginDefinitionInput;
    }

    const implementationKey =
      availableImplementations.length > 0
        ? (pgBossImplementation ?? availableImplementations[0]).key
        : '';

    return {
      implementationPluginKey: implementationKey,
    } satisfies QueuePluginDefinitionInput;
  }, [pluginMetadata?.config, pgBossImplementation, availableImplementations]);

  const form = useResettableForm({
    resolver: zodResolver(queuePluginDefinitionSchema),
    defaultValues,
  });
  const { control, reset, handleSubmit, watch } = form;

  const implementationPluginKey = watch('implementationPluginKey');
  const selectedPlugin =
    implementationPluginKey &&
    availableImplementations.find((i) => i.key === implementationPluginKey);
  const isSelectedImplementationActive = !!PluginUtils.byKey(
    definitionContainer.definition,
    implementationPluginKey,
  );
  const hasSelectedImplementationChanged =
    implementationPluginKey !==
    (pluginMetadata?.config as QueuePluginDefinitionInput | undefined)
      ?.implementationPluginKey;

  const selectedImplementationUrl = selectedPlugin
    ? `/plugins/edit/${selectedPlugin.key}`
    : undefined;
  const navigate = useNavigate();

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        PluginUtils.setPluginConfig(
          draftConfig,
          metadata,
          data,
          definitionContainer,
        );

        // Make sure we disable other plugins that are not the selected implementation
        const otherPlugins = availableImplementations.filter(
          (i) => i.key !== implementationPluginKey,
        );
        for (const plugin of otherPlugins) {
          PluginUtils.disablePlugin(
            draftConfig,
            plugin.key,
            definitionContainer.parserContext,
          );
        }
      },
      {
        successMessage: `Successfully saved queue plugin! ${selectedImplementationUrl && !isSelectedImplementationActive ? `Please configure the provider plugin before syncing.` : ''}`,
        onSuccess: () => {
          onSave();

          if (selectedImplementationUrl && !isSelectedImplementationActive) {
            setTimeout(() => {
              navigate({ to: selectedImplementationUrl });
            }, 100);
          }
        },
      },
    ),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <div className="queue:relative queue:flex queue:h-full queue:flex-1 queue:flex-col queue:gap-4 queue:overflow-hidden">
      <QueueConfigTabs />
      <div
        className="queue:mb-[--action-bar-height] queue:flex queue:flex-1 queue:overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        <form onSubmit={onSubmit} className="queue:max-w-6xl queue:flex-1">
          <div className="queue:pb-16">
            {!isSelectedImplementationActive &&
              selectedPlugin &&
              !hasSelectedImplementationChanged && (
                <Alert variant="warning">
                  <AlertTitle>Implementation Provider Not Active</AlertTitle>
                  <AlertDescription>
                    <p>
                      The selected implementation provider is not active. Please
                      make sure{' '}
                      <Link
                        to={selectedImplementationUrl}
                        className="queue:inline-block queue:font-medium"
                      >
                        configure the provider
                      </Link>{' '}
                      before syncing.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            <SectionList>
              <SectionListSection>
                <SectionListSectionHeader>
                  <SectionListSectionTitle>
                    General Settings
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    Configure the general settings for the queue plugin.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="queue:space-y-6">
                  <SelectFieldController
                    label="Queue Provider"
                    name="implementationPluginKey"
                    control={control}
                    options={availableImplementations}
                    renderItemLabel={(item) => (
                      <div className="queue:flex queue:flex-col queue:gap-2">
                        <div className="queue:text-sm queue:font-medium">
                          {item.displayName}
                        </div>
                        <div className="queue:text-sm queue:text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                    )}
                    getOptionLabel={(item) => item.displayName}
                    getOptionValue={(item) => item.key}
                    description="The queue provider to use for your project"
                  />
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
