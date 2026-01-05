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
  todoListEditFormDefaultValuesFragment,
  todoListEditFormOwnerOptionsQuery,
} from './-components/todo-list-edit-form';

/* TPL_COMPONENT_NAME=TodoListEditPage */
/* TPL_FORM_DATA_NAME=TodoListFormData */
/* TPL_UPDATE_MUTATION_FIELD_NAME=updateTodoList */
/* TPL_UPDATE_MUTATION_VARIABLE=todoListEditPageUpdateMutation */

/* TPL_EDIT_QUERY:START */
const todoListEditPageQuery = graphql(
  `
    query TodoListEditPage($id: Uuid!) {
      todoList(id: $id) {
        id
        name
        ...TodoListEditForm_defaultValues
      }
    }
  `,
  [todoListEditFormDefaultValuesFragment],
);
/* TPL_EDIT_QUERY:END */

/* TPL_UPDATE_MUTATION:START */
const todoListEditPageUpdateMutation = graphql(
  `
    mutation TodoListEditPageUpdate($input: UpdateTodoListInput!) {
      updateTodoList(input: $input) {
        todoList {
          id
          name
          ...TodoListEditForm_defaultValues
        }
      }
    }
  `,
  [todoListEditFormDefaultValuesFragment],
);
/* TPL_UPDATE_MUTATION:END */

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/todos/todo-list/$id' /* TPL_ROUTE_PATH:END */,
)({
  component: TodoListEditPage,
  /* TPL_ROUTE_PROPS:START */ loader: ({
    context: { preloadQuery, apolloClient },
    params: { id },
  }) => ({
    crumb: apolloClient
      .query({
        query: todoListEditPageQuery,
        variables: { id },
      })
      .then(({ data }) =>
        data?.todoList.name ? data.todoList.name : 'Edit Todo List',
      )
      .catch(() => 'Edit Todo List'),
    ownerOptionsRef: preloadQuery(todoListEditFormOwnerOptionsQuery),
    queryRef: preloadQuery(todoListEditPageQuery, { variables: { id } }),
  }) /* TPL_ROUTE_PROPS:END */,
});

function TodoListEditPage(): ReactElement {
  const { id } = Route.useParams();

  /* TPL_DATA_LOADER:START */
  const { queryRef, ownerOptionsRef, crumb } = Route.useLoaderData();

  const { data } = useReadQuery(queryRef);

  const ownerOptions = useReadQuery(ownerOptionsRef).data.users;
  /* TPL_DATA_LOADER:END */

  const [updateTodoList] = useMutation(todoListEditPageUpdateMutation);
  const navigate = useNavigate();

  const submitData = async (formData: TodoListFormData): Promise<void> => {
    try {
      await updateTodoList({
        variables: { input: { id, data: formData } },
      });
      toast.success(
        /* TPL_MUTATION_SUCCESS_MESSAGE:START */ 'Successfully updated todo list!' /* TPL_MUTATION_SUCCESS_MESSAGE:END */,
      );
      navigate({ to: '..' }).catch(logError);
    } catch (err: unknown) {
      toast.error(
        logAndFormatError(
          err,
          /* TPL_MUTATION_ERROR_MESSAGE:START */ 'Sorry, we could not update todo list.' /* TPL_MUTATION_ERROR_MESSAGE:END */,
        ),
      );
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="flex space-x-2">{crumb}</h1>
      {/* TPL_EDIT_FORM:START */}
      <TodoListEditForm
        submitData={submitData}
        defaultValues={data.todoList}
        ownerOptions={ownerOptions}
      />
      {/* TPL_EDIT_FORM:END */}
    </div>
  );
}
