import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

import { packageEntityType } from './types.js';

export const basePackageValidators = {
  id: z.string().default(packageEntityType.generateNewId()),
  name: CASE_VALIDATORS.KEBAB_CASE,
  type: z.string(),
} as const;

export const basePackageSchema = z.object(basePackageValidators);

export type BasePackageConfig = z.infer<typeof basePackageSchema>;
