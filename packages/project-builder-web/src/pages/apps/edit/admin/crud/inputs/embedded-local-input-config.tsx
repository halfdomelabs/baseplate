import { AdminCrudEmbeddedLocalInputConfig } from '@halfdomelabs/project-builder-lib';
import {
  AdminCrudInputWebFormProps,
  createAdminCrudInputWebConfig,
} from '@halfdomelabs/project-builder-lib/web';
import { SelectField } from '@halfdomelabs/ui-components';
import { Control } from 'react-hook-form';

function AdminCrudEmbeddedLocalInputForm({
  formProps,
  name,
  model,
  embeddedFormOptions,
}: AdminCrudInputWebFormProps): JSX.Element {
  const localRelationOptions =
    model?.model.relations?.map((relation) => ({
      label: `${relation.name} (${relation.modelName})`,
      value: relation.id,
    })) ?? [];
  const prefix = name as 'prefix';
  const controlTyped = formProps.control as Control<{
    prefix: AdminCrudEmbeddedLocalInputConfig;
  }>;

  return (
    <>
      <SelectField.Controller
        label="Relation Name"
        control={controlTyped}
        name={`${prefix}.localRelation`}
        options={localRelationOptions}
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

export const adminCrudEmbeddedLocalInputWebConfig =
  createAdminCrudInputWebConfig<AdminCrudEmbeddedLocalInputConfig>({
    name: 'embeddedLocal',
    pluginId: undefined,
    label: 'Embedded Local',
    getNewInput: () => ({
      label: '',
      type: 'embeddedLocal',
      embeddedFormName: '',
      localRelation: '',
    }),
    Form: AdminCrudEmbeddedLocalInputForm,
  });
