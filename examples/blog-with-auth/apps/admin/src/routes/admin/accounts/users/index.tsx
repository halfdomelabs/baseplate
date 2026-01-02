import type { ReactElement } from 'react';

import { useReadQuery } from '@apollo/client/react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { MdAdd } from 'react-icons/md';

import { Button } from '@src/components/ui/button';
import { graphql } from '@src/graphql';

import { UserTable, userTableItemsFragment } from './-components/user-table';

/* TPL_GET_ITEMS_QUERY:START */
export const userListUsersQuery = graphql(
  `
    query UserListUsers {
      users {
        ...UserTable_items
      }
    }
  `,
  [userTableItemsFragment],
);
/* TPL_GET_ITEMS_QUERY:END */

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/accounts/users/' /* TPL_ROUTE_PATH:END */,
)({
  component: /* TPL_PAGE_NAME:START */ UserListPage /* TPL_PAGE_NAME:END */,
  loader: ({ context: { preloadQuery } }) => ({
    queryRef: preloadQuery(userListUsersQuery),
  }),
});

function /* TPL_PAGE_NAME:START */ UserListPage /* TPL_PAGE_NAME:END */(): ReactElement {
  /* TPL_DATA_LOADER:START */
  const { queryRef } = Route.useLoaderData();
  const { data } = useReadQuery(queryRef);
  /* TPL_DATA_LOADER:END */

  return (
    <div className="flex max-w-4xl flex-col space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1>
          {/* TPL_TITLE:START */}
          User Management
          {/* TPL_TITLE:END */}
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
