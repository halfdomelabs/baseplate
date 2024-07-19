import {
  AdminCrudSectionConfig,
  ModelUtils,
} from '@halfdomelabs/project-builder-lib';
import {
  adminCrudInputWebSpec,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import clsx from 'clsx';
import { UseFormReturn, useFieldArray, useWatch } from 'react-hook-form';

import { BUILT_IN_ADMIN_CRUD_INPUT_WEB_CONFIGS } from './inputs';
import { Button, SelectInput, TextInput } from 'src/components';
import CollapsibleRow from 'src/components/CollapsibleRow';

export type AdminCrudFormConfig = Pick<
  AdminCrudSectionConfig,
  'form' | 'modelName'
>;

interface Props {
  className?: string;
  formProps: UseFormReturn<AdminCrudFormConfig>;
  embeddedFormOptions: { label: string; value: string }[];
}

function FieldForm({
  idx,
  formProps,
  embeddedFormOptions,
}: {
  idx: number;
  formProps: UseFormReturn<AdminCrudFormConfig>;
  embeddedFormOptions: { label: string; value: string }[];
}): JSX.Element {
  const control = formProps.control;
  const modelName = useWatch({ control, name: 'modelName' });
  const { definition, pluginContainer } = useProjectDefinition();
  const model = modelName ? ModelUtils.byId(definition, modelName) : undefined;

  const inputWeb = pluginContainer.getPluginSpec(adminCrudInputWebSpec);

  const fieldTypeOptions = inputWeb
    .getInputWebConfigs(BUILT_IN_ADMIN_CRUD_INPUT_WEB_CONFIGS)
    .map((config) => ({
      label: config.label,
      value: config.name,
    }));

  const type = useWatch({
    control,
    name: `form.fields.${idx}.type`,
  });
  const inputWebConfig = inputWeb.getInputWebConfig(
    type,
    BUILT_IN_ADMIN_CRUD_INPUT_WEB_CONFIGS,
  );
  const WebForm = inputWebConfig.Form;

  return (
    <div className="space-y-4">
      <SelectInput.LabelledController
        label="Type"
        control={control}
        options={fieldTypeOptions}
        name={`form.fields.${idx}.type`}
      />
      <TextInput.LabelledController
        label="Label"
        control={control}
        name={`form.fields.${idx}.label`}
      />
      {WebForm && model && (
        <WebForm
          formProps={formProps}
          name={`form.fields.${idx}`}
          model={model}
          embeddedFormOptions={embeddedFormOptions}
          pluginId={inputWebConfig.pluginId}
        />
      )}
    </div>
  );
}

function CrudFormFieldsForm({
  className,
  formProps,
  embeddedFormOptions,
}: Props): JSX.Element {
  const { control } = formProps;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'form.fields',
  });

  return (
    <div className={clsx('space-y-4', className)}>
      {fields.map((field, idx) => (
        <CollapsibleRow
          key={field.id}
          collapsedContents={
            <div>
              {field.label} ({field.type})
            </div>
          }
          onRemove={() => remove(idx)}
          defaultOpen={!field.label}
        >
          <FieldForm
            key={field.id}
            idx={idx}
            formProps={formProps}
            embeddedFormOptions={embeddedFormOptions}
          />
        </CollapsibleRow>
      ))}
      <Button onClick={() => append({ type: 'text', label: '' })}>
        Add Field
      </Button>
    </div>
  );
}

export default CrudFormFieldsForm;
