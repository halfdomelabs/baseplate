import { z } from 'zod';

import { zRef } from '@src/references/index.js';
import { featureEntityType } from '@src/schema/features/index.js';

import { adminSectionEntityType } from './types.js';

export const baseAdminSectionValidators = {
  id: z.string().default(adminSectionEntityType.generateNewId()),
  name: z.string().min(1),
  featureRef: zRef(z.string().min(1), {
    type: featureEntityType,
    onDelete: 'RESTRICT',
  }),
  icon: z.string().optional(),
  type: z.string().min(1),
};
