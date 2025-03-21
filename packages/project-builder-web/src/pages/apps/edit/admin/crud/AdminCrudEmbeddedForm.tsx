import type { AdminCrudEmbeddedFormConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type {
  EmbeddedListFormProps,
  EmbeddedListTableProps,
} from 'src/components/EmbeddedListInput';

import {
  adminCrudEmbeddedFormSchema,
  zPluginWrapper,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  CheckboxField,
  InputField,
  SelectField,
  toast,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { type Control, useForm, type UseFormReturn } from 'react-hook-form';
import { LinkButton, Table } from 'src/components';
import { logAndFormatError } from 'src/services/error-formatter';

import type { AdminCrudFormConfig } from './CrudFormFieldsForm';
import type { AdminCrudTableConfig } from './CrudTableColumnsForm';

import CrudFormFieldsForm from './CrudFormFieldsForm';
import CrudTableColumnsForm from './CrudTableColumnsForm';

export function AdminCrudEmbeddedTable({
  items,
  edit,
  remove,
}: EmbeddedListTableProps<AdminCrudEmbeddedFormConfig>): React.JSX.Element {
  const { definitionContainer } = useProjectDefinition();
  return (
    <Table className="max-w-6xl">
      <Table.Head>
        <Table.HeadRow>
          <Table.HeadCell>Form Name</Table.HeadCell>
          <Table.HeadCell>Model Name</Table.HeadCell>
          <Table.HeadCell>Type</Table.HeadCell>
          <Table.HeadCell>Actions</Table.HeadCell>
        </Table.HeadRow>
      </Table.Head>
      <Table.Body>
        {items.map((item, idx) => (
          <Table.Row key={item.id}>
            <Table.Cell>{item.name}</Table.Cell>
            <Table.Cell>
              {definitionContainer.nameFromId(item.modelRef)}
            </Table.Cell>
            <Table.Cell>{item.type}</Table.Cell>
            <Table.Cell className="space-x-4">
              <LinkButton
                onClick={() => {
                  edit(idx);
                }}
              >
                Edit
              </LinkButton>
              <LinkButton
                negative
                onClick={() => {
                  remove(idx);
                }}
              >
                Remove
              </LinkButton>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

const TYPE_OPTIONS = [
  { label: 'Object', value: 'object' },
  { label: 'List', value: 'list' },
];

interface Props extends EmbeddedListFormProps<AdminCrudEmbeddedFormConfig> {
  embeddedFormOptions: { label: string; value: string }[];
}

function AdminCrudEmbeddedForm({
  initialData,
  onSubmit,
  embeddedFormOptions,
}: Props): React.JSX.Element {
  const { definition, pluginContainer } = useProjectDefinition();
  const schemaWithPlugins = zPluginWrapper(
    adminCrudEmbeddedFormSchema,
    pluginContainer,
  );
  const formProps = useForm<AdminCrudEmbeddedFormConfig>({
    resolver: zodResolver(schemaWithPlugins),
    defaultValues: initialData,
  });
  const { handleSubmit, control, watch } = formProps;

  const modelOptions = definition.models.map((model) => ({
    label: model.name,
    value: model.id,
  }));

  const type = watch('type');

  const formId = useId();

  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        handleSubmit(onSubmit)(e).catch((error: unknown) => {
          toast.error(logAndFormatError(error));
        });
      }}
      id={formId}
      className="space-y-4"
    >
      <InputField.Controller label="Name" control={control} name="name" />
      <SelectField.Controller
        label="Type"
        control={control}
        name="type"
        options={TYPE_OPTIONS}
      />
      <CheckboxField.Controller
        label="Include ID Field? (useful for list types)"
        control={control}
        name="includeIdField"
      />
      <SelectField.Controller
        label="Model"
        control={control}
        options={modelOptions}
        name="modelRef"
      />
      {type === 'list' && (
        <>
          <h2>Table</h2>
          <CrudTableColumnsForm
            control={control as unknown as Control<AdminCrudTableConfig>}
          />
        </>
      )}
      <h2>Form</h2>
      <CrudFormFieldsForm
        formProps={formProps as unknown as UseFormReturn<AdminCrudFormConfig>}
        embeddedFormOptions={embeddedFormOptions}
      />
      <Button type="submit" form={formId}>
        Save
      </Button>
    </form>
  );
}

export default AdminCrudEmbeddedForm;
