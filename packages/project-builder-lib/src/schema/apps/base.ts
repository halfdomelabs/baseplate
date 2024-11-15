import { z } from 'zod';

import { DASHED_NAME } from '@src/utils/validations.js';

import { appEntityType } from './types.js';

export const baseAppValidators = {
  id: z.string().default(appEntityType.generateNewId()),
  name: DASHED_NAME,
  type: z.string(),
  packageLocation: z
    .string()
    .regex(
      /^(?!.*(?:\/|\.\.)\/)(?!^\.\.$)(?!^\.$)(?:[\w\-.]+\/?)+[\w\-.]*|^$/,
      {
        message: 'Invalid package location. Must be a valid subdirectory.',
      },
    )
    .optional(),
} as const;

export const baseAppSchema = z.object(baseAppValidators);

export type BaseAppConfig = z.infer<typeof baseAppSchema>;
