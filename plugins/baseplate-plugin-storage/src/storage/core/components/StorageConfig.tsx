import {
  ModelUtils,
  PluginUtils,
  WebConfigProps,
  applyModelPatchInPlace,
  diffModel,
} from '@halfdomelabs/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useErrorHandler,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import {
  Alert,
  Button,
  ComboboxField,
  toast,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';

import AdapterEditorForm from './AdapterEditorForm';
import CategoryEditorForm from './CategoryEditorForm';
import { createStorageModels } from '../schema/models';
import {
  StoragePluginDefinition,
  storagePluginDefinitionSchema,
} from '../schema/plugin-definition';
import { cn } from '@src/utils/cn';

export function StorageConfig({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): JSX.Element {
  const { definition, definitionContainer, setConfigAndFixReferences } =
    useProjectDefinition();
  const { logAndFormatError } = useErrorHandler();

  const { control, handleSubmit, formState, watch, reset } =
    useResettableForm<StoragePluginDefinition>({
      resolver: zodResolver(storagePluginDefinitionSchema),
      values: pluginMetadata?.config as StoragePluginDefinition,
    });

  const onSubmit = handleSubmit((data) => {
    try {
      setConfigAndFixReferences((draftConfig) => {
        if (pendingModelChanges) {
          const model = ModelUtils.byIdOrThrow(draftConfig, data.fileModelRef);
          applyModelPatchInPlace(
            model.model,
            pendingModelChanges,
            definitionContainer,
          );
        }
        PluginUtils.setPluginConfig(draftConfig, metadata, data);
      });
      if (!pluginMetadata) {
        toast.success('Sucessfully enabled storage plugin!');
      } else {
        toast.success('Successfully saved plugin!');
      }
      reset(data);
      onSave();
    } catch (err) {
      toast.error(logAndFormatError(err));
    }
  });

  useBlockUnsavedChangesNavigate(formState, { reset, onSubmit });

  const fileModelRef = watch('fileModelRef');

  const pendingModelChanges = useMemo(() => {
    if (!fileModelRef) return undefined;

    const model = ModelUtils.byIdOrThrow(definition, fileModelRef);
    const desiredModel = createStorageModels(definitionContainer);
    return diffModel(model.model, desiredModel.file, definitionContainer);
  }, [fileModelRef, definitionContainer, definition]);

  const modelOptions = definition.models.map((m) => ({
    label: m.name,
    value: m.id,
  }));

  const featureOptions =
    definition.features?.map((m) => ({
      label: m.name,
      value: m.id,
    })) ?? [];

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className={cn('space-y-4 max-w-4xl')}>
        {pendingModelChanges && (
          <Alert>
            <Alert.Title>Model Changes</Alert.Title>
            <Alert.Description>
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
                {pendingModelChanges.relations?.length > 0 && (
                  <li>
                    {pendingModelChanges.relations.length} relation(s) will be
                    added or updated.
                  </li>
                )}
                {pendingModelChanges.primaryKeyFieldRefs && (
                  <li>The primary key will be updated.</li>
                )}
              </ul>
            </Alert.Description>
          </Alert>
        )}
        <div className="flex gap-4">
          <ComboboxField.Controller
            label="File Model"
            options={modelOptions}
            name="fileModelRef"
            control={control}
            className="flex-1"
            description="The model to use for file storage."
          />
          <ComboboxField.Controller
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
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}
