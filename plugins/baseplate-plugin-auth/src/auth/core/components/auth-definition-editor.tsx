import type { WebConfigProps } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import {
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

import { createDefaultAuthRoles } from '@src/roles';
import { cn } from '@src/utils/cn';

import type { AuthPluginDefinitionInput } from '../schema/plugin-definition';

import { createAuthModels } from '../schema/models';
import { authPluginDefinitionSchema } from '../schema/plugin-definition';
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

  const formProps = useResettableForm({
    resolver: zodResolver(authPluginDefinitionSchema),
    defaultValues,
  });
  const { control, reset, handleSubmit, watch } = formProps;

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
        createAndApplyModelMergerResults(
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
    <form onSubmit={onSubmit} className={cn('flex flex-col gap-4')}>
      <ModelMergerResultAlert pendingModelChanges={pendingModelChanges} />
      <ModelComboboxFieldController
        label="User Account Model"
        name="modelRefs.userAccount"
        control={control}
        canCreate
      />
      <ModelComboboxFieldController
        label="User Account Model"
        name="modelRefs.userAccount"
        control={control}
        canCreate
      />
      <ModelComboboxFieldController
        label="User Account Model"
        name="modelRefs.userAccount"
        control={control}
        canCreate
      />
      <ModelComboboxFieldController
        label="User Account Model"
        name="modelRefs.userAccount"
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
