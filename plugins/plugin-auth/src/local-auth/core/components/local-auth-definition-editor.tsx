import type { WebConfigProps } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  createAndApplyModelMergerResults,
  createModelMergerResults,
  doesModelMergerResultsHaveChanges,
  ModelUtils,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  ModelComboboxFieldController,
  ModelMergerResultAlert,
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

import { createAuthModels } from '../schema/models.js';
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
  const roles = authDefinition.roles.map((role) => ({
    label: role.name,
    value: role.id,
  }));

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as LocalAuthPluginDefinitionInput;
    }

    return {
      modelRefs: {
        user: ModelUtils.getModelIdByNameOrDefault(definition, 'User'),
        userAccount: ModelUtils.getModelIdByNameOrDefault(
          definition,
          'UserAccount',
        ),
        userRole: ModelUtils.getModelIdByNameOrDefault(definition, 'UserRole'),
        userSession: ModelUtils.getModelIdByNameOrDefault(
          definition,
          'UserSession',
        ),
      },
      initialUserRoles: [],
    } satisfies LocalAuthPluginDefinitionInput;
  }, [definition, pluginMetadata?.config]);

  const form = useResettableForm({
    resolver: zodResolver(authPluginDefinitionSchema),
    defaultValues,
  });
  const { control, reset, handleSubmit, watch } = form;

  const modelRefs = watch('modelRefs');

  const pendingModelChanges = useMemo(() => {
    const desiredModels = createAuthModels({ modelRefs }, authDefinition);

    return createModelMergerResults(
      modelRefs,
      desiredModels,
      definitionContainer,
    );
  }, [definitionContainer, authDefinition, modelRefs]);

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        const updatedData = {
          ...data,
        };
        updatedData.modelRefs = createAndApplyModelMergerResults(
          draftConfig,
          updatedData.modelRefs,
          createAuthModels(updatedData, authDefinition),
          definitionContainer,
        );
        PluginUtils.setPluginConfig(
          draftConfig,
          metadata,
          updatedData,
          definitionContainer.pluginStore,
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
                    Configure your local authentication user models.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="auth:space-y-6">
                  <ModelMergerResultAlert
                    pendingModelChanges={pendingModelChanges}
                  />

                  <div className="auth:grid auth:grid-cols-1 auth:gap-6 auth:md:grid-cols-2">
                    <ModelComboboxFieldController
                      label="User Model"
                      name="modelRefs.user"
                      control={control}
                      canCreate
                      description="The main user model for authentication"
                    />
                    <ModelComboboxFieldController
                      label="User Account Model"
                      name="modelRefs.userAccount"
                      control={control}
                      canCreate
                      description="Model for user account credentials"
                    />
                    <ModelComboboxFieldController
                      label="User Role Model"
                      name="modelRefs.userRole"
                      control={control}
                      canCreate
                      description="Model for assigning roles to users"
                    />
                    <ModelComboboxFieldController
                      label="User Session Model"
                      name="modelRefs.userSession"
                      control={control}
                      canCreate
                      description="Model for managing user sessions"
                    />
                  </div>
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
            </SectionList>
          </div>

          <FormActionBar
            form={form}
            allowSaveWithoutDirty={
              !pluginMetadata ||
              doesModelMergerResultsHaveChanges(pendingModelChanges)
            }
          />
        </form>
      </div>
    </div>
  );
}
