import type {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import type { GraphQLField } from '@src/writers/graphql/index.js';

import type { AdminCrudDataDependency } from './data-loaders.js';

export interface AdminCrudDisplay {
  content: (itemName: string) => TypescriptCodeExpression;
  graphQLFields: GraphQLField[];
  dataDependencies?: AdminCrudDataDependency[];
  header?: TypescriptCodeBlock;
}
