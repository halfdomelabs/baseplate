import { z } from 'zod';

import { baseAppValidators } from '../base.js';
import { createAppEntryType } from '../types.js';
import { zRef } from '@src/references/index.js';
import { authRoleEntityType } from '@src/schema/auth/types.js';

export const webAppSchema = z.object({
  ...baseAppValidators,
  type: z.literal('web'),
  includeAuth: z.boolean().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  allowedRoles: z
    .array(
      zRef(z.string().min(1), {
        type: authRoleEntityType,
        onDelete: 'DELETE',
      }),
    )
    .optional(),
  includeUploadComponents: z.boolean().optional(),
  enableSubscriptions: z.boolean().optional(),
  enableDatadog: z.boolean().optional(),
});

export type WebAppConfig = z.infer<typeof webAppSchema>;

export const webAppEntryType = createAppEntryType<WebAppConfig>('web');
