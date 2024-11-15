import type {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import { createProviderType } from '@halfdomelabs/sync';

import type { GraphQLField } from '@src/writers/graphql/index.js';

import type { AdminCrudDataDependency } from '../_utils/data-loaders.js';

export interface AdminCrudInputValidation {
  key: string;
  expression: TypescriptCodeExpression;
}

export interface AdminCrudInput {
  content: TypescriptCodeExpression;
  graphQLFields: GraphQLField[];
  validation: AdminCrudInputValidation[];
  dataDependencies?: AdminCrudDataDependency[];
  header?: TypescriptCodeBlock;
}

export interface AdminCrudInputContainer {
  addInput: (input: AdminCrudInput) => void;
  getModelName: () => string;
  isInModal: () => boolean;
}

export const adminCrudInputContainerProvider =
  createProviderType<AdminCrudInputContainer>('admin-crud-input-container');
