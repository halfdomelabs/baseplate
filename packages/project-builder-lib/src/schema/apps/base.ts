import { z } from 'zod';
import { randomUid } from '../../utils/randomUid';

export const baseAppValidators = {
  uid: z.string().default(randomUid),
  name: z.string().min(1),
  type: z.string(),
  packageLocation: z.string().optional(),
} as const;

export const baseAppSchema = z.object(baseAppValidators);

export type BaseAppConfig = z.infer<typeof baseAppSchema>;
