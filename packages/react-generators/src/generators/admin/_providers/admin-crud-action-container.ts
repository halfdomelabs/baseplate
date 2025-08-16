import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { createProviderType } from '@baseplate-dev/sync';

export interface AdminCrudAction {
  type: string;
  name: string;
  position: 'inline' | 'dropdown';
  hookContent?: TsCodeFragment;
  siblingContent?: TsCodeFragment;
  action: TsCodeFragment;
  order: number;
}

export interface AdminCrudActionContainer {
  addAction: (action: AdminCrudAction) => void;
  getModelName: () => string;
}

export const adminCrudActionContainerProvider =
  createProviderType<AdminCrudActionContainer>('admin-crud-action-container');
