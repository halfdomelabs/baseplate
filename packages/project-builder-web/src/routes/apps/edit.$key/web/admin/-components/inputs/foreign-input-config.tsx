import type { AdminCrudForeignInputConfig } from '@baseplate-dev/project-builder-lib';
import type { AdminCrudInputWebFormProps } from '@baseplate-dev/project-builder-lib/web';
import type React from 'react';
import type { Control } from 'react-hook-form';

import {
  createAdminCrudInputWebConfig,
  useProjectDefinition,
} from '@baseplate-dev/project-builder-lib/web';
import {
  InputFieldController,
  SelectFieldController,
} from '@baseplate-dev/ui-components';

function AdminCrudForeignInputForm({
  formProps,
  name,
  model,
}: AdminCrudInputWebFormProps): React.JSX.Element {
  const { definitionContainer } = useProjectDefinition();
  const localRelationOptions =
    model.model.relations?.map((relation) => ({
      label: `${relation.name} (${definitionContainer.nameFromId(relation.modelRef)})`,
      value: relation.id,
    })) ?? [];
  const prefix = name as 'prefix';
  const controlTyped = formProps.control as Control<{
    prefix: AdminCrudForeignInputConfig;
  }>;

  return (
    <>
      <SelectFieldController
        label="Local Relation Name"
        control={controlTyped}
        name={`${prefix}.localRelationRef`}
        options={localRelationOptions}
      />
      <InputFieldController
        label="Label Expression (e.g. name)"
        control={controlTyped}
        name={`${prefix}.labelExpression`}
      />
      <InputFieldController
        label="Value Expression (e.g. id)"
        control={controlTyped}
        name={`${prefix}.valueExpression`}
      />
      <InputFieldController
        label="Default Label (optional)"
        control={controlTyped}
        name={`${prefix}.defaultLabel`}
      />
      <InputFieldController
        label="Empty Label (optional) - only if field is nullable"
        control={controlTyped}
        name={`${prefix}.nullLabel`}
      />
    </>
  );
}

export const adminCrudForeignInputWebConfig =
  createAdminCrudInputWebConfig<AdminCrudForeignInputConfig>({
    name: 'foreign',
    pluginId: undefined,
    label: 'Foreign',
    getNewInput: () => ({
      label: '',
      type: 'foreign',
      localRelationRef: '',
      labelExpression: '',
      valueExpression: '',
      defaultLabel: '',
      nullLabel: '',
    }),
    Form: AdminCrudForeignInputForm,
  });
