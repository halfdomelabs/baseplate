import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

import { libraryEntityType } from './types.js';

export const baseLibraryValidators = {
  id: z.string().default(libraryEntityType.generateNewId()),
  name: CASE_VALIDATORS.KEBAB_CASE,
  type: z.string(),
} as const;

export const baseLibrarySchema = z.object(baseLibraryValidators);

export type BaseLibraryDefinition = z.infer<typeof baseLibrarySchema>;
