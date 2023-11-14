import { createProviderType } from '@halfdomelabs/sync';

import { AdminCrudDisplay } from '../_utils/data-display.js';

export interface AdminCrudColumn {
  label: string;
  display: AdminCrudDisplay;
}

export interface AdminCrudColumnContainer {
  addColumn: (input: AdminCrudColumn) => void;
  getModelName: () => string;
}

export const adminCrudColumnContainerProvider =
  createProviderType<AdminCrudColumnContainer>('admin-crud-column-container');
