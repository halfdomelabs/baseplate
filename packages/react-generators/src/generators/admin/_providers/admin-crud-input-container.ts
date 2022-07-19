import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@baseplate/core-generators';
import { createProviderType } from '@baseplate/sync';
import { GraphQLField } from '@src/writers/graphql';
import { AdminCrudDataDependency } from '../_utils/data-loaders';

export interface AdminCrudInput {
  content: TypescriptCodeExpression;
  graphQLFields: GraphQLField[];
  validation: { key: string; expression: TypescriptCodeExpression }[];
  dataDependencies?: AdminCrudDataDependency[];
  header?: TypescriptCodeBlock;
}

export interface AdminCrudInputContainer {
  addInput: (input: AdminCrudInput) => void;
  getModelName: () => string;
}

export const adminCrudInputContainerProvider =
  createProviderType<AdminCrudInputContainer>('admin-crud-input-container');
