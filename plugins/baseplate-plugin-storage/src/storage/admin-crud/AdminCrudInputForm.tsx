import {
  AdminCrudInputWebFormProps,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import { SelectField } from '@halfdomelabs/ui-components';
import { Control } from 'react-hook-form';

import { AdminCrudFileInputConfig } from './types';
import { FileTransformerConfig } from '../transformers/types';

export function AdminCrudFileInputForm({
  formProps,
  name,
  model,
}: AdminCrudInputWebFormProps): JSX.Element {
  const { definitionContainer } = useProjectDefinition();
  const fileTransformerOptions =
    model?.service?.transformers
      ?.filter((t): t is FileTransformerConfig => t.type === 'file')
      .map((transformer) => ({
        label: definitionContainer.nameFromId(transformer.fileRelationRef),
        value: transformer.id,
      })) ?? [];
  const prefix = name as 'prefix';
  const controlTyped = formProps.control as Control<{
    prefix: AdminCrudFileInputConfig;
  }>;

  return (
    <SelectField.Controller
      label="File Transformer Name"
      control={controlTyped}
      name={`${prefix}.modelRelation`}
      options={fileTransformerOptions}
    />
  );
}
