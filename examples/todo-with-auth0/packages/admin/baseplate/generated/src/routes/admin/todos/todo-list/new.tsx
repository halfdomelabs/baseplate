import type { ReactElement } from 'react';

import { useMutation, useQuery } from '@apollo/client';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { ErrorableLoader } from '@src/components/ui/errorable-loader';
import {
  CreateTodoListDocument,
  GetTodoListsDocument,
  GetTodoListUserOptionsDocument,
} from '@src/generated/graphql';
import { logError } from '@src/services/error-logger';

import type { TodoListFormData } from './-schemas/todo-list-schema';

import { TodoListEditForm } from './-components/todo-list-edit-form';

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/todos/todo-list/new' /* TPL_ROUTE_PATH:END */,
)({
  component:
    /* TPL_COMPONENT_NAME:START */ TodoListCreatePage /* TPL_COMPONENT_NAME:END */,
  loader: () => ({
    crumb: 'New',
  }),
});

function /* TPL_COMPONENT_NAME:START */ TodoListCreatePage /* TPL_COMPONENT_NAME:END */(): ReactElement {
  /* TPL_DATA_LOADER:START */
  const { data: todoListUserOptionsData, error: todoListUserOptionsError } =
    useQuery(GetTodoListUserOptionsDocument);
  /* TPL_DATA_LOADER:END */

  const [
    /* TPL_MUTATION_NAME:START */ createTodoList /* TPL_MUTATION_NAME:END */,
  ] = useMutation(
    /* TPL_CREATE_MUTATION:START */ CreateTodoListDocument /* TPL_CREATE_MUTATION:END */,
    {
      refetchQueries: [
        {
          query:
            /* TPL_REFETCH_DOCUMENT:START */ GetTodoListsDocument /* TPL_REFETCH_DOCUMENT:END */,
        },
      ],
    },
  );

  const navigate = useNavigate();

  const submitData = async (
    formData: /* TPL_FORM_DATA_NAME:START */ TodoListFormData /* TPL_FORM_DATA_NAME:END */,
  ): Promise<void> => {
    await /* TPL_MUTATION_NAME:START */ createTodoList(
      /* TPL_MUTATION_NAME:END */ {
        variables: { input: { data: formData } },
      },
    );
    toast.success('Successfully created item!');
    navigate({ to: '..' }).catch(logError);
  };

  /* TPL_DATA_GATE:START */
  if (!todoListUserOptionsData) {
    return <ErrorableLoader error={todoListUserOptionsError} />;
  }
  /* TPL_DATA_GATE:END */

  return (
    <div className="space-y-4">
      <h1 className="flex space-x-2">
        <span>
          Create New {/* TPL_MODEL_NAME:START */}
          Todo List
          {/* TPL_MODEL_NAME:END */}
        </span>
      </h1>
      {/* TPL_EDIT_FORM:START */}
      <TodoListEditForm
        submitData={submitData}
        todoListUserOptions={todoListUserOptionsData.users}
      />
      {/* TPL_EDIT_FORM:END */}
    </div>
  );
}
