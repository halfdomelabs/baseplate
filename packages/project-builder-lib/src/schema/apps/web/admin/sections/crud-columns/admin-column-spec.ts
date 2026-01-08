import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

import type { AdminCrudColumnType } from './types.js';

/**
 * Spec for registering additional admin CRUD table columns
 */
export const adminCrudColumnSpec = createFieldMapSpec(
  'core/admin-crud-column',
  (t) => ({
    columns: t.map<string, AdminCrudColumnType>(),
  }),
);
