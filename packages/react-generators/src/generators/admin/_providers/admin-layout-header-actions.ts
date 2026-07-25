import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { createProviderType } from '@baseplate-dev/sync';

export interface AdminLayoutHeaderAction {
  name: string;
  content: TsCodeFragment;
  order: number;
}

export interface AdminLayoutHeaderActionContainer {
  addAction: (action: AdminLayoutHeaderAction) => void;
}

export const adminLayoutHeaderActionContainerProvider =
  createProviderType<AdminLayoutHeaderActionContainer>(
    'admin-layout-header-action-container',
  );
