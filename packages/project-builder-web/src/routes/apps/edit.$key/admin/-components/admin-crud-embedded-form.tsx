import type { AdminCrudEmbeddedFormConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control, UseFormReturn } from 'react-hook-form';

import {
  createAdminCrudEmbeddedFormSchema,
  zPluginWrapper,
} from '@baseplate-dev/project-builder-lib';
import {
  useDefinitionSchema,
  useProjectDefinition,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  CheckboxFieldController,
  InputFieldController,
  SelectFieldController,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';

import type {
  EmbeddedListFormProps,
  EmbeddedListTableProps,
} from '#src/components/index.js';

import { logAndFormatError } from '#src/services/error-formatter.js';

import type { AdminCrudFormConfigInput } from './crud-form-fields-form.js';
import type { AdminCrudTableConfig } from './crud-table-columns-form.js';

import CrudFormFieldsForm from './crud-form-fields-form.js';
import CrudTableColumnsForm from './crud-table-columns-form.js';

export function AdminCrudEmbeddedTable({
  items,
  edit,
  remove,
}: EmbeddedListTableProps<AdminCrudEmbeddedFormConfigInput>): React.JSX.Element {
  const { definitionContainer } = useProjectDefinition();
  return (
    <Table className="max-w-6xl">
      <TableHeader>
        <TableRow>
          <TableHead>Form Name</TableHead>
          <TableHead>Model Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, idx) => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              {definitionContainer.nameFromId(item.modelRef)}
            </TableCell>
            <TableCell>{item.type}</TableCell>
            <TableCell className="space-x-4">
              <Button
                variant="link"
                size="none"
                onClick={() => {
                  edit(idx);
                }}
              >
                Edit
              </Button>
              <Button
                variant="linkDestructive"
                size="none"
                onClick={() => {
                  remove(idx);
                }}
              >
                Remove
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const TYPE_OPTIONS = [
  { label: 'Object', value: 'object' },
  { label: 'List', value: 'list' },
];

interface Props
  extends EmbeddedListFormProps<AdminCrudEmbeddedFormConfigInput> {
  embeddedFormOptions: { label: string; value: string }[];
}

function AdminCrudEmbeddedForm({
  initialData,
  onSubmit,
  embeddedFormOptions,
}: Props): React.JSX.Element {
  const { definition, pluginContainer } = useProjectDefinition();
  const adminCrudEmbeddedFormSchema = useDefinitionSchema(
    createAdminCrudEmbeddedFormSchema,
  );
  const schemaWithPlugins = zPluginWrapper(
    adminCrudEmbeddedFormSchema,
    pluginContainer,
  );
  const formProps = useForm<AdminCrudEmbeddedFormConfigInput>({
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
      <InputFieldController label="Name" control={control} name="name" />
      <SelectFieldController
        label="Type"
        control={control}
        name="type"
        options={TYPE_OPTIONS}
      />
      <CheckboxFieldController
        label="Include ID Field? (useful for list types)"
        control={control}
        name="includeIdField"
      />
      <SelectFieldController
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
        formProps={
          formProps as unknown as UseFormReturn<AdminCrudFormConfigInput>
        }
        embeddedFormOptions={embeddedFormOptions}
      />
      <Button type="submit" form={formId}>
        Save
      </Button>
    </form>
  );
}

export default AdminCrudEmbeddedForm;
