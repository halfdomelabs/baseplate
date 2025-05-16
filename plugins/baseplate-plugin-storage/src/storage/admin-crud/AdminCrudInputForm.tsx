import type { AdminCrudInputWebFormProps } from '@halfdomelabs/project-builder-lib/web';
import type { Control } from 'react-hook-form';

import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { SelectFieldController } from '@halfdomelabs/ui-components';

import type { FileTransformerConfig } from '../transformers/types';
import type { AdminCrudFileInputConfig } from './types';

export function AdminCrudFileInputForm({
  formProps,
  name,
  model,
}: AdminCrudInputWebFormProps): React.JSX.Element {
  const { definitionContainer } = useProjectDefinition();
  const fileTransformerOptions = model.service.transformers
    .filter((t): t is FileTransformerConfig => t.type === 'file')
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
