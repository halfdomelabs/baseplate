import type { WebAdminSectionConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control, UseFormReturn } from 'react-hook-form';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  CheckboxFieldController,
  ComboboxFieldController,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
} from '@baseplate-dev/ui-components';
import { useWatch } from 'react-hook-form';

import { EmbeddedListInput } from '#src/components/index.js';

import type { AdminCrudFormConfigInput } from './crud-form-fields-form.js';
import type { AdminCrudActionsConfig } from './crud-table-actions-form.js';
import type { AdminCrudTableConfig } from './crud-table-columns-form.js';

import AdminCrudEmbeddedForm, {
  AdminCrudEmbeddedTable,
} from './admin-crud-embedded-form.js';
import CrudFormFieldsForm from './crud-form-fields-form.js';
import CrudTableActionsForm from './crud-table-actions-form.js';
import CrudTableColumnsForm from './crud-table-columns-form.js';

interface Props {
  formProps: UseFormReturn<WebAdminSectionConfigInput>;
}

function AdminCrudSectionForm({ formProps }: Props): React.JSX.Element {
  const { control } = formProps;
  const { definition } = useProjectDefinition();

  const modelOptions = definition.models.map((model) => ({
    label: model.name,
    value: model.id,
  }));

  const modelId = useWatch({
    control,
    name: 'modelRef',
  });

  const nameFieldOptions =
    definition.models
      .find((m) => m.id === modelId)
      ?.model.fields.map((field) => ({
        label: field.name,
        value: field.id,
      })) ?? [];

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
    <>
      <SectionListSection>
        <SectionListSectionHeader>
          <SectionListSectionTitle>Model Configuration</SectionListSectionTitle>
          <SectionListSectionDescription>
            Configure the data model and basic settings for this CRUD section.
          </SectionListSectionDescription>
        </SectionListSectionHeader>
        <SectionListSectionContent className="space-y-6">
          <ComboboxFieldController
            label="Model"
            control={control}
            options={modelOptions}
            name="modelRef"
          />
          <ComboboxFieldController
            label="Name Field"
            control={control}
            options={nameFieldOptions}
            description="The field to use as the name of the record (used in breadcrumbs/title of edit page)"
            name="nameFieldRef"
          />
          <CheckboxFieldController
            label="Disable Create?"
            control={control}
            name="disableCreate"
          />
        </SectionListSectionContent>
      </SectionListSection>

      <SectionListSection>
        <SectionListSectionHeader>
          <SectionListSectionTitle>Table Configuration</SectionListSectionTitle>
          <SectionListSectionDescription>
            Configure which columns to display in the data table.
          </SectionListSectionDescription>
        </SectionListSectionHeader>
        <SectionListSectionContent>
          <CrudTableColumnsForm
            control={control as unknown as Control<AdminCrudTableConfig>}
          />
        </SectionListSectionContent>
      </SectionListSection>

      <SectionListSection>
        <SectionListSectionHeader>
          <SectionListSectionTitle>Table Actions</SectionListSectionTitle>
          <SectionListSectionDescription>
            Configure actions available for each row in the table. Drag to
            reorder.
          </SectionListSectionDescription>
        </SectionListSectionHeader>
        <SectionListSectionContent>
          <CrudTableActionsForm
            control={control as unknown as Control<AdminCrudActionsConfig>}
            modelRef={modelId}
          />
        </SectionListSectionContent>
      </SectionListSection>

      <SectionListSection>
        <SectionListSectionHeader>
          <SectionListSectionTitle>Form Configuration</SectionListSectionTitle>
          <SectionListSectionDescription>
            Configure the form fields for creating and editing records.
          </SectionListSectionDescription>
        </SectionListSectionHeader>
        <SectionListSectionContent>
          <CrudFormFieldsForm
            formProps={
              formProps as unknown as UseFormReturn<AdminCrudFormConfigInput>
            }
            embeddedFormOptions={embeddedFormOptions}
          />
        </SectionListSectionContent>
      </SectionListSection>

      <SectionListSection>
        <SectionListSectionHeader>
          <SectionListSectionTitle>Embedded Forms</SectionListSectionTitle>
          <SectionListSectionDescription>
            Configure embedded forms for related data objects.
          </SectionListSectionDescription>
        </SectionListSectionHeader>
        <SectionListSectionContent>
          <EmbeddedListInput.LabelledController
            control={control}
            name="embeddedForms"
            renderForm={(formProps) => (
              <AdminCrudEmbeddedForm
                {...formProps}
                embeddedFormOptions={embeddedFormOptions}
              />
            )}
            renderTable={(tableProps) => (
              <AdminCrudEmbeddedTable {...tableProps} />
            )}
            defaultValue={{ type: 'object' }}
          />
        </SectionListSectionContent>
      </SectionListSection>
    </>
  );
}

export default AdminCrudSectionForm;
