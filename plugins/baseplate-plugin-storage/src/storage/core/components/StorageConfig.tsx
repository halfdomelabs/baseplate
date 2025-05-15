import type { WebConfigProps } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import {
  applyModelPatchInPlace,
  diffModel,
  ModelUtils,
  PluginUtils,
} from '@halfdomelabs/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  ComboboxFieldController,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';

import { cn } from '@src/utils/cn';

import type { StoragePluginDefinition } from '../schema/plugin-definition';

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
    useResettableForm<StoragePluginDefinition>({
      resolver: zodResolver(storagePluginDefinitionSchema),
      values: pluginMetadata?.config as StoragePluginDefinition,
    });

  const fileModelRef = watch('fileModelRef');

  const pendingModelChanges = useMemo(() => {
    if (!fileModelRef) return;

    const model = ModelUtils.byIdOrThrow(definition, fileModelRef);
    const desiredModel = createStorageModels(definitionContainer);
    return diffModel(model.model, desiredModel.file, definitionContainer);
  }, [fileModelRef, definitionContainer, definition]);

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        if (pendingModelChanges) {
          const model = ModelUtils.byIdOrThrow(draftConfig, data.fileModelRef);
          applyModelPatchInPlace(
            model.model,
            pendingModelChanges,
            definitionContainer,
          );
        }
        PluginUtils.setPluginConfig(draftConfig, metadata, data);
      },
      {
        successMessage: pluginMetadata
          ? 'Successfully saved plugin!'
          : 'Sucessfully enabled storage plugin!',
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
        {pendingModelChanges && (
          <Alert>
            <AlertTitle>Model Changes</AlertTitle>
            <AlertDescription>
              <p>
                The selected file model will be updated to include the required
                fields for the storage plugin. The following changes will be
                applied:
              </p>
              <ul>
                {pendingModelChanges.fields.length > 0 && (
                  <li>
                    {pendingModelChanges.fields.length} field(s) will be added
                    or updated.
                  </li>
                )}
                {pendingModelChanges.relations.length > 0 && (
                  <li>
                    {pendingModelChanges.relations.length} relation(s) will be
                    added or updated.
                  </li>
                )}
                {pendingModelChanges.primaryKeyFieldRefs && (
                  <li>The primary key will be updated.</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
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
