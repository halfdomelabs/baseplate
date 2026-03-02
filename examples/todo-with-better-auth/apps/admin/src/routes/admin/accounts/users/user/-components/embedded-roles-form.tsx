import type { ReactElement } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type {
  EmbeddedListFormProps,
  EmbeddedListTableProps,
} from '@src/components/admin/embedded-list-input';

import { Button } from '@src/components/ui/button';
import { InputFieldController } from '@src/components/ui/input-field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/components/ui/table';
import { logAndFormatError } from '@src/services/error-formatter';

import type { EmbeddedRolesFormData } from '../-schemas/user-schema';

import { embeddedRolesFormSchema } from '../-schemas/user-schema';

/* TPL_TABLE_COMPONENT:START */

export function EmbeddedRolesTable({
  items,
  edit,
  remove,
}: EmbeddedListTableProps<EmbeddedRolesFormData>): ReactElement {
  return (
    <Table className="max-w-6xl">
      <TableHeader>
        <TableRow>
          <TableHead>Role</TableHead>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, idx) => (
          <TableRow key={item.id}>
            <TableCell>{item.role}</TableCell>
            <TableCell className="space-x-4">
              <Button
                variant="link"
                onClick={() => {
                  edit(idx);
                }}
              >
                Edit
              </Button>
              <Button
                variant="linkDestructive"
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

/* TPL_TABLE_COMPONENT:END */

export function /* TPL_COMPONENT_NAME:START */ EmbeddedRolesForm /* TPL_COMPONENT_NAME:END */(
  /* TPL_DESTRUCTURED_PROPS:START */ {
    initialData,
    onSubmit,
  } /* TPL_DESTRUCTURED_PROPS:END */ : /* TPL_PROPS:START */ EmbeddedListFormProps<EmbeddedRolesFormData> /* TPL_PROPS:END */,
): ReactElement {
  const { handleSubmit, control } =
    useForm</* TPL_EMBEDDED_FORM_DATA_TYPE:START */ EmbeddedRolesFormData /* TPL_EMBEDDED_FORM_DATA_TYPE:END */>(
      {
        resolver: zodResolver(
          /* TPL_EMBEDDED_FORM_DATA_SCHEMA:START */ embeddedRolesFormSchema /* TPL_EMBEDDED_FORM_DATA_SCHEMA:END */,
        ),
        defaultValues: initialData,
      },
    );

  /* TPL_HEADER:BLOCK */

  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        handleSubmit(onSubmit)(e).catch((err: unknown) => {
          toast.error(logAndFormatError(err));
        });
      }}
      className="space-y-4"
    >
      {/* TPL_INPUTS:START */}
      <InputFieldController label="Role" control={control} name="role" />
      {/* TPL_INPUTS:END */}
      <Button type="submit">Update</Button>
    </form>
  );
}
