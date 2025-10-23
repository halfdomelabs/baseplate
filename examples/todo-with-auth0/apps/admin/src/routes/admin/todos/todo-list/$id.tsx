import type { ReactElement } from 'react';

import { useMutation, useQuery } from '@apollo/client';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { ErrorableLoader } from '@src/components/ui/errorable-loader';
import {
  GetTodoListUserOptionsDocument,
  TodoListEditByIdDocument,
  UpdateTodoListDocument,
} from '@src/generated/graphql';
import { logError } from '@src/services/error-logger';

import type { TodoListFormData } from './-schemas/todo-list-schema';

import { TodoListEditForm } from './-components/todo-list-edit-form';

/* TPL_COMPONENT_NAME=TodoListEditPage */
/* TPL_FORM_DATA_NAME=TodoListFormData */
/* TPL_USER_QUERY=TodoListEditByIdDocument */

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/todos/todo-list/$id' /* TPL_ROUTE_PATH:END */,
)({
  component: TodoListEditPage,
  loader: async ({ context: { apolloClient }, params }) => {
    const { id } = params;
    const { data } = await apolloClient.query({
      query: TodoListEditByIdDocument,
      variables: { id },
    });
    return {
      crumb: /* TPL_CRUMB_EXPRESSION:START */ data.todoList.name
        ? data.todoList.name
        : 'Unnamed Todo List' /* TPL_CRUMB_EXPRESSION:END */,
    };
  },
});

function TodoListEditPage(): ReactElement {
  const { id } = Route.useParams();
  const { crumb } = Route.useLoaderData();

  /* TPL_DATA_LOADER:START */

  const { data, error } = useQuery(TodoListEditByIdDocument, {
    variables: { id },
  });

  const initialData: TodoListFormData | undefined = useMemo(() => {
    if (!data?.todoList) return undefined;
    return data.todoList;
  }, [data]);

  const { data: todoListUserOptionsData, error: todoListUserOptionsError } =
    useQuery(GetTodoListUserOptionsDocument);
  /* TPL_DATA_LOADER:END */

  const [
    /* TPL_MUTATION_NAME:START */ updateTodoList /* TPL_MUTATION_NAME:END */,
  ] = useMutation(
    /* TPL_UPDATE_MUTATION:START */ UpdateTodoListDocument /* TPL_UPDATE_MUTATION:END */,
  );
  const navigate = useNavigate();

  /* TPL_DATA_GATE:START */
  if (!initialData || !todoListUserOptionsData) {
    return <ErrorableLoader error={error ?? todoListUserOptionsError} />;
  }
  /* TPL_DATA_GATE:END */

  const submitData = async (formData: TodoListFormData): Promise<void> => {
    await /* TPL_MUTATION_NAME:START */ updateTodoList(
      /* TPL_MUTATION_NAME:END */ {
        variables: { input: { id, data: formData } },
      },
    );
    toast.success('Successfully updated item!');
    navigate({ to: '..' }).catch(logError);
  };

  return (
    <div className="space-y-4">
      <h1 className="flex space-x-2">{crumb}</h1>
      {/* TPL_EDIT_FORM:START */}
      <TodoListEditForm
        submitData={submitData}
        initialData={initialData}
        todoListUserOptions={todoListUserOptionsData.users}
      />
      {/* TPL_EDIT_FORM:END */}
    </div>
  );
}
