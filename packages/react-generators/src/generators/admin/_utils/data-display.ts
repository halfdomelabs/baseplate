import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';
import { GraphQLField } from '@src/writers/graphql/index.js';
import { AdminCrudDataDependency } from './data-loaders.js';

export interface AdminCrudDisplay {
  content: (itemName: string) => TypescriptCodeExpression;
  graphQLFields: GraphQLField[];
  dataDependencies?: AdminCrudDataDependency[];
  header?: TypescriptCodeBlock;
}
