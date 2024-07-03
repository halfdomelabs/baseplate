import { PluginUtils } from '@halfdomelabs/project-builder-lib';
import {
  ModelTransformerWebFormProps,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import { SelectField } from '@halfdomelabs/ui-components';
import { Control } from 'react-hook-form';

import { FileTransformerConfig } from '../types';
import { StoragePluginDefinition } from '@src/storage/core/schema/plugin-definition';

export function FileTransformerForm({
  name,
  formProps: { control },
  originalModel,
  pluginId,
}: ModelTransformerWebFormProps): JSX.Element {
  const prefix = name as 'prefix';
  const controlTyped = control as Control<{ prefix: FileTransformerConfig }>;
  const { definition } = useProjectDefinition();

  const storageConfig = PluginUtils.configByIdOrThrow<StoragePluginDefinition>(
    definition,
    pluginId ?? '',
  );

  const fileRelations =
    originalModel.model.relations?.filter(
      (relation) => relation.modelName === storageConfig.fileModel,
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
