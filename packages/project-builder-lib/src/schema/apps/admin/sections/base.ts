import { z } from 'zod';

import { zRef } from '@src/references/index.js';
import { featureEntityType } from '@src/schema/features/index.js';
import { randomUid } from '@src/utils/randomUid.js';

export const baseAdminSectionValidators = {
  uid: z.string().default(randomUid),
  name: z.string().min(1),
  feature: zRef(z.string().min(1), {
    type: featureEntityType,
    onDelete: 'RESTRICT',
  }),
  icon: z.string().optional(),
  type: z.string().min(1),
};
