import { InMemoryCache } from '@apollo/client';
import { relayStylePagination } from '@apollo/client/utilities';

export function createApolloCache(): InMemoryCache {
  return new InMemoryCache({
    typePolicies: /* TPL_TYPE_POLICIES:START */ {
      Query: { fields: { notificationFeed: relayStylePagination() } },
    } /* TPL_TYPE_POLICIES:END */,
  });
}
