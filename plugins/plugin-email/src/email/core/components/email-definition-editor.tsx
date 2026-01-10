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

import { EmailConfigTabs } from '#src/common/index.js';

import type { EmailPluginDefinitionInput } from '../schema/plugin-definition.js';

import { createEmailPluginDefinitionSchema } from '../schema/plugin-definition.js';

import '#src/styles.css';

export function EmailDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const {
    definitionContainer,
    schemaParserContext,
    saveDefinitionWithFeedback,
  } = useProjectDefinition();

  const emailPluginDefinitionSchema = useDefinitionSchema(
    createEmailPluginDefinitionSchema,
  );

  const availableImplementations = getManagedPluginsForPlugin(
    schemaParserContext.pluginStore,
    metadata.key,
  );

  // Use postmark by default
  const postmarkImplementation = availableImplementations.find(
    (i) => i.fullyQualifiedName === '@baseplate-dev/plugin-email:postmark',
  );

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as EmailPluginDefinitionInput;
    }

    const implementationKey =
      availableImplementations.length > 0
        ? (postmarkImplementation ?? availableImplementations[0]).key
        : '';

    return {
      implementationPluginKey: implementationKey,
    } satisfies EmailPluginDefinitionInput;
  }, [
    pluginMetadata?.config,
    postmarkImplementation,
    availableImplementations,
  ]);

  const form = useResettableForm({
    resolver: zodResolver(emailPluginDefinitionSchema),
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
    (pluginMetadata?.config as EmailPluginDefinitionInput | undefined)
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
        successMessage: `Successfully saved email plugin! ${selectedImplementationUrl && !isSelectedImplementationActive ? `Please configure the provider plugin before syncing.` : ''}`,
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
    <div className="email:relative email:flex email:h-full email:flex-1 email:flex-col email:gap-4 email:overflow-hidden">
      <EmailConfigTabs />
      <div
        className="email:mb-[--action-bar-height] email:flex email:flex-1 email:overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        <form onSubmit={onSubmit} className="email:max-w-6xl email:flex-1">
          <div className="email:pb-16">
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
                        className="email:inline-block email:font-medium"
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
                    Configure the general settings for the email plugin.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="email:space-y-6">
                  <SelectFieldController
                    label="Email Provider"
                    name="implementationPluginKey"
                    control={control}
                    options={availableImplementations}
                    renderItemLabel={(item) => (
                      <div className="email:flex email:flex-col email:gap-2">
                        <div className="email:text-sm email:font-medium">
                          {item.displayName}
                        </div>
                        <div className="email:text-sm email:text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                    )}
                    getOptionLabel={(item) => item.displayName}
                    getOptionValue={(item) => item.key}
                    description="The email provider to use for your project"
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
