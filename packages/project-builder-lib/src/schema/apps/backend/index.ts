import { z } from 'zod';
import { baseAppValidators } from '../base';

export const backendAppSchema = z.object({
  ...baseAppValidators,
  type: z.literal('backend'),
  enableStripe: z.boolean().optional(),
  enableRedis: z.boolean().optional(),
  enablePostmark: z.boolean().optional(),
  enableSendgrid: z.boolean().optional(),
});

export type BackendAppConfig = z.infer<typeof backendAppSchema>;
