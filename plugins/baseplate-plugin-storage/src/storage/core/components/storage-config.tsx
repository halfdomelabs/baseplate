import type { WebConfigProps } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import {
  applyModelMergerResultInPlace,
  createModelMergerResult,
  createNewModelConfigInput,
  modelEntityType,
  ModelUtils,
  PluginUtils,
} from '@halfdomelabs/project-builder-lib';
import {
  ModelMergerResultAlert,
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import { Button, ComboboxFieldController } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';

import { cn } from '@src/utils/cn';

import type { StoragePluginDefinitionInput } from '../schema/plugin-definition';

import { createStorageModels } from '../schema/models';
import { storagePluginDefinitionSchema } from '../schema/plugin-definition';
import AdapterEditorForm from './AdapterEditorForm';
import CategoryEditorForm from './CategoryEditorForm';

export function StorageConfig({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definition, definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const { control, handleSubmit, formState, watch, reset } =
    useResettableForm<StoragePluginDefinitionInput>({
      resolver: zodResolver(storagePluginDefinitionSchema),
      values: pluginMetadata?.config as StoragePluginDefinitionInput,
    });

  const fileModelRef = watch('fileModelRef');
  const featureRef = watch('featureRef');

  const pendingModelChange = useMemo(() => {
    if (!fileModelRef) return;

    const desiredModels = createStorageModels(definitionContainer);

    const willCreateFileModel = modelEntityType.isId(fileModelRef);
    const fileModel = willCreateFileModel
      ? ModelUtils.byIdOrThrow(definition, fileModelRef)
      : createNewModelConfigInput(fileModelRef, featureRef);
    return createModelMergerResult(
      fileModel,
      desiredModels.file,
      definitionContainer,
      { defaultName: fileModelRef, defaultFeatureRef: featureRef },
    );
  }, [fileModelRef, definitionContainer, definition, featureRef]);

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        if (pendingModelChange) {
          const newModel = applyModelMergerResultInPlace(
            draftConfig,
            pendingModelChange,
            definitionContainer,
            { defaultName: fileModelRef, defaultFeatureRef: featureRef },
          );
          if (pendingModelChange.isNewModel) {
            data.fileModelRef = newModel.id;
          }
        }
        PluginUtils.setPluginConfig(draftConfig, metadata, data);
      },
      {
        successMessage: pluginMetadata
          ? 'Successfully saved plugin!'
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
      <form onSubmit={onSubmit} className={cn('max-w-4xl space-y-4')}>
        <ModelMergerResultAlert pendingModelChanges={[pendingModelChange]} />
        <div className="flex gap-4">
          <ComboboxFieldController
            label="File Model"
            options={modelOptions}
            name="fileModelRef"
            control={control}
            className="flex-1"
            description="The model to use for file storage."
          />
          <ComboboxFieldController
            label="Storage Feature Path"
            options={featureOptions}
            name="featureRef"
            control={control}
            className="flex-1"
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
