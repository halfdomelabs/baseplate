import type {
  AdminCrudColumnInput,
  AdminCrudEmbeddedFormConfigInput,
} from '@baseplate-dev/project-builder-lib';
import type { Lens } from '@hookform/lenses';
import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { createAdminCrudEmbeddedFormSchema } from '@baseplate-dev/project-builder-lib';
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
import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';

import type {
  EmbeddedListFormProps,
  EmbeddedListTableProps,
} from '#src/components/index.js';

import { logAndFormatError } from '#src/services/error-formatter.js';

import type { AdminCrudFormConfigInput } from './crud-form-fields-form.js';

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
  const { definition } = useProjectDefinition();
  const adminCrudEmbeddedFormSchema = useDefinitionSchema(
    createAdminCrudEmbeddedFormSchema,
  );
  const formProps = useForm<AdminCrudEmbeddedFormConfigInput>({
    resolver: zodResolver(adminCrudEmbeddedFormSchema),
    defaultValues: initialData,
  });
  const { handleSubmit, control, watch } = formProps;

  const modelOptions = definition.models.map((model) => ({
    label: model.name,
    value: model.id,
  }));

  const type = watch('type');
  const modelRef = watch('modelRef');
  const lens = useLens({ control });
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
            lens={
              // not sure why but the typings don't work as expected
              lens.focus('table.columns') as unknown as Lens<
                AdminCrudColumnInput[]
              >
            }
            modelRef={modelRef}
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
