import type { AdminCrudEmbeddedInputConfig } from '@baseplate-dev/project-builder-lib';
import type { AdminCrudInputWebFormProps } from '@baseplate-dev/project-builder-lib/web';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { ModelUtils } from '@baseplate-dev/project-builder-lib';
import {
  createAdminCrudInputWebConfig,
  useProjectDefinition,
} from '@baseplate-dev/project-builder-lib/web';
import { SelectFieldController } from '@baseplate-dev/ui-components';

function AdminCrudEmbeddedInputForm({
  formProps,
  name,
  model,
  embeddedFormOptions,
}: AdminCrudInputWebFormProps): React.JSX.Element {
  const { definition } = useProjectDefinition();

  const foreignRelationOptions = ModelUtils.getRelationsToModel(
    definition,
    model.id,
  ).map((r) => ({
    label: `${r.relation.foreignRelationName} (${r.model.name})`,
    value: r.relation.foreignId,
  }));
  const prefix = name as 'prefix';
  const controlTyped = formProps.control as Control<{
    prefix: AdminCrudEmbeddedInputConfig;
  }>;

  return (
    <>
      <SelectFieldController
        label="Relation Name"
        control={controlTyped}
        name={`${prefix}.modelRelationRef`}
        options={foreignRelationOptions}
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

export const adminCrudEmbeddedInputWebConfig =
  createAdminCrudInputWebConfig<AdminCrudEmbeddedInputConfig>({
    name: 'embedded',
    pluginKey: undefined,
    label: 'Embedded',
    getNewInput: () => ({
      label: '',
      type: 'embedded',
      modelRelationRef: '',
      embeddedFormRef: '',
    }),
    Form: AdminCrudEmbeddedInputForm,
  });
