import type { ReactElement } from 'react';

import { useReadQuery } from '@apollo/client/react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { MdAdd } from 'react-icons/md';

import { Button } from '@src/components/ui/button';
import { graphql } from '@src/graphql';

import { UserTable, userTableItemsFragment } from './-components/user-table';

/* TPL_COMPONENT_NAME=UserListPage */

/* TPL_ITEMS_QUERY:START */
const userListPageQuery = graphql(
  `
    query UserListPage {
      users {
        ...UserTable_items
      }
    }
  `,
  [userTableItemsFragment],
);
/* TPL_ITEMS_QUERY:END */

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/accounts/users/' /* TPL_ROUTE_PATH:END */,
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
      <div className="flex items-center justify-between gap-4">
        <h1>
          {/* TPL_PAGE_TITLE:START */}
          Users
          {/* TPL_PAGE_TITLE:END */}
        </h1>
        {/* TPL_CREATE_BUTTON:START */}

        <div className="block">
          <Link to="/admin/accounts/users/new">
            <Button>
              <MdAdd />
              Create User
            </Button>
          </Link>
        </div>
        {/* TPL_CREATE_BUTTON:END */}
      </div>
      {/* TPL_TABLE_COMPONENT:START */}
      <UserTable items={data.users} />
      {/* TPL_TABLE_COMPONENT:END */}
    </div>
  );
}
