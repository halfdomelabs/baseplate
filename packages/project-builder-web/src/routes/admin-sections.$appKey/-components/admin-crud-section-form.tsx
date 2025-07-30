import type { WebAdminSectionConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control, UseFormReturn } from 'react-hook-form';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  CheckboxFieldController,
  SelectFieldController,
} from '@baseplate-dev/ui-components';
import clsx from 'clsx';
import { useWatch } from 'react-hook-form';

import { EmbeddedListInput } from '#src/components/index.js';

import type { AdminCrudFormConfigInput } from './crud-form-fields-form.js';
import type { AdminCrudTableConfig } from './crud-table-columns-form.js';

import AdminCrudEmbeddedForm, {
  AdminCrudEmbeddedTable,
} from './admin-crud-embedded-form.js';
import CrudFormFieldsForm from './crud-form-fields-form.js';
import CrudTableColumnsForm from './crud-table-columns-form.js';

interface Props {
  className?: string;
  formProps: UseFormReturn<WebAdminSectionConfigInput>;
}

function AdminCrudSectionForm({
  className,
  formProps,
}: Props): React.JSX.Element {
  const { control } = formProps;
  const { definition } = useProjectDefinition();

  const modelOptions = definition.models.map((model) => ({
    label: model.name,
    value: model.id,
  }));

  // TODO: struggles with https://github.com/react-hook-form/react-hook-form/discussions/7354

  const embeddedFormOptions =
    useWatch({
      control,
      name: 'embeddedForms',
    })?.map((form) => ({
      label: form.name,
      value: form.id,
    })) ?? [];

  // TODO: Update embedded form names when form is added/removed

  return (
    <div className={clsx('space-y-4', className)}>
      <SelectFieldController
        label="Model"
        control={control}
        options={modelOptions}
        name="modelRef"
      />
      <CheckboxFieldController
        label="Disable Create?"
        control={control}
        name="disableCreate"
      />
      <h2>Table</h2>
      <CrudTableColumnsForm
        control={control as unknown as Control<AdminCrudTableConfig>}
      />
      <h2>Form</h2>
      <CrudFormFieldsForm
        formProps={
          formProps as unknown as UseFormReturn<AdminCrudFormConfigInput>
        }
        embeddedFormOptions={embeddedFormOptions}
      />
      <h2>Embedded Forms</h2>
      <EmbeddedListInput.LabelledController
        control={control}
        name="embeddedForms"
        renderForm={(formProps) => (
          <AdminCrudEmbeddedForm
            {...formProps}
            embeddedFormOptions={embeddedFormOptions}
          />
        )}
        renderTable={(tableProps) => <AdminCrudEmbeddedTable {...tableProps} />}
        defaultValue={{ type: 'object' }}
      />
    </div>
  );
}

export default AdminCrudSectionForm;
