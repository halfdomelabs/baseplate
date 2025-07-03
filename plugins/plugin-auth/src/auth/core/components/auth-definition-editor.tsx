import type { WebConfigProps } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  createAndApplyModelMergerResults,
  createModelMergerResults,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormActionBar,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';

import { createDefaultAuthRoles } from '#src/roles/index.js';

import type { AuthPluginDefinitionInput } from '../schema/plugin-definition.js';

import { createAuthModels } from '../schema/models.js';
import { createAuthPluginDefinitionSchema } from '../schema/plugin-definition.js';
import RoleEditorForm from './role-editor-form.js';

import '#src/styles.css';

export function AuthDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definition, definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const authPluginDefinitionSchema = useDefinitionSchema(
    createAuthPluginDefinitionSchema,
  );

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as AuthPluginDefinitionInput;
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
      authFeatureRef: FeatureUtils.getFeatureIdByNameOrDefault(
        definition,
        'auth',
      ),
      roles: createDefaultAuthRoles(),
    } satisfies AuthPluginDefinitionInput;
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

  return (
    <form
      onSubmit={onSubmit}
      className="auth:relative auth:min-h-[calc(100vh-8rem)] auth:pb-16"
    >
      <div className="auth:max-w-3xl auth:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Local Authentication Configuration</CardTitle>
            <CardDescription>
              Configure your local authentication settings, user models, and
              role definitions.
            </CardDescription>
          </CardHeader>
          <CardContent className="auth:space-y-6">
            <ModelMergerResultAlert pendingModelChanges={pendingModelChanges} />

            <div className="md:auth:grid-cols-2 auth:grid auth:grid-cols-1 auth:gap-6">
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

            <div className="auth:space-y-2">
              <FeatureComboboxFieldController
                label="Auth Feature Path"
                name="authFeatureRef"
                control={control}
                canCreate
                description="Specify the feature path where authentication endpoints will be generated"
              />
            </div>
          </CardContent>
        </Card>

        <RoleEditorForm control={control} />
      </div>

      <FormActionBar form={form} />
    </form>
  );
}
