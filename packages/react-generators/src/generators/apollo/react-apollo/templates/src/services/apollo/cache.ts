// @ts-nocheck

import { InMemoryCache } from '@apollo/client';

export function createApolloCache(): InMemoryCache {
  return new InMemoryCache({});
}
