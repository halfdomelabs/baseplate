import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { authRoleEntityType } from '#src/schema/auth/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { baseAppValidators } from '../base.js';
import { createAppEntryType } from '../types.js';
import { createAdminAppSchema } from './admin/admin.js';

export const createWebAppSchema = definitionSchema((ctx) =>
  z.object({
    ...baseAppValidators,
    type: z.literal('web'),
    includeAuth: ctx.withDefault(z.boolean(), false),
    title: z.string().default(''),
    description: z.string().default(''),
    allowedRoles: ctx.withDefault(
      z.array(
        ctx.withRef({
          type: authRoleEntityType,
          onDelete: 'DELETE',
        }),
      ),
      [],
    ),
    includeUploadComponents: ctx.withDefault(z.boolean(), false),
    enableSubscriptions: ctx.withDefault(z.boolean(), false),
    adminApp: createAdminAppSchema(ctx),
  }),
);

export type WebAppConfig = def.InferOutput<typeof createWebAppSchema>;

export const webAppEntryType = createAppEntryType<WebAppConfig>('web');
