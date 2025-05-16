import type { WebConfigProps } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import {
  applyModelMergerResultInPlace,
  authRoleEntityType,
  createModelMergerResult,
  createNewModelConfigInput,
  FeatureUtils,
  modelEntityType,
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

import type { Auth0PluginDefinitionInput } from '../schema/plugin-definition';

import { createAuth0Models } from '../schema/models';
import {
  AUTH_DEFAULT_ROLES,
  auth0PluginDefinitionSchema,
} from '../schema/plugin-definition';
import RoleEditorForm from './role-editor-form';

const USER_ACCOUNT_MODEL_NAME = 'UserAccount';

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
    const defaultModel = definition.models.find(
      (m) => m.name === USER_ACCOUNT_MODEL_NAME,
    );
    const defaultFeature = FeatureUtils.getFeatureByName(definition, 'auth');
    return {
      userAccountModelRef: defaultModel?.id ?? USER_ACCOUNT_MODEL_NAME,
      authFeatureRef: defaultFeature?.id ?? 'auth',
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

  const userModelRef = watch('userAccountModelRef');
  const featureRef = watch('authFeatureRef');

  const pendingModelChange = useMemo(() => {
    if (!userModelRef) return;

    const desiredModels = createAuth0Models();

    const willCreateUserModel = modelEntityType.isId(userModelRef);
    const userModel = willCreateUserModel
      ? ModelUtils.byIdOrThrow(definition, userModelRef)
      : createNewModelConfigInput(userModelRef, featureRef);
    return createModelMergerResult(
      userModel,
      desiredModels.user,
      definitionContainer,
      { defaultName: userModelRef, defaultFeatureRef: featureRef },
    );
  }, [userModelRef, definitionContainer, definition, featureRef]);

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
        if (pendingModelChange) {
          const newModel = applyModelMergerResultInPlace(
            draftConfig,
            pendingModelChange,
            definitionContainer,
            { defaultName: userModelRef, defaultFeatureRef: featureRef },
          );
          if (pendingModelChange.isNewModel) {
            updatedData.userAccountModelRef = newModel.id;
          }
        }
        PluginUtils.setPluginConfig(draftConfig, metadata, updatedData);
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
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <ModelMergerResultAlert pendingModelChanges={[pendingModelChange]} />
      <ModelComboboxFieldController
        label="User Account Model"
        name="userAccountModelRef"
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
