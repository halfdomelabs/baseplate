import type { AdminCrudEmbeddedFormConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control, UseFormReturn } from 'react-hook-form';
import type {
  EmbeddedListFormProps,
  EmbeddedListTableProps,
} from 'src/components/EmbeddedListInput';

import { adminCrudEmbeddedFormSchema } from '@halfdomelabs/project-builder-lib';
import {
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  LinkButton,
  SelectInput,
  Table,
  TextInput,
} from 'src/components';
import CheckedInput from 'src/components/CheckedInput';
import { useStatus } from 'src/hooks/useStatus';
import { formatError } from 'src/services/error-formatter';

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
  const { definition } = useProjectDefinition();
  const formProps = useResettableForm<AdminCrudEmbeddedFormConfig>({
    resolver: zodResolver(adminCrudEmbeddedFormSchema),
    defaultValues: initialData,
  });
  const { handleSubmit, control, watch } = formProps;
  const { status, setError } = useStatus();

  const modelOptions = definition.models.map((model) => ({
    label: model.name,
    value: model.id,
  }));

  const type = watch('type');

  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        handleSubmit(onSubmit)(e).catch((error: unknown) => {
          setError(formatError(error));
        });
      }}
      className="space-y-4"
    >
      <Alert.WithStatus status={status} />
      <TextInput.LabelledController
        label="Name"
        control={control}
        name="name"
      />
      <SelectInput.LabelledController
        label="Type"
        control={control}
        name="type"
        options={TYPE_OPTIONS}
      />
      <CheckedInput.LabelledController
        label="Include ID Field? (useful for list types)"
        control={control}
        name="includeIdField"
      />
      <SelectInput.LabelledController
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
      <Button type="submit">Save</Button>
    </form>
  );
}

export default AdminCrudEmbeddedForm;
