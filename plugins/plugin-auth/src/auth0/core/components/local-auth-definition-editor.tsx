import type { WebConfigProps } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  authRoleEntityType,
  createAndApplyModelMergerResults,
  createModelMergerResults,
  doesModelMergerResultsHaveChanges,
  FeatureUtils,
  ModelUtils,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  FeatureComboboxFieldController,
  ModelComboboxFieldController,
  ModelMergerResultAlert,
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
import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';

import { AuthConfigTabs } from '#src/common/components/auth-config-tabs.js';
import { RoleEditorForm } from '#src/common/roles/components/index.js';
import { AUTH_DEFAULT_ROLES } from '#src/common/roles/index.js';

import type { Auth0PluginDefinitionInput } from '../schema/plugin-definition.js';

import { createAuth0Models } from '../schema/models.js';
import { createAuth0PluginDefinitionSchema } from '../schema/plugin-definition.js';

import '#src/styles.css';

export function LocalAuthDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definition, definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const auth0PluginDefinitionSchema = useDefinitionSchema(
    createAuth0PluginDefinitionSchema,
  );

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as Auth0PluginDefinitionInput;
    }

    return {
      modelRefs: {
        user: ModelUtils.getModelIdByNameOrDefault(definition, 'User'),
      },
      authFeatureRef: FeatureUtils.getFeatureIdByNameOrDefault(
        definition,
        'auth',
      ),
      roles: AUTH_DEFAULT_ROLES.map((r) => ({
        ...r,
        id: authRoleEntityType.generateNewId(),
      })),
    } satisfies Auth0PluginDefinitionInput;
  }, [definition, pluginMetadata?.config]);

  const form = useResettableForm({
    resolver: zodResolver(auth0PluginDefinitionSchema),
    defaultValues,
  });
  const { control, reset, handleSubmit, watch } = form;

  const modelRefs = watch('modelRefs');
  const authFeatureRef = watch('authFeatureRef');

  const pendingModelChanges = useMemo(() => {
    const desiredModels = createAuth0Models({ modelRefs, authFeatureRef });

    return createModelMergerResults(
      modelRefs,
      desiredModels,
      definitionContainer,
    );
  }, [definitionContainer, authFeatureRef, modelRefs]);

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        const featureRef = FeatureUtils.ensureFeatureByNameRecursively(
          draftConfig,
          data.authFeatureRef,
        );
        const updatedData = {
          ...data,
          authFeatureRef: featureRef,
        };
        createAndApplyModelMergerResults(
          draftConfig,
          updatedData.modelRefs,
          createAuth0Models(updatedData),
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
        successMessage: 'Successfully saved Auth0 plugin!',
        onSuccess: () => {
          onSave();
        },
      },
    ),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  const lens = useLens({ control });

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
                    Auth0 Configuration
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    Configure your Auth0 authentication settings, user model,
                    and role definitions.
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
                      description="Select or create the model that will store user authentication data"
                    />
                    <FeatureComboboxFieldController
                      label="Auth Feature Path"
                      name="authFeatureRef"
                      control={control}
                      canCreate
                      description="Specify the feature path where authentication endpoints will be generated"
                    />
                  </div>
                </SectionListSectionContent>
              </SectionListSection>

              <RoleEditorForm lens={lens.focus('roles')} />
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
