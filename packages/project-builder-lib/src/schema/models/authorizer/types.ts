import { createEntityType } from '#src/references/index.js';

import { modelEntityType } from '../types.js';

/**
 * Entity type for model authorizer roles.
 * Each role is a child of the model it belongs to.
 */
export const modelAuthorizerRoleEntityType = createEntityType(
  'model-authorizer-role',
  { parentType: modelEntityType },
);
