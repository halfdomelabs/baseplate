import { z } from 'zod';

import { appEntityType } from './types.js';
import { DASHED_NAME } from '@src/utils/validations.js';

export const baseAppValidators = {
  id: z.string().default(appEntityType.generateNewId()),
  name: DASHED_NAME,
  type: z.string(),
  packageLocation: z.string().optional(),
} as const;

export const baseAppSchema = z.object(baseAppValidators);

export type BaseAppConfig = z.infer<typeof baseAppSchema>;
