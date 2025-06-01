import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import type { GraphQLField } from '#src/writers/graphql/index.js';

import type { AdminCrudDataDependency } from './data-loaders.js';

export interface AdminCrudDisplay {
  content: (itemName: string) => TsCodeFragment;
  graphQLFields: GraphQLField[];
  dataDependencies?: AdminCrudDataDependency[];
  header?: TsCodeFragment;
}
