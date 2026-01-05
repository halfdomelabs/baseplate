import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { createProviderType } from '@baseplate-dev/sync';

import type { GraphQLField } from '#src/writers/graphql/index.js';

import type { DataLoader } from '../_utils/data-loader.js';

export interface AdminCrudAction {
  type: string;
  name: string;
  position: 'inline' | 'dropdown';
  hookContent?: TsCodeFragment;
  siblingContent?: TsCodeFragment;
  action: TsCodeFragment;
  graphQLFields?: GraphQLField[];
  dataLoaders?: DataLoader[];
  order: number;
}

export interface AdminCrudActionContainer {
  addAction: (action: AdminCrudAction) => void;
  getModelName: () => string;
  /**
   * Gets the name of the parent component that contains the action.
   */
  getParentComponentName: () => string;
  /**
   * Gets the path of the parent component that contains the action.
   */
  getParentComponentPath: () => string;
  /**
   * Gets the variable name of the items fragment that is used in the parent component.
   */
  getItemsFragmentVariable: () => string;
}

export const adminCrudActionContainerProvider =
  createProviderType<AdminCrudActionContainer>('admin-crud-action-container');
