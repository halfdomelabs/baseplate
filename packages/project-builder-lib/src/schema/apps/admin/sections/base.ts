import { z } from 'zod';

import { randomUid } from '@src/utils/randomUid.js';

export const baseAdminSectionValidators = {
  uid: z.string().default(randomUid),
  name: z.string().min(1),
  feature: z.string().min(1),
  icon: z.string().optional(),
  type: z.string().min(1),
};
