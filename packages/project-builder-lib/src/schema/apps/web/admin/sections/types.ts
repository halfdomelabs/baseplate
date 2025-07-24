import { createEntityType } from '#src/references/index.js';

import { appEntityType } from '../../../types.js';

export const adminSectionEntityType = createEntityType('admin-section', {
  parentType: appEntityType,
});
