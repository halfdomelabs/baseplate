import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { createProviderType } from '@baseplate-dev/sync';

import type { GraphQLField } from '#src/writers/graphql/index.js';

export interface AdminCrudAction {
  type: string;
  name: string;
  position: 'inline' | 'dropdown';
  hookContent?: TsCodeFragment;
  siblingContent?: TsCodeFragment;
  action: TsCodeFragment;
  graphQLFields?: GraphQLField[];
  order: number;
}

export interface AdminCrudActionContainer {
  addAction: (action: AdminCrudAction) => void;
  getModelName: () => string;
}

export const adminCrudActionContainerProvider =
  createProviderType<AdminCrudActionContainer>('admin-crud-action-container');
