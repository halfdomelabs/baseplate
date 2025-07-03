import type { AdminCrudEmbeddedLocalInputConfig } from '@baseplate-dev/project-builder-lib';
import type { AdminCrudInputWebFormProps } from '@baseplate-dev/project-builder-lib/web';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { createAdminCrudInputWebConfig } from '@baseplate-dev/project-builder-lib/web';
import { SelectFieldController } from '@baseplate-dev/ui-components';

function AdminCrudEmbeddedLocalInputForm({
  formProps,
  name,
  model,
  embeddedFormOptions,
}: AdminCrudInputWebFormProps): React.JSX.Element {
  const localRelationOptions =
    model.model.relations?.map((relation) => ({
      label: `${relation.name} (${relation.modelRef})`,
      value: relation.id,
    })) ?? [];
  const prefix = name as 'prefix';
  const controlTyped = formProps.control as Control<{
    prefix: AdminCrudEmbeddedLocalInputConfig;
  }>;

  return (
    <>
      <SelectFieldController
        label="Relation Name"
        control={controlTyped}
        name={`${prefix}.localRelationRef`}
        options={localRelationOptions}
      />
      <SelectFieldController
        label="Embedded Form"
        control={controlTyped}
        name={`${prefix}.embeddedFormRef`}
        options={embeddedFormOptions}
      />
    </>
  );
}

export const adminCrudEmbeddedLocalInputWebConfig =
  createAdminCrudInputWebConfig<AdminCrudEmbeddedLocalInputConfig>({
    name: 'embeddedLocal',
    pluginId: undefined,
    label: 'Embedded Local',
    getNewInput: () => ({
      label: '',
      type: 'embeddedLocal',
      embeddedFormRef: '',
      localRelationRef: '',
    }),
    Form: AdminCrudEmbeddedLocalInputForm,
  });
