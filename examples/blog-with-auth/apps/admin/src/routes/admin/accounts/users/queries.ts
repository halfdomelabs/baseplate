import { graphql } from '@src/graphql';

import { userRowFragment } from './-components/user-table';

/* TPL_GET_ITEMS_QUERY:START */
export const usersQuery = graphql(
  `
    query Users {
      users {
        ...UserTable_items
      }
    }
  `,
  [userRowFragment],
);
/* TPL_GET_ITEMS_QUERY:END */
