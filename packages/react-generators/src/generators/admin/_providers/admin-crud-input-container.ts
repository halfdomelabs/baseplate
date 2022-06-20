import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@baseplate/core-generators';
import { createProviderType } from '@baseplate/sync';
import {
  GraphQLField,
  GraphQLFragment,
  GraphQLRoot,
} from '@src/writers/graphql';
import { DataLoader } from './admin-loader';

export interface AdminCrudInputDataDependency {
  propName: string;
  propType: TypescriptCodeExpression;
  propLoaderValueGetter: (value: string) => string;
  loader: DataLoader;
  graphRoots?: GraphQLRoot[];
  graphFragments?: GraphQLFragment[];
}

export interface AdminCrudInput {
  content: TypescriptCodeExpression;
  graphQLFields: GraphQLField[];
  validation: { key: string; expression: TypescriptCodeExpression }[];
  dataDependencies?: AdminCrudInputDataDependency[];
  header?: TypescriptCodeBlock;
}

export interface AdminCrudInputContainer {
  addInput: (input: AdminCrudInput) => void;
  getModelName: () => string;
}

export const adminCrudInputContainerProvider =
  createProviderType<AdminCrudInputContainer>('admin-crud-input-container');
