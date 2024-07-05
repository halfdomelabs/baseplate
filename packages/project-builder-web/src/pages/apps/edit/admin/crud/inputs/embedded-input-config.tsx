import {
  AdminCrudEmbeddedInputConfig,
  ModelUtils,
} from '@halfdomelabs/project-builder-lib';
import {
  AdminCrudInputWebFormProps,
  createAdminCrudInputWebConfig,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import { SelectField } from '@halfdomelabs/ui-components';
import { Control } from 'react-hook-form';

function AdminCrudEmbeddedInputForm({
  formProps,
  name,
  model,
  embeddedFormOptions,
}: AdminCrudInputWebFormProps): JSX.Element {
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
