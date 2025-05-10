// @ts-nocheck

import type { NormalizedCacheObject } from '@apollo/client';

import { ApolloClient, from } from '@apollo/client';

import { createApolloCache } from './cache.js';

export function createApolloClient(
  TPL_CREATE_ARGS,
): ApolloClient<NormalizedCacheObject> {
  TPL_LINK_BODIES;
  const client = new ApolloClient({
    link: from(TPL_LINKS),
    cache: createApolloCache(),
  });

  return client;
}
