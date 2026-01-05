import type { ReactElement } from 'react';

import { useReadQuery } from '@apollo/client/react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { MdAdd } from 'react-icons/md';

import { Button } from '@src/components/ui/button';
import { graphql } from '@src/graphql';

import {
  TodoListTable,
  todoListTableItemsFragment,
} from './-components/todo-list-table';

/* TPL_COMPONENT_NAME=TodoListListPage */

/* TPL_ITEMS_QUERY:START */
const todoListListPageQuery = graphql(
  `
    query TodoListListPage {
      todoLists {
        ...TodoListTable_items
      }
    }
  `,
  [todoListTableItemsFragment],
);
/* TPL_ITEMS_QUERY:END */

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/todos/todo-list/' /* TPL_ROUTE_PATH:END */,
)({
  component: TodoListListPage,
  /* TPL_ROUTE_PROPS:START */ loader: ({ context: { preloadQuery } }) => ({
    queryRef: preloadQuery(todoListListPageQuery),
  }) /* TPL_ROUTE_PROPS:END */,
});

function TodoListListPage(): ReactElement {
  /* TPL_DATA_LOADERS:START */
  const { queryRef } = Route.useLoaderData();

  const { data } = useReadQuery(queryRef);
  /* TPL_DATA_LOADERS:END */

  return (
    <div className="flex max-w-4xl flex-col space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1>
          {/* TPL_PAGE_TITLE:START */}
          Todo Lists
          {/* TPL_PAGE_TITLE:END */}
        </h1>
        {/* TPL_CREATE_BUTTON:START */}

        <div className="block">
          <Link to="/admin/todos/todo-list/new">
            <Button>
              <MdAdd />
              Create Todo List
            </Button>
          </Link>
        </div>
        {/* TPL_CREATE_BUTTON:END */}
      </div>
      {/* TPL_TABLE_COMPONENT:START */}
      <TodoListTable items={data.todoLists} />
      {/* TPL_TABLE_COMPONENT:END */}
    </div>
  );
}
