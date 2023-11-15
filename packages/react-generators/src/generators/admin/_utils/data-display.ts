import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import { AdminCrudDataDependency } from './data-loaders.js';
import { GraphQLField } from '@src/writers/graphql/index.js';

export interface AdminCrudDisplay {
  content: (itemName: string) => TypescriptCodeExpression;
  graphQLFields: GraphQLField[];
  dataDependencies?: AdminCrudDataDependency[];
  header?: TypescriptCodeBlock;
}
