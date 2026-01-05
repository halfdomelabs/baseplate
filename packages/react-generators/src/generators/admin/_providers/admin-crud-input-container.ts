import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { createProviderType } from '@baseplate-dev/sync';

import type { GraphQLField } from '#src/writers/graphql/index.js';

import type { DataLoader } from '../_utils/data-loader.js';

export interface AdminCrudInputValidation {
  key: string;
  expression: TsCodeFragment;
}

export interface AdminCrudInput {
  order: number;
  content: TsCodeFragment;
  graphQLFields: GraphQLField[];
  validation: AdminCrudInputValidation[];
  dataLoaders?: DataLoader[];
  header?: TsCodeFragment;
}

export interface AdminCrudInputContainer {
  addInput: (input: AdminCrudInput) => void;
  getModelName: () => string;
  getParentComponentName: () => string;
  getParentComponentPath: () => string;
  isInModal: () => boolean;
}

export const adminCrudInputContainerProvider =
  createProviderType<AdminCrudInputContainer>('admin-crud-input-container');
