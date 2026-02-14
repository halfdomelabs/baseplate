import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchemaWithSlots } from '#src/schema/creator/schema-creator.js';

import { baseAppValidators } from '../base.js';
import { appEntityType, createAppEntryType } from '../types.js';
import { createAdminAppSchema } from './admin/admin.js';

export const createWebAppSchema = definitionSchemaWithSlots(
  { appSlot: appEntityType },
  (ctx, { appSlot }) =>
    z.object({
      ...baseAppValidators,
      port: z.number().int().positive(),
      type: z.literal('web'),
      includeAuth: ctx.withDefault(z.boolean(), false),
      title: z.string().default(''),
      description: z.string().default(''),
      includeUploadComponents: ctx.withDefault(z.boolean(), false),
      enableSubscriptions: ctx.withDefault(z.boolean(), false),
      adminApp: createAdminAppSchema(ctx, { appSlot }),
    }),
);

export type WebAppConfig = def.InferOutput<typeof createWebAppSchema>;

export const webAppEntryType = createAppEntryType<WebAppConfig>('web');
