// @ts-nocheck

import { createApolloCache } from '$cache';
import { ApolloClient, ApolloLink } from '@apollo/client';

export function createApolloClient(TPL_CREATE_ARGS): ApolloClient {
  TPL_LINK_BODIES;
  const client = new ApolloClient({
    link: ApolloLink.from(TPL_LINKS),
    cache: createApolloCache(),
  });

  return client;
}
