import type { ModelTransformerWebFormProps } from '@halfdomelabs/project-builder-lib/web';
import type { Control } from 'react-hook-form';

import { PluginUtils } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { SelectField } from '@halfdomelabs/ui-components';

import type { StoragePluginDefinition } from '@src/storage/core/schema/plugin-definition';

import type { FileTransformerConfig } from '../types';

export function FileTransformerForm({
  name,
  formProps: { control },
  originalModel,
  pluginId,
}: ModelTransformerWebFormProps): React.JSX.Element {
  const prefix = name as 'prefix';
  const controlTyped = control as Control<{ prefix: FileTransformerConfig }>;
  const { definition } = useProjectDefinition();

  const storageConfig = PluginUtils.configByIdOrThrow(
    definition,
    pluginId ?? '',
  ) as StoragePluginDefinition;

  const fileRelations =
    originalModel.model.relations?.filter(
      (relation) => relation.modelRef === storageConfig.fileModelRef,
    ) ?? [];

  const relationOptions = fileRelations.map((relation) => ({
    label: relation.name,
    value: relation.id,
  }));

  return (
    <div className="space-y-4">
      <SelectField.Controller
        className="w-full"
        control={controlTyped}
        label="Relation"
        name={`${prefix}.fileRelationRef`}
        options={relationOptions}
      />
    </div>
  );
}
