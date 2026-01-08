import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

import type { AdminCrudInputType } from './types.js';

/**
 * Spec for registering additional admin CRUD form inputs
 */
export const adminCrudInputSpec = createFieldMapSpec(
  'core/admin-crud-input',
  (t) => ({
    inputs: t.namedArray<AdminCrudInputType>(),
  }),
);
