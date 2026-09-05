import type { ReactElement } from 'react';

import { useReadQuery } from '@apollo/client/react';
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderTitle,
} from '@prisma-crud/ui-shared';
import { createFileRoute } from '@tanstack/react-router';

import { graphql } from '@src/gql';

import { UserTable } from './-components/user-table';

/* TPL_COMPONENT_NAME=UserListPage */

/* TPL_ITEMS_QUERY:START */
export const userListPageQuery = graphql(`
  query UserListPage {
    users {
      ...UserTable_items
    }
  }
`);
/* TPL_ITEMS_QUERY:END */

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/accounts/users/user/' /* TPL_ROUTE_PATH:END */,
)({
  component: UserListPage,
  /* TPL_ROUTE_PROPS:START */ loader: ({ context: { preloadQuery } }) => ({
    queryRef: preloadQuery(userListPageQuery),
  }) /* TPL_ROUTE_PROPS:END */,
});

function UserListPage(): ReactElement {
  /* TPL_DATA_LOADERS:START */
  const { queryRef } = Route.useLoaderData();

  const { data } = useReadQuery(queryRef);
  /* TPL_DATA_LOADERS:END */

  return (
    <div className="flex max-w-4xl flex-col space-y-4">
      <PageHeader className="items-center">
        <PageHeaderTitle>
          {/* TPL_PAGE_TITLE:START */}
          Users
          {/* TPL_PAGE_TITLE:END */}
        </PageHeaderTitle>
        <PageHeaderActions>
          {/* TPL_CREATE_BUTTON:START */}

          {/* TPL_CREATE_BUTTON:END */}
        </PageHeaderActions>
      </PageHeader>
      {/* TPL_TABLE_COMPONENT:START */}
      <UserTable items={data.users} />
      {/* TPL_TABLE_COMPONENT:END */}
    </div>
  );
}
