import { initGraphQLTada } from 'gql.tada';

import type { introspection } from './graphql-env.d.ts';

export const graphql = initGraphQLTada<{
  introspection: introspection;
  /* TPL_SCALARS:START */ scalars: {
    DateTime: string;
    Date: string;
    Uuid: string;
  } /* TPL_SCALARS:END */;
}>();

export type { FragmentOf, ResultOf, VariablesOf } from 'gql.tada';
export { readFragment } from 'gql.tada';
