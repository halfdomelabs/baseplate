import type { WebConfigProps } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import {
  authRoleEntityType,
  createAndApplyModelMergerResults,
  createModelMergerResults,
  FeatureUtils,
  ModelUtils,
  PluginUtils,
} from '@halfdomelabs/project-builder-lib';
import {
  FeatureComboboxFieldController,
  ModelComboboxFieldController,
  ModelMergerResultAlert,
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import { Button } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';

import { AUTH_DEFAULT_ROLES } from '@src/roles';

import type { Auth0PluginDefinitionInput } from '../schema/plugin-definition';

import { createAuth0Models } from '../schema/models';
import { auth0PluginDefinitionSchema } from '../schema/plugin-definition';
import RoleEditorForm from './role-editor-form';

export function AuthDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definition, definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

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

  const formProps = useResettableForm({
    resolver: zodResolver(auth0PluginDefinitionSchema),
    defaultValues,
  });
  const { control, reset, handleSubmit, watch } = formProps;

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

  return (
    <form onSubmit={onSubmit} className="auth:flex auth:flex-col auth:gap-4">
      <ModelMergerResultAlert pendingModelChanges={pendingModelChanges} />
      <ModelComboboxFieldController
        label="User Model"
        name="modelRefs.user"
        control={control}
        canCreate
      />
      <FeatureComboboxFieldController
        label="Auth Feature Path"
        name="authFeatureRef"
        control={control}
        canCreate
      />
      <RoleEditorForm control={control} />
      <Button type="submit">Save</Button>
    </form>
  );
}
