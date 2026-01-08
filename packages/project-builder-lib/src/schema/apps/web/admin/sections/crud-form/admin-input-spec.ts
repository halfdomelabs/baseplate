import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

import type { AdminCrudInputType } from './types.js';

import { BUILT_IN_ADMIN_CRUD_INPUTS } from './built-in-input.js';

/**
 * Spec for registering additional admin CRUD form inputs
 */
export const adminCrudInputSpec = createFieldMapSpec(
  'core/admin-crud-input',
  (t) => ({
    inputs: t.namedArrayToMap<AdminCrudInputType>(BUILT_IN_ADMIN_CRUD_INPUTS),
  }),
);
