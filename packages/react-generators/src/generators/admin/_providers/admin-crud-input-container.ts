import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { createProviderType } from '@baseplate-dev/sync';

import type { GraphQLField } from '#src/writers/graphql/index.js';

import type { AdminCrudDataDependency } from '../_utils/data-loaders.js';

export interface AdminCrudInputValidation {
  key: string;
  expression: TsCodeFragment;
}

export interface AdminCrudInput {
  order: number;
  content: TsCodeFragment;
  graphQLFields: GraphQLField[];
  validation: AdminCrudInputValidation[];
  dataDependencies?: AdminCrudDataDependency[];
  header?: TsCodeFragment;
}

export interface AdminCrudInputContainer {
  addInput: (input: AdminCrudInput) => void;
  getModelName: () => string;
  isInModal: () => boolean;
}

export const adminCrudInputContainerProvider =
  createProviderType<AdminCrudInputContainer>('admin-crud-input-container');
