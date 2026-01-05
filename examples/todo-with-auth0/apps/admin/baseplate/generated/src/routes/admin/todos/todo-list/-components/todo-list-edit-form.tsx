import type { ReactElement } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';

import type { FragmentOf } from '@src/graphql';

import { Button } from '@src/components/ui/button';
import { Card, CardContent, CardFooter } from '@src/components/ui/card';
import { ComboboxFieldController } from '@src/components/ui/combobox-field';
import { DateTimePickerFieldController } from '@src/components/ui/date-time-picker-field';
import { FileInputFieldController } from '@src/components/ui/file-input-field';
import { InputFieldController } from '@src/components/ui/input-field';
import { SelectFieldController } from '@src/components/ui/select-field';
import { graphql, readFragment } from '@src/graphql';

import type { TodoListFormData } from '../-schemas/todo-list-schema';

import { todoListEditFormSchema } from '../-schemas/todo-list-schema';

/* HOISTED:foreign-input-fragment-ownerOptions:START */
export const todoListEditFormOwnerOptionsFragment = graphql(`
  fragment TodoListEditForm_ownerOptions on User {
    id
    name
  }
`);
/* HOISTED:foreign-input-fragment-ownerOptions:END */

/* HOISTED:foreign-input-query-ownerOptions:START */
export const todoListEditFormOwnerOptionsQuery = graphql(
  `
    query TodoListEditFormOwnerOptions {
      users {
        ...TodoListEditForm_ownerOptions
      }
    }
  `,
  [todoListEditFormOwnerOptionsFragment],
);
/* HOISTED:foreign-input-query-ownerOptions:END */

/* HOISTED:statusOptions:START */
const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];
/* HOISTED:statusOptions:END */

/* TPL_COMPONENT_NAME=TodoListEditForm */
/* TPL_DEFAULT_VALUES_FRAGMENT_VARIABLE=todoListEditFormDefaultValuesFragment */
/* TPL_FORM_DATA_NAME=TodoListFormData */
/* TPL_LIST_ROUTE=/admin/todos/todo-list */

/* TPL_EDIT_FRAGMENT:START */
export const todoListEditFormDefaultValuesFragment = graphql(`
  fragment TodoListEditForm_defaultValues on TodoList {
    createdAt
    name
    ownerId
    position
    status
    coverPhoto {
      id
    }
  }
`);
/* TPL_EDIT_FRAGMENT:END */

interface Props {
  className?: string;
  submitData: (data: TodoListFormData) => Promise<void>;
  /* TPL_PROPS:START */
  defaultValues:
    | FragmentOf<typeof todoListEditFormDefaultValuesFragment>
    | undefined;
  ownerOptions: FragmentOf<typeof todoListEditFormOwnerOptionsFragment>[];
  /* TPL_PROPS:END */
}

export function TodoListEditForm(
  /* TPL_DESTRUCTURED_PROPS:START */ {
    className,
    submitData,
    defaultValues,
    ownerOptions,
  } /* TPL_DESTRUCTURED_PROPS:END */ : Props,
): ReactElement {
  const initialValuesData = readFragment(
    todoListEditFormDefaultValuesFragment,
    defaultValues,
  );
  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<TodoListFormData>({
    resolver: zodResolver(
      /* TPL_EDIT_SCHEMA:START */ todoListEditFormSchema /* TPL_EDIT_SCHEMA:END */,
    ),
    defaultValues: initialValuesData,
  });

  /* TPL_HEADER:START */
  const ownerOptionsData = readFragment(
    todoListEditFormOwnerOptionsFragment,
    ownerOptions,
  ).map((option) => ({
    label: option.name ?? option.id,
    value: option.id,
  }));
  /* TPL_HEADER:END */

  return (
    <div className={className}>
      <form
        onSubmit={handleSubmit((data) => submitData(data))}
        className="max-w-md space-y-4"
      >
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
              options={ownerOptionsData}
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
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
            <Link to="/admin/todos/todo-list">
              <Button type="button" variant="secondary" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
