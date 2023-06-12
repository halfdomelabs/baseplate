import { z } from 'zod';
import { DASHED_NAME } from '@src/utils/validations.js';
import { randomUid } from '../../utils/randomUid.js';

export const baseAppValidators = {
  uid: z.string().default(randomUid),
  name: DASHED_NAME,
  type: z.string(),
  packageLocation: z.string().optional(),
} as const;

export const baseAppSchema = z.object(baseAppValidators);

export type BaseAppConfig = z.infer<typeof baseAppSchema>;
