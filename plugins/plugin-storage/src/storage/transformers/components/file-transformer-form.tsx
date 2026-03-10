import type { ModelTransformerWebFormProps } from '@baseplate-dev/project-builder-lib/web';
import type { Control } from 'react-hook-form';

import { PluginUtils } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import { SelectFieldController } from '@baseplate-dev/ui-components';

import type { StoragePluginDefinition } from '#src/storage/core/schema/plugin-definition.js';

import { STORAGE_MODELS } from '#src/storage/constants/model-names.js';

import type { FileTransformerDefinition } from '../schema/file-transformer.schema.js';

import '#src/styles.css';

export function FileTransformerForm({
  name,
  formProps: { control },
  originalModel,
  pluginKey,
}: ModelTransformerWebFormProps): React.JSX.Element {
  const prefix = name as 'prefix';
  const controlTyped = control as Control<{
    prefix: FileTransformerDefinition;
  }>;
  const { definition, definitionContainer } = useProjectDefinition();

  const storageConfig = PluginUtils.configByKeyOrThrow(
    definition,
    pluginKey ?? '',
  ) as StoragePluginDefinition;

  const fileRelations =
    originalModel.model.relations?.filter(
      (relation) =>
        definitionContainer.nameFromId(relation.modelRef) ===
        STORAGE_MODELS.file,
    ) ?? [];

  const relationOptions = fileRelations.map((relation) => ({
    label: relation.name,
    value: relation.id,
  }));

  // Get available file categories from plugin config
  const categoryOptions = storageConfig.fileCategories.map((category) => ({
    label: category.name,
    value: category.id,
  }));

  return (
    <div className="storage:space-y-6">
      <SelectFieldController
        className="storage:w-full"
        control={controlTyped}
        label="File Relation"
        name={`${prefix}.fileRelationRef`}
        options={relationOptions}
        placeholder="Select a file relation..."
      />

      <SelectFieldController
        className="storage:w-full"
        control={controlTyped}
        label="File Category"
        name={`${prefix}.categoryRef`}
        options={categoryOptions}
        placeholder="Select a file category..."
        description="The file category that defines upload constraints and authorization for this relation"
      />
    </div>
  );
}
