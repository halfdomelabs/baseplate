import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { createProviderType } from '@baseplate-dev/sync';

import type { GraphQLField } from '#src/writers/graphql/graphql.js';

import type { DataLoader } from '../_utils/data-loader.js';

export interface AdminCrudColumn {
  label: string;
  order: number;
  content: (itemName: string) => TsCodeFragment;
  graphQLFields: GraphQLField[];
  dataLoaders?: DataLoader[];
}

export interface AdminCrudColumnContainer {
  addColumn: (input: AdminCrudColumn) => void;
  getModelName: () => string;
}

export const adminCrudColumnContainerProvider =
  createProviderType<AdminCrudColumnContainer>('admin-crud-column-container');
