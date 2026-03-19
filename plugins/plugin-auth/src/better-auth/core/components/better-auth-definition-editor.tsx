import type { WebConfigProps } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  applyMergedDefinition,
  diffDefinition,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  DefinitionDiffAlert,
  useBlockUnsavedChangesNavigate,
  useDefinitionSchema,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  FormActionBar,
  MultiComboboxFieldController,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';

import { getAuthPluginDefinition } from '#src/auth/utils/get-auth-plugin-definition.js';
import { AuthConfigTabs } from '#src/common/components/auth-config-tabs.js';

import type { BetterAuthPluginDefinitionInput } from '../schema/plugin-definition.js';

import { createBetterAuthPartialDefinition } from '../schema/models.js';
import { createBetterAuthPluginDefinitionSchema } from '../schema/plugin-definition.js';

import '#src/styles.css';

export function BetterAuthDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definition, definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const betterAuthPluginDefinitionSchema = useDefinitionSchema(
    createBetterAuthPluginDefinitionSchema,
  );

  const authDefinition = getAuthPluginDefinition(definition);
  const roles = authDefinition.roles
    .filter((role) => !role.builtIn)
    .map((role) => ({
      label: role.name,
      value: role.id,
    }));

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as BetterAuthPluginDefinitionInput;
    }

    return {
      additionalUserAdminRoles: [],
    } satisfies BetterAuthPluginDefinitionInput;
  }, [pluginMetadata?.config]);

  const form = useResettableForm({
    resolver: zodResolver(betterAuthPluginDefinitionSchema),
    defaultValues,
  });
  const { control, reset, handleSubmit } = form;

  const authFeature = definition.features.find(
    (f) => f.id === authDefinition.authFeatureRef,
  );
  if (!authFeature) {
    throw new Error(
      `Auth feature not found for ref: ${authDefinition.authFeatureRef}`,
    );
  }

  const accountsFeature = definition.features.find(
    (f) => f.id === authDefinition.accountsFeatureRef,
  );
  if (!accountsFeature) {
    throw new Error(
      `Accounts feature not found for ref: ${authDefinition.accountsFeatureRef}`,
    );
  }

  const partialDef = useMemo(
    () =>
      createBetterAuthPartialDefinition(authFeature.name, accountsFeature.name),
    [authFeature.name, accountsFeature.name],
  );

  const diff = useMemo(
    () =>
      diffDefinition(
        definitionContainer.schema,
        definitionContainer.definition,
        partialDef,
      ),
    [definitionContainer, partialDef],
  );

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        const updatedData = {
          ...data,
        };
        applyMergedDefinition(definitionContainer, partialDef)(draftConfig);
        PluginUtils.setPluginConfig(
          draftConfig,
          metadata,
          updatedData,
          definitionContainer,
        );
      },
      {
        successMessage: 'Successfully saved Better Auth plugin!',
        onSuccess: () => {
          onSave();
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
            <SectionList>
              <SectionListSection>
                <SectionListSectionHeader>
                  <SectionListSectionTitle>
                    Better Auth Configuration
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    The plugin will automatically configure the models it needs.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="auth:space-y-6">
                  <DefinitionDiffAlert
                    diff={diff}
                    upToDateMessage="All required models are already configured correctly. No changes needed."
                  />
                </SectionListSectionContent>
              </SectionListSection>
              <SectionListSection>
                <SectionListSectionHeader>
                  <SectionListSectionTitle>
                    User Management Permissions
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    The &quot;admin&quot; role always has user management
                    permissions. Optionally add more roles that can manage users
                    and assign roles in the admin interface.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="auth:space-y-6">
                  <MultiComboboxFieldController
                    label="Additional User Admin Roles"
                    name="additionalUserAdminRoles"
                    control={control}
                    options={roles}
                    description="Additional roles (beyond admin) that can manage users and assign roles."
                  />
                </SectionListSectionContent>
              </SectionListSection>
            </SectionList>
          </div>

          <FormActionBar
            form={form}
            allowSaveWithoutDirty={!pluginMetadata || diff.hasChanges}
          />
        </form>
      </div>
    </div>
  );
}
