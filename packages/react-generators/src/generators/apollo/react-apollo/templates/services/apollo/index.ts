// @ts-nocheck

import { ApolloClient, from, NormalizedCacheObject } from '@apollo/client';
import { createApolloCache } from './cache';

function createApolloClient(): ApolloClient<NormalizedCacheObject> {
  LINK_BODIES;

  const client = new ApolloClient({
    link: from(LINKS),
    cache: createApolloCache(),
  });

  return client;
}

export const apolloClient = createApolloClient();
