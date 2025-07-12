import type { AdminCrudInputWebFormProps } from '@baseplate-dev/project-builder-lib/web';
import type { Control } from 'react-hook-form';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import { SelectFieldController } from '@baseplate-dev/ui-components';

import type { FileTransformerDefinition } from '../transformers/schema/file-transformer.schema.js';
import type { AdminCrudFileInputConfig } from './types.js';

export function AdminCrudFileInputForm({
  formProps,
  name,
  model,
}: AdminCrudInputWebFormProps): React.JSX.Element {
  const { definitionContainer } = useProjectDefinition();
  const fileTransformerOptions = model.service.transformers
    .filter((t): t is FileTransformerDefinition => t.type === 'file')
    .map((transformer) => ({
      label: definitionContainer.nameFromId(transformer.fileRelationRef),
      value: transformer.id,
    }));
  const prefix = name as 'prefix';
  const controlTyped = formProps.control as Control<{
    prefix: AdminCrudFileInputConfig;
  }>;

  return (
    <SelectFieldController
      label="File Transformer Name"
      control={controlTyped}
      name={`${prefix}.modelRelationRef`}
      options={fileTransformerOptions}
    />
  );
}
