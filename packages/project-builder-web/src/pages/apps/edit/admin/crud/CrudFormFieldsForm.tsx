import type { AdminCrudSectionConfigInput } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { ModelUtils } from '@halfdomelabs/project-builder-lib';
import {
  adminCrudInputWebSpec,
  useProjectDefinition,
} from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  InputFieldController,
  SelectFieldController,
} from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useFieldArray, useWatch } from 'react-hook-form';

import { CollapsibleRow } from '#src/components/index.js';

import { BUILT_IN_ADMIN_CRUD_INPUT_WEB_CONFIGS } from './inputs/index.js';

export type AdminCrudFormConfigInput = Pick<
  AdminCrudSectionConfigInput,
  'form' | 'modelRef'
>;

interface Props {
  className?: string;
  formProps: UseFormReturn<AdminCrudFormConfigInput>;
  embeddedFormOptions: { label: string; value: string }[];
}

function FieldForm({
  idx,
  formProps,
  embeddedFormOptions,
}: {
  idx: number;
  formProps: UseFormReturn<AdminCrudFormConfigInput>;
  embeddedFormOptions: { label: string; value: string }[];
}): React.JSX.Element {
  const { control } = formProps;
  const modelRef = useWatch({ control, name: 'modelRef' });
  const { definition, pluginContainer } = useProjectDefinition();
  const model = modelRef
    ? ModelUtils.byIdOrThrow(definition, modelRef)
    : undefined;

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
      <SelectFieldController
        label="Type"
        control={control}
        options={fieldTypeOptions}
        name={`form.fields.${idx}.type`}
      />
      <InputFieldController
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
}: Props): React.JSX.Element {
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
          onRemove={() => {
            remove(idx);
          }}
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
      <Button
        onClick={() => {
          append({ type: 'text', label: '' });
        }}
      >
        Add Field
      </Button>
    </div>
  );
}

export default CrudFormFieldsForm;
