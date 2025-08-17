import type { AdminCrudTextColumnInput } from '@baseplate-dev/project-builder-lib';
import type { AdminCrudColumnWebFormProps } from '@baseplate-dev/project-builder-lib/web';
import type React from 'react';

import { adminCrudColumnEntityType } from '@baseplate-dev/project-builder-lib';
import { createAdminCrudColumnWebConfig } from '@baseplate-dev/project-builder-lib/web';
import { SelectFieldController } from '@baseplate-dev/ui-components';

function TextColumnForm({
  formProps,
  model,
}: AdminCrudColumnWebFormProps<AdminCrudTextColumnInput>): React.JSX.Element {
  const { control } = formProps;

  const fieldOptions = model.model.fields.map((field) => ({
    label: field.name,
    value: field.id,
  }));

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

export const adminCrudTextColumnWebConfig =
  createAdminCrudColumnWebConfig<AdminCrudTextColumnInput>({
    name: 'text',
    pluginKey: undefined,
    label: 'Text Column',
    Form: TextColumnForm,
    isAvailableForModel: () => true,
    getNewColumn: () => ({
      id: adminCrudColumnEntityType.generateNewId(),
      type: 'text' as const,
      label: '',
      modelFieldRef: '',
    }),
  });
