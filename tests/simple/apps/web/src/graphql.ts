import { initGraphQLTada } from 'gql.tada';

import type { introspection } from './graphql-env.d';

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
