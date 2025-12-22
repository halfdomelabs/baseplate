import type { WebConfigProps } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  FeatureUtils,
  getManagedPluginsForPlugin,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  FeatureComboboxFieldController,
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

import { AuthConfigTabs } from '#src/common/components/auth-config-tabs.js';

import type { AuthPluginDefinitionInput } from '../schema/plugin-definition.js';

import { createAuthPluginDefinitionSchema } from '../schema/plugin-definition.js';
import { createDefaultAuthRoles } from '../schema/roles/constants.js';
import { RoleEditorForm } from './role-editor-form/role-editor-form.js';

import '#src/styles.css';

export function AuthDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const {
    definition,
    definitionContainer,
    schemaParserContext,
    saveDefinitionWithFeedback,
  } = useProjectDefinition();

  const authPluginDefinitionSchema = useDefinitionSchema(
    createAuthPluginDefinitionSchema,
  );

  const availableImplementations = getManagedPluginsForPlugin(
    schemaParserContext.pluginStore,
    metadata.key,
  );
  // Use local auth by default
  const defaultImplementation =
    availableImplementations.find(
      (i) => i.fullyQualifiedName === '@baseplate-dev/plugin-auth:local-auth',
    ) ?? availableImplementations[0];

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as AuthPluginDefinitionInput;
    }

    const defaultAuthFeatureRef = FeatureUtils.getFeatureIdByNameOrDefault(
      definition,
      'auth',
    );

    return {
      implementationPluginKey: defaultImplementation.key,
      authFeatureRef: defaultAuthFeatureRef,
      roles: createDefaultAuthRoles(),
    } satisfies AuthPluginDefinitionInput;
  }, [definition, pluginMetadata?.config, defaultImplementation]);

  const form = useResettableForm({
    resolver: zodResolver(authPluginDefinitionSchema),
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
    (pluginMetadata?.config as AuthPluginDefinitionInput | undefined)
      ?.implementationPluginKey;

  const selectedImplementationUrl = selectedPlugin
    ? `/plugins/edit/${selectedPlugin.key}`
    : undefined;
  const navigate = useNavigate();

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        const featureRef = FeatureUtils.ensureFeatureByNameRecursively(
          draftConfig,
          data.authFeatureRef,
        );
        PluginUtils.setPluginConfig(
          draftConfig,
          metadata,
          {
            ...data,
            authFeatureRef: featureRef,
          },
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
        successMessage: `Successfully saved auth plugin! ${selectedImplementationUrl && !isSelectedImplementationActive ? `Please configure the provider plugin before syncing.` : ''}`,
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
    <div className="auth:relative auth:flex auth:h-full auth:flex-1 auth:flex-col auth:gap-4 auth:overflow-hidden">
      <AuthConfigTabs />
      <div
        className="auth:mb-[--action-bar-height] auth:flex auth:flex-1 auth:overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        <form onSubmit={onSubmit} className="auth:max-w-6xl auth:flex-1">
          <div className="auth:pb-16">
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
                        className="auth:inline-block auth:font-medium"
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
                    Configure the general settings for the auth plugin.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="auth:space-y-6">
                  <FeatureComboboxFieldController
                    label="Auth Feature Path"
                    name="authFeatureRef"
                    control={control}
                    canCreate
                    description="Specify the feature path where auth functionality will be generated"
                  />
                  <SelectFieldController
                    label="Authentication Provider"
                    name="implementationPluginKey"
                    control={control}
                    options={availableImplementations}
                    renderItemLabel={(item) => (
                      <div className="auth:flex auth:flex-col auth:gap-2">
                        <div className="auth:text-sm auth:font-medium">
                          {item.displayName}
                        </div>
                        <div className="auth:text-sm auth:text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                    )}
                    getOptionLabel={(item) => item.displayName}
                    getOptionValue={(item) => item.key}
                    description="The authentication provider to use for your project"
                  />
                </SectionListSectionContent>
              </SectionListSection>

              <RoleEditorForm control={control} />
            </SectionList>
          </div>

          <FormActionBar form={form} allowSaveWithoutDirty={!pluginMetadata} />
        </form>
      </div>
    </div>
  );
}
