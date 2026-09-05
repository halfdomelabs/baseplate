import type { ReactElement } from 'react';

import { useReadQuery } from '@apollo/client/react';
import {
  Button,
  PageHeader,
  PageHeaderActions,
  PageHeaderTitle,
} from '@prisma-crud/ui-shared';
import { createFileRoute, Link } from '@tanstack/react-router';
import { MdAdd } from 'react-icons/md';

import { graphql } from '@src/gql';

import { TodoListTable } from './-components/todo-list-table';

/* TPL_COMPONENT_NAME=TodoListListPage */

/* TPL_ITEMS_QUERY:START */
export const todoListListPageQuery = graphql(`
  query TodoListListPage {
    todoLists {
      ...TodoListTable_items
    }
  }
`);
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
      <PageHeader className="items-center">
        <PageHeaderTitle>
          {/* TPL_PAGE_TITLE:START */}
          Todo Lists
          {/* TPL_PAGE_TITLE:END */}
        </PageHeaderTitle>
        {/* TPL_CREATE_BUTTON:START */}

        <PageHeaderActions>
          <div className="block">
            <Link to="/admin/todos/todo-list/new">
              <Button>
                <MdAdd />
                Create Todo List
              </Button>
            </Link>
          </div>
        </PageHeaderActions>
        {/* TPL_CREATE_BUTTON:END */}
      </PageHeader>
      {/* TPL_TABLE_COMPONENT:START */}
      <TodoListTable items={data.todoLists} />
      {/* TPL_TABLE_COMPONENT:END */}
    </div>
  );
}
