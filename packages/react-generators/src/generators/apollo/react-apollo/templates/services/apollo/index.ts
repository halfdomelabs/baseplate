// @ts-nocheck

import { ApolloClient, from, NormalizedCacheObject } from '@apollo/client';
import { createApolloCache } from './cache';

export function createApolloClient(
  CREATE_ARGS
): ApolloClient<NormalizedCacheObject> {
  LINK_BODIES;

  const client = new ApolloClient({
    link: from(LINKS),
    cache: createApolloCache(),
  });

  return client;
}
