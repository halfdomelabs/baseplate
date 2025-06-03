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
  ModelMergerResultAlert,
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import { Button, ComboboxFieldController } from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';

import type { StoragePluginDefinitionInput } from '../schema/plugin-definition.js';

import { createStorageModels } from '../schema/models.js';
import { storagePluginDefinitionSchema } from '../schema/plugin-definition.js';
import AdapterEditorForm from './AdapterEditorForm.js';
import CategoryEditorForm from './CategoryEditorForm.js';

export function StorageConfig({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definition, definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as StoragePluginDefinitionInput;
    }

    return {
      modelRefs: {
        file: ModelUtils.getModelIdByNameOrDefault(definition, 'File'),
      },
      storageFeatureRef: FeatureUtils.getFeatureIdByNameOrDefault(
        definition,
        'storage',
      ),
      s3Adapters: [],
      categories: [],
    } satisfies StoragePluginDefinitionInput;
  }, [definition, pluginMetadata?.config]);

  const { control, handleSubmit, formState, watch, reset } =
    useResettableForm<StoragePluginDefinitionInput>({
      resolver: zodResolver(storagePluginDefinitionSchema),
      defaultValues,
    });

  const modelRefs = watch('modelRefs');
  const storageFeatureRef = watch('storageFeatureRef');

  const pendingModelChanges = useMemo(() => {
    const desiredModels = createStorageModels(
      { storageFeatureRef },
      definitionContainer,
    );

    const result = createModelMergerResults(
      modelRefs,
      desiredModels,
      definitionContainer,
    );
    return result;
  }, [definitionContainer, storageFeatureRef, modelRefs]);

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        const featureRef = FeatureUtils.ensureFeatureByNameRecursively(
          draftConfig,
          data.storageFeatureRef,
        );
        const updatedData = {
          ...data,
          storageFeatureRef: featureRef,
        };
        createAndApplyModelMergerResults(
          draftConfig,
          updatedData.modelRefs,
          createStorageModels(updatedData, definitionContainer),
          definitionContainer,
        );
        PluginUtils.setPluginConfig(
          draftConfig,
          metadata,
          data,
          definitionContainer.pluginStore,
        );
      },
      {
        successMessage: pluginMetadata
          ? 'Successfully saved storage plugin!'
          : 'Successfully enabled storage plugin!',
        onSuccess: () => {
          onSave();
        },
      },
    ),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  const modelOptions = definition.models.map((m) => ({
    label: m.name,
    value: m.id,
  }));

  const featureOptions = definition.features.map((m) => ({
    label: m.name,
    value: m.id,
  }));

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="storage:max-w-4xl storage:space-y-4">
        <ModelMergerResultAlert pendingModelChanges={pendingModelChanges} />
        <div className="storage:flex storage:gap-4">
          <ComboboxFieldController
            label="File Model"
            options={modelOptions}
            name="modelRefs.file"
            control={control}
            className="storage:flex-1"
            description="The model to use for file storage."
          />
          <ComboboxFieldController
            label="Storage Feature Path"
            options={featureOptions}
            name="storageFeatureRef"
            control={control}
            className="storage:flex-1"
            description="The feature to use for storage functionality."
          />
        </div>
        <AdapterEditorForm control={control} />
        <CategoryEditorForm control={control} />
        <Button type="submit" disabled={formState.isSubmitting}>
          Save
        </Button>
      </form>
    </div>
  );
}
