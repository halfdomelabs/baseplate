import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { authRoleEntityType } from '#src/schema/auth/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { baseAppValidators } from '../base.js';
import { createAppEntryType } from '../types.js';
import { createAdminCrudSectionSchema } from './admin/sections/crud.js';
import { adminSectionEntityType } from './admin/sections/types.js';

// Admin section schema for web apps (copied from admin app schema)
export const createWebAdminSectionSchema = definitionSchema((ctx) =>
  ctx.withRefBuilder(createAdminCrudSectionSchema(ctx), (builder) => {
    builder.addEntity({
      type: adminSectionEntityType,
      parentPath: { context: 'app' },
      addContext: 'admin-section',
    });
  }),
);

export type WebAdminSectionConfig = def.InferOutput<
  typeof createWebAdminSectionSchema
>;

export type WebAdminSectionConfigInput = def.InferInput<
  typeof createWebAdminSectionSchema
>;

export const createWebAppSchema = definitionSchema((ctx) =>
  z.object({
    ...baseAppValidators,
    type: z.literal('web'),
    includeAuth: z.boolean().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
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
    adminConfig: ctx.withDefault(
      z
        .object({
          enabled: z.boolean(),
          pathPrefix: z.string().default('/admin'),
          allowedRoles: z
            .array(
              ctx.withRef({
                type: authRoleEntityType,
                onDelete: 'DELETE',
              }),
            )
            .optional(),
          sections: z.array(createWebAdminSectionSchema(ctx)).optional(),
        })
        .optional(),
      undefined,
    ),
  }),
);

export type WebAppConfig = def.InferOutput<typeof createWebAppSchema>;

export const webAppEntryType = createAppEntryType<WebAppConfig>('web');
