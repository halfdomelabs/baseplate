import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

import type { AdminCrudActionType } from './types.js';

import { BUILT_IN_ADMIN_CRUD_ACTIONS } from './built-in-actions.js';

/**
 * Spec for registering additional admin CRUD table actions
 */
export const adminCrudActionSpec = createFieldMapSpec(
  'core/admin-crud-action',
  (t) => ({
    actions: t.namedArrayToMap<AdminCrudActionType>(
      BUILT_IN_ADMIN_CRUD_ACTIONS,
    ),
  }),
);
