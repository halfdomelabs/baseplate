// @ts-nocheck

import { InMemoryCache } from '@apollo/client';

export function createApolloCache(): InMemoryCache {
  return new InMemoryCache({ typePolicies: TPL_TYPE_POLICIES });
}
