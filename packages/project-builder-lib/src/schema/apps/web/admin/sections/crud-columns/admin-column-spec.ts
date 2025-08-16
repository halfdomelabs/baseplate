import type { PluginSpecImplementation } from '#src/plugins/spec/types.js';
import type { DefinitionSchemaCreator } from '#src/schema/creator/types.js';

import { createPluginSpec } from '#src/plugins/spec/types.js';

import type { AdminCrudColumnType } from './types.js';

import { BUILT_IN_ADMIN_CRUD_COLUMNS } from './built-in-columns.js';

/**
 * Spec for registering additional admin CRUD table columns
 */
export interface AdminCrudColumnSpec extends PluginSpecImplementation {
  registerAdminCrudColumn: <T extends DefinitionSchemaCreator>(
    column: AdminCrudColumnType<T>,
  ) => void;
  getAdminCrudColumns: () => Map<string, AdminCrudColumnType>;
  getAdminCrudColumn: (name: string) => AdminCrudColumnType;
}

export function createAdminCrudColumnImplementation(): AdminCrudColumnSpec {
  const adminCrudColumns = new Map<string, AdminCrudColumnType>(
    BUILT_IN_ADMIN_CRUD_COLUMNS.map((column) => [column.name, column]),
  );

  return {
    registerAdminCrudColumn(column) {
      if (adminCrudColumns.has(column.name)) {
        throw new Error(
          `Admin CRUD column with name ${column.name} is already registered`,
        );
      }
      adminCrudColumns.set(
        column.name,
        column as unknown as AdminCrudColumnType,
      );
    },
    getAdminCrudColumns() {
      return adminCrudColumns;
    },
    getAdminCrudColumn(name) {
      const column = adminCrudColumns.get(name);
      if (!column) {
        throw new Error(`Unable to find column with name ${name}`);
      }
      return column;
    },
  };
}

/**
 * Spec for adding admin CRUD columns
 */
export const adminCrudColumnSpec = createPluginSpec('core/admin-crud-column', {
  defaultInitializer: createAdminCrudColumnImplementation,
});
