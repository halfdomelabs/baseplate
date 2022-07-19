import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@baseplate/core-generators';
import { GraphQLField } from '@src/writers/graphql';
import { AdminCrudDataDependency } from './data-loaders';

export interface AdminCrudDisplay {
  content: (itemName: string) => TypescriptCodeExpression;
  graphQLFields: GraphQLField[];
  dataDependencies?: AdminCrudDataDependency[];
  header?: TypescriptCodeBlock;
}
