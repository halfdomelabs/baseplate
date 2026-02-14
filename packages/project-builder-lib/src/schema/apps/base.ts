import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

import { appEntityType } from './types.js';

export const baseAppValidators = {
  id: z.string().default(appEntityType.generateNewId()),
  name: CASE_VALIDATORS.KEBAB_CASE,
  type: z.string(),
  port: z.number().int().positive().optional(),
} as const;

export const baseAppSchema = z.object(baseAppValidators);

export type BaseAppConfig = z.infer<typeof baseAppSchema>;
