import type { ModelTransformerWebFormProps } from '@baseplate-dev/project-builder-lib/web';
import type { Control } from 'react-hook-form';

import {
  authConfigSpec,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  InputFieldController,
  MultiComboboxFieldController,
  SelectFieldController,
} from '@baseplate-dev/ui-components';

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
  const { definition, pluginContainer, definitionContainer } =
    useProjectDefinition();

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

  // Get available auth roles
  const roleOptions = pluginContainer
    .getPluginSpec(authConfigSpec)
    .getAuthRoles(definition)
    .map((role) => ({
      label: role.name,
      value: role.id,
    }));

  // Get available storage adapters
  const adapterOptions = storageConfig.s3Adapters.map((adapter) => ({
    label: adapter.name,
    value: adapter.id,
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

      <div className="storage:space-y-4 storage:rounded-lg storage:border storage:p-4">
        <h3 className="storage:text-lg storage:font-medium storage:text-foreground">
          File Category Configuration
        </h3>

        <div className="sm:storage:grid-cols-2 storage:grid storage:grid-cols-1 storage:gap-4">
          <InputFieldController
            className="storage:w-full"
            control={controlTyped}
            label="Category Name"
            name={`${prefix}.category.name`}
            placeholder="e.g., USER_PROFILE_AVATAR"
            description="Must be CONSTANT_CASE format"
          />

          <InputFieldController
            className="storage:w-full"
            control={controlTyped}
            label="Max File Size (MB)"
            name={`${prefix}.category.maxFileSizeMb`}
            type="number"
            placeholder="e.g., 10"
            description="Maximum file size in megabytes"
          />
        </div>

        <div className="sm:storage:grid-cols-2 storage:grid storage:grid-cols-1 storage:gap-4">
          <MultiComboboxFieldController
            className="storage:w-full"
            control={controlTyped}
            label="Upload Roles"
            name={`${prefix}.category.authorize.uploadRoles`}
            options={roleOptions}
            placeholder="Select roles that can upload..."
            description="User roles authorized to upload files"
          />

          <SelectFieldController
            className="storage:w-full"
            control={controlTyped}
            label="Storage Adapter"
            name={`${prefix}.category.adapterRef`}
            options={adapterOptions}
            placeholder="Select storage adapter..."
            description="Where files will be stored"
          />
        </div>
      </div>
    </div>
  );
}
