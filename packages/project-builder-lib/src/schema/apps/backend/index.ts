import { z } from 'zod';
import { baseAppValidators } from '../base.js';

export const backendAppSchema = z.object({
  ...baseAppValidators,
  type: z.literal('backend'),
  enableStripe: z.boolean().optional(),
  enableRedis: z.boolean().optional(),
  enableBullQueue: z.boolean().optional(),
  enablePostmark: z.boolean().optional(),
  enableSendgrid: z.boolean().optional(),
  enableSubscriptions: z.boolean().optional(),
});

export type BackendAppConfig = z.infer<typeof backendAppSchema>;
