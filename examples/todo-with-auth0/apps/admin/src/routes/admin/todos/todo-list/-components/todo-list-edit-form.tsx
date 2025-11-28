import type { ReactElement } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { TodoListUserOptionFragment } from '@src/generated/graphql';

import { Button } from '@src/components/ui/button';
import { Card, CardContent, CardFooter } from '@src/components/ui/card';
import { ComboboxFieldController } from '@src/components/ui/combobox-field';
import { DateTimePickerFieldController } from '@src/components/ui/date-time-picker-field';
import { FileInputFieldController } from '@src/components/ui/file-input-field';
import { InputFieldController } from '@src/components/ui/input-field';
import { SelectFieldController } from '@src/components/ui/select-field';
import { logAndFormatError } from '@src/services/error-formatter';

import type { TodoListFormData } from '../-schemas/todo-list-schema';

import { todoListEditFormSchema } from '../-schemas/todo-list-schema';

/* HOISTED:statusOptions:START */
const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];
/* HOISTED:statusOptions:END */

/* TPL_FORM_DATA_NAME=TodoListFormData */
/* TPL_LIST_ROUTE=/admin/todos/todo-list */

interface Props {
  className?: string;
  initialData?: TodoListFormData;
  submitData: (data: TodoListFormData) => Promise<void>;
  /* TPL_EXTRA_PROPS:START */
  todoListUserOptions: TodoListUserOptionFragment[];
  /* TPL_EXTRA_PROPS:END */
}

export function /* TPL_COMPONENT_NAME:START */ TodoListEditForm /* TPL_COMPONENT_NAME:END */(
  /* TPL_DESTRUCTURED_PROPS:START */ {
    className,
    initialData,
    submitData,
    todoListUserOptions,
  } /* TPL_DESTRUCTURED_PROPS:END */ : Props,
): ReactElement {
  const { handleSubmit, control } = useForm({
    resolver: zodResolver(
      /* TPL_EDIT_SCHEMA:START */ todoListEditFormSchema /* TPL_EDIT_SCHEMA:END */,
    ),
    defaultValues: initialData,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const onSubmit = async (data: TodoListFormData): Promise<void> => {
    try {
      setIsUpdating(true);
      await submitData(data);
    } catch (err) {
      toast.error(logAndFormatError(err));
    } finally {
      setIsUpdating(false);
    }
  };

  /* TPL_HEADER:START */

  const ownerOptions = todoListUserOptions.map((option) => ({
    label: option.name ?? option.id,
    value: option.id,
  }));
  /* TPL_HEADER:END */

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
        <Card>
          <CardContent className="flex flex-col gap-4">
            {/* TPL_INPUTS:START */}
            <InputFieldController
              label="Full Name"
              control={control}
              name="name"
            />
            <ComboboxFieldController
              label="Owner"
              control={control}
              name="ownerId"
              options={ownerOptions}
            />
            <SelectFieldController
              label="Status"
              control={control}
              name="status"
              options={statusOptions}
            />
            <FileInputFieldController
              label="Cover Photo"
              category="TODO_LIST_COVER_PHOTO"
              control={control}
              name="coverPhoto"
            />
            <DateTimePickerFieldController
              label="Created At"
              control={control}
              name="createdAt"
            />
            <InputFieldController
              label="Position"
              control={control}
              name="position"
              registerOptions={{ valueAsNumber: true }}
            />
            {/* TPL_INPUTS:END */}
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button type="submit" disabled={isUpdating}>
              Save
            </Button>
            <Link to="/admin/todos/todo-list">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
