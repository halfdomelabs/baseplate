import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

import type { AdminCrudActionType } from './types.js';

/**
 * Spec for registering additional admin CRUD table actions
 */
export const adminCrudActionSpec = createFieldMapSpec(
  'core/admin-crud-action',
  (t) => ({
    actions: t.namedArrayToMap<AdminCrudActionType>(),
  }),
);
