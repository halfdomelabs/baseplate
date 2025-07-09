import type { WebConfigProps } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
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

import { RoleEditorForm } from '#src/common/roles/components/index.js';
import { createDefaultAuthRoles } from '#src/common/roles/index.js';

import type { PlaceholderAuthPluginDefinition } from '../schema/plugin-definition.js';

import { createAuthModels } from '../schema/models.js';
import { createPlaceholderAuthPluginDefinitionSchema } from '../schema/plugin-definition.js';

import '#src/styles.css';

export function PlaceholderAuthDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definition, definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const authPluginDefinitionSchema = useDefinitionSchema(
    createPlaceholderAuthPluginDefinitionSchema,
  );

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as PlaceholderAuthPluginDefinition;
    }

    return {
      modelRefs: {
        user: ModelUtils.getModelIdByNameOrDefault(definition, 'User'),
      },
      authFeatureRef: FeatureUtils.getFeatureIdByNameOrDefault(
        definition,
        'auth',
      ),
      roles: createDefaultAuthRoles(),
    } satisfies PlaceholderAuthPluginDefinition;
  }, [definition, pluginMetadata?.config]);

  const form = useResettableForm({
    resolver: zodResolver(authPluginDefinitionSchema),
    defaultValues,
  });
  const { control, reset, handleSubmit, watch } = form;

  const modelRefs = watch('modelRefs');
  const authFeatureRef = watch('authFeatureRef');

  const pendingModelChanges = useMemo(() => {
    const desiredModels = createAuthModels({ modelRefs, authFeatureRef });

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
        updatedData.modelRefs = createAndApplyModelMergerResults(
          draftConfig,
          updatedData.modelRefs,
          createAuthModels(updatedData),
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

  const lens = useLens({ control });

  return (
    <form
      onSubmit={onSubmit}
      className="auth:mb-[--action-bar-height] auth:max-w-6xl"
    >
      <div className="auth:pb-16">
        <SectionList>
          <SectionListSection>
            <SectionListSectionHeader>
              <SectionListSectionTitle>
                Placeholder Auth Configuration
              </SectionListSectionTitle>
              <SectionListSectionDescription>
                Configure your placeholder auth settings, user model, and role
                definitions.
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
  );
}
