import { createProviderType } from '@baseplate/sync';
import { AdminCrudDisplay } from '../_utils/data-display';

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
