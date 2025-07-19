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
    adminConfig: z
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
  }),
);

export type WebAppConfig = def.InferOutput<typeof createWebAppSchema>;

export const webAppEntryType = createAppEntryType<WebAppConfig>('web');
