import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

/**
 * Schema for path provider configuration
 */
export const pathProviderConfigSchema = z.object({
  type: z.literal('path'),
  pathKey: CASE_VALIDATORS.KEBAB_CASE,
  method: z.string(),
});
