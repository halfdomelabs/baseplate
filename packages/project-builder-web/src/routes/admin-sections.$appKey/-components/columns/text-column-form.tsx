import type {
  AdminCrudTextColumnDefinition,
  ModelConfig,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { SelectFieldController } from '@baseplate-dev/ui-components';

interface Props {
  formProps: UseFormReturn<AdminCrudTextColumnDefinition>;
  model: ModelConfig;
  pluginKey: string | undefined;
}

export function TextColumnForm({ formProps, model }: Props): React.JSX.Element {
  const { control } = formProps;

  const fieldOptions =
    model?.model.fields.map((field) => ({
      label: field.name,
      value: field.id,
    })) ?? [];

  return (
    <SelectFieldController
      label="Field"
      control={control}
      name="modelFieldRef"
      options={fieldOptions}
      placeholder="Select a field"
    />
  );
}
