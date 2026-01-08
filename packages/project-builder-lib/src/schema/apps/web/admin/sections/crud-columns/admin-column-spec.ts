import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

import type { AdminCrudColumnType } from './types.js';

import { BUILT_IN_ADMIN_CRUD_COLUMNS } from './built-in-columns.js';

/**
 * Spec for registering additional admin CRUD table columns
 */
export const adminCrudColumnSpec = createFieldMapSpec(
  'core/admin-crud-column',
  (t) => ({
    columns: t.namedArrayToMap<AdminCrudColumnType>(
      BUILT_IN_ADMIN_CRUD_COLUMNS,
    ),
  }),
);
