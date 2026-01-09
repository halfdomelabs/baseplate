import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

import { libraryEntityType } from './types.js';

export const basePackageValidators = {
  id: z.string().default(libraryEntityType.generateNewId()),
  name: CASE_VALIDATORS.KEBAB_CASE,
  type: z.string(),
} as const;

export const basePackageSchema = z.object(basePackageValidators);

export type BasePackageConfig = z.infer<typeof basePackageSchema>;
