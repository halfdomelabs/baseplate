import { createProviderType } from '@halfdomelabs/sync';

import type { AdminCrudDisplay } from '../_utils/data-display.js';

export interface AdminCrudDisplayContainer {
  addDisplay: (input: AdminCrudDisplay) => void;
  getModelName: () => string;
}

export const adminCrudDisplayContainerProvider =
  createProviderType<AdminCrudDisplayContainer>('admin-crud-display-container');
