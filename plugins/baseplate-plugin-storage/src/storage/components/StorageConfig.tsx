import { PluginUtils, WebConfigProps } from '@halfdomelabs/project-builder-lib';
import {
  useBlockDirtyFormNavigate,
  useErrorHandler,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import { Button, ComboboxField, toast } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';

import AdapterEditorForm from './AdapterEditorForm';
import CategoryEditorForm from './CategoryEditorForm';
import {
  StoragePluginDefinition,
  storagePluginDefinitionSchema,
} from '../schema/plugin-definition';

export function StorageConfig({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): JSX.Element {
  const { definition, setConfigAndFixReferences } = useProjectDefinition();
  const { logAndFormatError } = useErrorHandler();

  const { control, handleSubmit, formState } =
    useResettableForm<StoragePluginDefinition>({
      resolver: zodResolver(storagePluginDefinitionSchema),
      values: pluginMetadata?.config as StoragePluginDefinition,
    });

  useBlockDirtyFormNavigate(formState);

  const onSubmit = handleSubmit((data) => {
    try {
      setConfigAndFixReferences((draftConfig) => {
        PluginUtils.setPluginConfig(draftConfig, metadata, data);
      });
      if (!pluginMetadata) {
        toast.success('Sucessfully enabled storage plugin!');
      } else {
        toast.success('Successfully saved plugin!');
      }
      onSave();
    } catch (err) {
      toast.error(logAndFormatError(err));
    }
  });

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
      <h2>Storage Configuration</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <ComboboxField.Controller
          label="File Model"
          options={modelOptions}
          name="fileModel"
          control={control}
        />
        <ComboboxField.Controller
          label="Storage Feature Path"
          options={featureOptions}
          name="featurePath"
          control={control}
        />
        <AdapterEditorForm control={control} />
        <CategoryEditorForm control={control} />
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}
