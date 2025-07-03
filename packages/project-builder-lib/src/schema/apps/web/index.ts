import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { authRoleEntityType } from '#src/schema/auth/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { baseAppValidators } from '../base.js';
import { createAppEntryType } from '../types.js';

export const createWebAppSchema = definitionSchema((ctx) =>
  z.object({
    ...baseAppValidators,
    type: z.literal('web'),
    includeAuth: z.boolean().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    allowedRoles: z
      .array(
        ctx.withRef({
          type: authRoleEntityType,
          onDelete: 'DELETE',
        }),
      )
      .optional(),
    includeUploadComponents: z.boolean().optional(),
    enableSubscriptions: z.boolean().optional(),
  }),
);

export type WebAppConfig = def.InferOutput<typeof createWebAppSchema>;

export const webAppEntryType = createAppEntryType<WebAppConfig>('web');
