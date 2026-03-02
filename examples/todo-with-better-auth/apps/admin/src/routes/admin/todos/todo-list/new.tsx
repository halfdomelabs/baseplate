import type { ReactElement } from 'react';

import { useMutation, useReadQuery } from '@apollo/client/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { graphql } from '@src/graphql';
import { logAndFormatError } from '@src/services/error-formatter';
import { logError } from '@src/services/error-logger';

import type { TodoListFormData } from './-schemas/todo-list-schema';

import {
  TodoListEditForm,
  todoListEditFormOwnerOptionsQuery,
} from './-components/todo-list-edit-form';

/* TPL_COMPONENT_NAME=TodoListCreatePage */
/* TPL_CREATE_MUTATION_FIELD_NAME=createTodoList */

/* TPL_CREATE_MUTATION:START */
const todoListCreatePageCreateMutation = graphql(`
  mutation TodoListCreatePageCreate($input: CreateTodoListInput!) {
    createTodoList(input: $input) {
      todoList {
        id
      }
    }
  }
`);
/* TPL_CREATE_MUTATION:END */

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/todos/todo-list/new' /* TPL_ROUTE_PATH:END */,
)({
  component: TodoListCreatePage,
  /* TPL_ROUTE_PROPS:START */ loader: ({ context: { preloadQuery } }) => ({
    crumb: 'New',
    ownerOptionsRef: preloadQuery(todoListEditFormOwnerOptionsQuery),
  }) /* TPL_ROUTE_PROPS:END */,
});

function TodoListCreatePage(): ReactElement {
  /* TPL_DATA_LOADER:START */
  const { ownerOptionsRef } = Route.useLoaderData();

  const ownerOptions = useReadQuery(ownerOptionsRef).data.users;
  /* TPL_DATA_LOADER:END */

  /* TPL_MUTATION_HOOK:START */
  const [createTodoList] = useMutation(todoListCreatePageCreateMutation, {
    update: (cache) => {
      cache.evict({ fieldName: 'todoLists' });
      cache.gc();
    },
  });
  /* TPL_MUTATION_HOOK:END */
  const navigate = useNavigate();

  const submitData = async (
    formData: /* TPL_FORM_DATA_NAME:START */ TodoListFormData /* TPL_FORM_DATA_NAME:END */,
  ): Promise<void> => {
    try {
      await createTodoList({
        variables: { input: { data: formData } },
      });
      toast.success(
        /* TPL_MUTATION_SUCCESS_MESSAGE:START */ 'Successfully created todo list!' /* TPL_MUTATION_SUCCESS_MESSAGE:END */,
      );
      navigate({ to: '..' }).catch(logError);
    } catch (err: unknown) {
      toast.error(
        logAndFormatError(
          err,
          /* TPL_MUTATION_ERROR_MESSAGE:START */ 'Sorry, we could not create todo list.' /* TPL_MUTATION_ERROR_MESSAGE:END */,
        ),
      );
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="flex space-x-2">
        <span>
          New {/* TPL_MODEL_NAME:START */}
          Todo List
          {/* TPL_MODEL_NAME:END */}
        </span>
      </h1>
      {/* TPL_EDIT_FORM:START */}
      <TodoListEditForm
        submitData={submitData}
        defaultValues={undefined}
        ownerOptions={ownerOptions}
      />
      {/* TPL_EDIT_FORM:END */}
    </div>
  );
}
