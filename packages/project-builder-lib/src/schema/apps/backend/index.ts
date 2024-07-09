import { z } from 'zod';

import { baseAppValidators } from '../base.js';
import { createAppEntryType } from '../types.js';

export const backendAppSchema = z.object({
  ...baseAppValidators,
  type: z.literal('backend'),
  enableStripe: z.boolean().optional(),
  enableRedis: z.boolean().optional(),
  enableBullQueue: z.boolean().optional(),
  enablePostmark: z.boolean().optional(),
  enableSendgrid: z.boolean().optional(),
  enableSubscriptions: z.boolean().optional(),
  enableAxios: z.boolean().optional(),
});

export type BackendAppConfig = z.infer<typeof backendAppSchema>;

export const backendAppEntryType =
  createAppEntryType<BackendAppConfig>('backend');
