// @ts-nocheck

import type { introspection } from '$graphqlEnvD';

import { initGraphQLTada } from 'gql.tada';

export const graphql = initGraphQLTada<{
  introspection: introspection;
  scalars: {
    DateTime: string;
    Date: string;
    Uuid: string;
  };
}>();

export type { FragmentOf, ResultOf, VariablesOf } from 'gql.tada';
export { readFragment } from 'gql.tada';
