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

import type { LocalAuthPluginDefinitionInput } from '../schema/plugin-definition.js';

import { createLocalAuthPartialDefinition } from '../schema/models.js';
import { createLocalAuthPluginDefinitionSchema } from '../schema/plugin-definition.js';

import '#src/styles.css';

export function LocalAuthDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definition, definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const authPluginDefinitionSchema = useDefinitionSchema(
    createLocalAuthPluginDefinitionSchema,
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
      return pluginMetadata.config as LocalAuthPluginDefinitionInput;
    }

    return {
      initialUserRoles: [],
      userAdminRoles: [],
    } satisfies LocalAuthPluginDefinitionInput;
  }, [pluginMetadata?.config]);

  const form = useResettableForm({
    resolver: zodResolver(authPluginDefinitionSchema),
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

  const partialDef = useMemo(
    () => createLocalAuthPartialDefinition(authFeature.name),
    [authFeature.name],
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
        successMessage: 'Successfully saved auth plugin!',
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
                    Local Auth User Models
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    The plugin will automatically configure the models it needs.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="auth:space-y-6">
                  <DefinitionDiffAlert diff={diff} />
                </SectionListSectionContent>
              </SectionListSection>
              <SectionListSection>
                <SectionListSectionHeader>
                  <SectionListSectionTitle>
                    Initial User Setup
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    In order to access the admin panel, an initial user must be
                    created. To make it easier, the plugin will automatically
                    add a seed script to create the initial user provided a
                    .seed.env exists with the INTIIAL_USER_EMAIL and
                    INTIIAL_USER_PASSWORD variables.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="auth:space-y-6">
                  <MultiComboboxFieldController
                    label="Initial User Roles"
                    name="initialUserRoles"
                    control={control}
                    options={roles}
                    description="The roles that will be assigned to the initial user."
                  />
                </SectionListSectionContent>
              </SectionListSection>
              <SectionListSection>
                <SectionListSectionHeader>
                  <SectionListSectionTitle>
                    User Management Permissions
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    Configure which roles can manage users and assign roles to
                    other users in the admin interface.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="auth:space-y-6">
                  <MultiComboboxFieldController
                    label="User Admin Roles"
                    name="userAdminRoles"
                    control={control}
                    options={roles}
                    description="Roles that can manage users and assign roles to other users."
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
