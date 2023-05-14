import { createProviderType } from '@halfdomelabs/sync';
import { AdminCrudDisplay } from '../_utils/data-display';

export interface AdminCrudDisplayContainer {
  addDisplay: (input: AdminCrudDisplay) => void;
  getModelName: () => string;
}

export const adminCrudDisplayContainerProvider =
  createProviderType<AdminCrudDisplayContainer>('admin-crud-display-container');
