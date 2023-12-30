import { appEntityType } from '../../types.js';
import { createEntityType } from '@src/references/index.js';

export const adminSectionEntityType = createEntityType('admin-section', {
  parentType: appEntityType,
});
