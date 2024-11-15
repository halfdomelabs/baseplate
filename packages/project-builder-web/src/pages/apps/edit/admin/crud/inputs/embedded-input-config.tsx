import type { AdminCrudEmbeddedInputConfig } from '@halfdomelabs/project-builder-lib';
import type { AdminCrudInputWebFormProps } from '@halfdomelabs/project-builder-lib/web';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { ModelUtils } from '@halfdomelabs/project-builder-lib';
import {
  createAdminCrudInputWebConfig,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import { SelectField } from '@halfdomelabs/ui-components';

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
      <SelectField.Controller
        label="Relation Name"
        control={controlTyped}
        name={`${prefix}.modelRelation`}
        options={foreignRelationOptions}
      />
      <SelectField.Controller
        label="Embedded Form"
        control={controlTyped}
        name={`${prefix}.embeddedFormName`}
        options={embeddedFormOptions}
      />
    </>
  );
}

export const adminCrudEmbeddedInputWebConfig =
  createAdminCrudInputWebConfig<AdminCrudEmbeddedInputConfig>({
    name: 'embedded',
    pluginId: undefined,
    label: 'Embedded',
    getNewInput: () => ({
      label: '',
      type: 'embedded',
      modelRelation: '',
      embeddedFormName: '',
    }),
    Form: AdminCrudEmbeddedInputForm,
  });
